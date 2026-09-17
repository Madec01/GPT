import * as THREE from '../vendor/three.module.js';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { clone as cloneSkeleton } from '../vendor/SkeletonUtils.js';

const ASSET_ROOT = new URL('../../assets/abysse/models/', import.meta.url);
const MODEL_NAMES = ['submarine', 'rock1', 'rock2', 'rock3', 'fish', 'manta', 'whale', 'anglerfish', 'shark', 'wreck', 'container', 'buoy', 'plant', 'grass', 'coral1', 'coral2', 'kelp'];
const clamp = THREE.MathUtils.clamp;
const seeded = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const xy = value => ({ x: value?.x ?? value?.position?.x ?? 0, y: value?.y ?? value?.position?.y ?? 0 });

/** Three scene only: simulation uses metres, positive Y down. */
export class AbyssRenderer {
  constructor(canvas, { quality = 'high', reducedMotion = false } = {}) {
    this.canvas = canvas;
    this.quality = quality;
    this.reducedMotion = reducedMotion;
    this.time = 0;
    this.models = new Map();
    this.dynamic = new Map();
    this.animations = new Map();
    this.mixers = [];
    this.cameraTarget = new THREE.Vector3();
    this.cameraReady = false;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: quality !== 'eco', alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'eco' ? 1 : 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#03141f');
    this.scene.fog = new THREE.FogExp2('#062731', 0.010);
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.3, 300);
    this.camera.position.set(0, 0, 70);
    this.world = new THREE.Group();
    this.scenery = new THREE.Group();
    this.creatures = new THREE.Group();
    this.scene.add(this.world, this.scenery, this.creatures);
    this.scene.add(new THREE.HemisphereLight('#8ae9df', '#021017', 2.8));
    const key = new THREE.DirectionalLight('#bbf7ed', 3.2);
    key.position.set(-25, 45, 35);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight('#18719e', 3.5);
    rim.position.set(30, 0, -30);
    this.scene.add(rim);
    this.headlight = new THREE.SpotLight('#e0fcda', 260, 75, 0.38, 0.85, 1.2);
    this.scene.add(this.headlight, this.headlight.target);
    this.glow = new THREE.PointLight('#78e7dc', 45, 19, 1.6);
    this.scene.add(this.glow);
    this._createParticles();
    this._createLightRays();
    this.sonar = new THREE.Mesh(new THREE.RingGeometry(0.975, 1, 128), new THREE.MeshBasicMaterial({ color: '#8dfff0', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    this.sonar.position.z = 4;
    this.scene.add(this.sonar);
    this.tetherLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: '#d9dac0', transparent: true, opacity: 0.85 }));
    this.scene.add(this.tetherLine);
    this.resize();
  }

  async init() {
    const loader = new GLTFLoader();
    // Every visual object is an attributed bank model; no substitute geometry.
    await Promise.all(MODEL_NAMES.map(async name => {
      const gltf = await loader.loadAsync(new URL(`${name}.glb`, ASSET_ROOT).href);
      const root = gltf.scene;
      if (name === 'submarine') {
        // The source's three orange blades share this shaft centre.
        const propeller = new THREE.Group();
        propeller.name = 'BathysPropeller';
        propeller.position.set(-1215, 477, -2847);
        const blades = ['Box20179', 'Box20180', 'Box20181'].map(part => root.getObjectByName(part)).filter(Boolean);
        root.add(propeller);
        for (const blade of blades) { root.remove(blade); blade.position.sub(propeller.position); propeller.add(blade); }
      }
      if (['submarine', 'fish', 'manta', 'whale', 'shark', 'anglerfish'].includes(name)) root.rotation.y = Math.PI / 2;
      root.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(root);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const normalized = new THREE.Group();
      root.position.sub(center);
      normalized.add(root);
      normalized.scale.setScalar(1 / Math.max(size.x, size.y, size.z, 0.001));
      const template = new THREE.Group();
      template.add(normalized);
      this.models.set(name, template);
      this.animations.set(name, gltf.animations ?? []);
      template.userData.bounds = { x: size.x / Math.max(size.x, size.y, size.z), y: size.y / Math.max(size.x, size.y, size.z), z: size.z / Math.max(size.x, size.y, size.z) };
    }));
    this.submarine = this._model('submarine', 5.2);
    this.scene.add(this.submarine);
    this.propeller = this.submarine.getObjectByName('BathysPropeller');
    this.setLevel(null);
    return this;
  }

  _model(name, size = 1) {
    const template = this.models.get(name);
    const model = template ? cloneSkeleton(template) : null;
    if (!model) throw new Error(`Modèle absent : ${name}`);
    model.scale.setScalar(size);
    const clips = this.animations.get(name);
    if (clips?.length) {
      const mixer = new THREE.AnimationMixer(model);
      const swim = clips.find(clip => /Swimming_Normal/i.test(clip.name)) ?? clips.find(clip => /Swim/i.test(clip.name)) ?? clips[0];
      mixer.clipAction(swim).play();
      this.mixers.push(mixer);
    }
    return model;
  }

  _releaseObject(object) {
    // Model geometries/materials belong to the shared asset cache. Only dispose
    // instance skeletons and feedback geometry created for this level.
    object.traverse(child => {
      if (child.isSkinnedMesh) child.skeleton?.dispose();
      if (child.userData.transient) {
        child.geometry?.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        for (const material of materials) material?.dispose();
      }
    });
    this.mixers = this.mixers.filter(mixer => {
      if (mixer.getRoot() !== object) return true;
      mixer.stopAllAction();
      mixer.uncacheRoot(object);
      return false;
    });
  }

  _clear(group) {
    while (group.children.length) {
      const child = group.children[0];
      this._releaseObject(child);
      group.remove(child);
    }
  }

  setLevel(level) {
    this.level = level;
    this.cameraReady = false;
    this._clear(this.scenery);
    this._clear(this.creatures);
    this._clear(this.world);
    this.dynamic.clear();
    this.fishSchools = [];
    const random = seeded((level?.id?.toString().split('').reduce((n, c) => n + c.charCodeAt(0), 9) ?? 19) * 139);
    const width = level?.width ?? level?.bounds?.width ?? 190;
    const height = level?.height ?? level?.bounds?.height ?? 90;
    this.worldWidth = width;
    this.worldHeight = height;
    const palette = level?.palette ?? {};
    this.scene.fog.color.set(palette.fog ?? '#062731');
    this.scene.background.set(palette.water ?? palette.background ?? '#03141f');
    // Three depth layers give the same authored rocks different silhouettes.
    for (let layer = 0; layer < 3; layer++) {
      const spacing = layer === 0 ? 15 : 22;
      for (let x = -60; x < width + 70; x += spacing) {
        const rock = this._model(`rock${1 + Math.floor(random() * 3)}`, 19 + random() * 26);
        rock.position.set(x, -height + 1 + random() * 11 - layer * 5, -12 - layer * 24);
        rock.scale.y *= 0.65 + random() * 1.3;
        rock.rotation.set(random() * 0.5, random() * 6.28, random() * 0.6);
        this.scenery.add(rock);
      }
    }
    // Distant eroded pillars keep even open water spatially legible.
    for (let i = 0; i < 9; i++) {
      const cliff = this._model(`rock${i % 3 + 1}`, 48 + random() * 30);
      cliff.position.set(-25 + i * (width + 40) / 8, -height * (.55 + random() * .25), -58 - random() * 20);
      cliff.scale.y *= 1.6;
      cliff.rotation.y = random() * 6;
      this.scenery.add(cliff);
      if (i % 2 === 0) {
        const coral = this._model(i % 4 ? 'coral1' : 'coral2', 10);
        coral.position.set(cliff.position.x, -height * .38, -48);
        this.scenery.add(coral);
      }
    }
    const obstacles = level?.obstacles ?? level?.rocks ?? [];
    obstacles.forEach((obstacle, i) => {
      const rock = this._model(`rock${i % 3 + 1}`, 1);
      const p = xy(obstacle);
      const w = obstacle.w ?? obstacle.width ?? (obstacle.radius ?? obstacle.r ?? 6) * 2;
      const h = obstacle.h ?? obstacle.height ?? w;
      const extent = rock.userData.bounds;
      rock.scale.set(w / extent.x, h / extent.y, Math.min(w, h) * 0.85 / extent.z);
      const rectangle = obstacle.w !== undefined || obstacle.width !== undefined;
      rock.position.set(p.x + (rectangle ? w / 2 : 0), -p.y - (rectangle ? h / 2 : 0), -2);
      this.scenery.add(rock);
    });
    const dock = level?.dock ?? { x: width * 0.3, y: height * 0.35, r: 8 };
    this.dock = this._model('buoy', 9);
    this.dock.position.set(dock.x, -dock.y + 5, -6);
    this.scenery.add(this.dock);
    this.dockRing = new THREE.Mesh(new THREE.RingGeometry(dock.r - 0.12, dock.r, 96), new THREE.MeshBasicMaterial({ color: '#7affdf', transparent: true, opacity: .28, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    this.dockRing.userData.transient = true;
    this.dockRing.position.set(dock.x, -dock.y, 1);
    this.world.add(this.dockRing);
    const refuges = level?.refuges ?? [];
    refuges.forEach(refuge => {
      for (let i = 0; i < 12; i++) {
        const plant = this._model(i % 2 ? 'plant' : 'grass', 4 + random() * 5);
        plant.position.set(refuge.x + (random() - .5) * refuge.r * 1.6, -refuge.y - refuge.r * .45, -2 - random() * 5);
        plant.rotation.y = random() * 6.28;
        this.scenery.add(plant);
      }
    });
    for (let i = 0; i < 24; i++) {
      const plant = this._model(['coral1', 'coral2', 'kelp', 'grass'][i % 4], 3 + random() * 6);
      plant.position.set(random() * width, -height + 12, -7 - random() * 15);
      this.scenery.add(plant);
    }
    // Background wrecks tell the scale of the abandoned industrial site.
    for (let i = 0; i < 3; i++) {
      const wreck = this._model('wreck', 21 + i * 7);
      wreck.position.set(width * (0.18 + i * 0.31), -height * (i === 0 ? .66 : .87) + i * 3, -20 - i * 11);
      wreck.rotation.set(0, 0.25, -0.12 + i * 0.11);
      this.scenery.add(wreck);
    }
    for (let i = 0; i < (this.quality === 'eco' ? 10 : 22); i++) {
      const fish = this._model(i % 9 === 0 ? 'manta' : 'fish', i % 9 === 0 ? 5 : 0.65 + random() * 1.2);
      const home = new THREE.Vector3(random() * width, -8 - random() * (height - 15), -8 - random() * 35);
      fish.position.copy(home);
      this.creatures.add(fish);
      this.fishSchools.push({ model: fish, home, phase: random() * 6.28, speed: 0.2 + random() * 0.3 });
    }
    this.whale = this._model('whale', 43);
    this.whale.position.set(width * 0.52, -height * 0.56, -90);
    this.whale.rotation.y = 0.15;
    this.scenery.add(this.whale);
  }

  _createParticles() {
    const random = seeded(8914);
    const count = this.quality === 'eco' ? 160 : 440;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (random() - 0.5) * 150;
      positions[i * 3 + 1] = (random() - 0.5) * 100;
      positions[i * 3 + 2] = (random() - 0.5) * 65;
      sizes[i] = 0.8 + random() * 2.6;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.particleMaterial = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { time: { value: 0 } },
      vertexShader: `attribute float size; uniform float time; varying float a; void main(){vec3 p=position;p.y=mod(p.y+time*.32+50.,100.)-50.;p.x+=sin(time*.2+p.y*.1)*.35;vec4 v=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*v;gl_PointSize=size*70./max(20.,-v.z);a=.1+size*.065;}`,
      fragmentShader: `varying float a;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(.55,.94,.9,smoothstep(.5,.05,d)*a);}`
    });
    this.particles = new THREE.Points(geometry, this.particleMaterial);
    this.scene.add(this.particles);
  }

  _createLightRays() {
    this.rays = new THREE.Group();
    this.rayMaterial = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { time: { value: 0 } },
      vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying vec2 vUv;uniform float time;void main(){float edge=pow(sin(vUv.x*3.14159),3.);float fade=pow(vUv.y,1.6);float flutter=.7+.3*sin(time*.35+vUv.y*8.);gl_FragColor=vec4(.18,.7,.66,edge*fade*flutter*.105);}`
    });
    for (let i = 0; i < 5; i++) {
      const ray = new THREE.Mesh(new THREE.PlaneGeometry(9 + i * 2, 120), this.rayMaterial);
      ray.position.set((i - 2) * 27, 12, -30 - i * 2);
      ray.rotation.z = -0.22;
      this.rays.add(ray);
    }
    this.scene.add(this.rays);
  }

  _syncEntities(sim) {
    const items = [];
    const add = (collection, type, model, size) => (collection ?? []).forEach((entity, i) => items.push({ entity, key: `${type}:${entity.id ?? i}`, model, size }));
    add(sim.entities?.filter(e => e.type === 'cargo'), 'cargo', 'container', 2.5);
    add(sim.entities?.filter(e => e.type === 'beacon'), 'beacon', 'buoy', 4);
    add(sim.creatures ?? sim.enemies ?? sim.hazards, 'enemy', 'anglerfish', 5);
    
    const seen = new Set();
    for (const { entity, key, model, size } of items) {
      if (entity.collected || entity.delivered || entity.recovered || entity.dead) continue;
      seen.add(key);
      let object = this.dynamic.get(key);
      if (!object) {
        object = this._model(entity.type === 'shark' ? 'shark' : model, entity.size ?? size);
        const marker = new THREE.Mesh(new THREE.RingGeometry(.82, .9, 48), new THREE.MeshBasicMaterial({ color: key.startsWith('enemy') ? '#ff735c' : '#8fffe0', transparent: true, opacity: .45, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
        marker.userData.transient = true;
        marker.position.z = .7;
        object.add(marker);
        object.userData.marker = marker;
        this.world.add(object);
        this.dynamic.set(key, object);
      }
      const p = xy(entity);
      object.position.set(p.x, -p.y, 1);
      object.rotation.z = entity.angle ? -entity.angle : Math.sin(this.time + p.x) * 0.05;
      if (key.startsWith('enemy')) {
        const previousX = object.userData.previousX;
        const movementX = previousX === undefined ? 0 : p.x - previousX;
        const directionX = Math.abs(movementX) > .0001 ? movementX : entity.state === 'charge' ? entity.dx : undefined;
        if (directionX !== undefined && directionX !== 0) object.rotation.y = directionX < 0 ? Math.PI : 0;
        object.userData.previousX = p.x;
        object.scale.setScalar(entity.state === 'windup' ? size * (1 + .08 * Math.sin(this.time * 28)) : size);
      }
      if (key.startsWith('beacon')) object.position.y += Math.sin(this.time * 1.5 + p.x) * .12;
      const marker = object.userData.marker;
      if (marker) {
        marker.visible = key.startsWith('enemy') ? ['windup', 'charge'].includes(entity.state) : true;
        marker.material.color.set(entity.locked ? '#ffc578' : entity.active ? '#82eecd' : key.startsWith('enemy') ? '#ff735c' : '#a7eee5');
        marker.material.opacity = key.startsWith('enemy') ? .45 + Math.sin(this.time * 20) * .25 : .35 + Math.sin(this.time * 2) * .1;
        marker.rotation.y = -object.rotation.y;
      }
      object.visible = true;
    }
    for (const [key, object] of this.dynamic) if (!seen.has(key)) { this._releaseObject(object); this.world.remove(object); this.dynamic.delete(key); }
  }

  render(sim, dt = 1 / 60) {
    if (!this.submarine) return;
    this.time += Math.min(dt, 0.05);
    const t = this.time;
    const player = sim?.player ?? sim?.submarine ?? sim?.sub;
    const p = player ? xy(player) : { x: this.worldWidth * 0.34 + Math.sin(t * 0.11) * 9, y: this.worldHeight * 0.48 + Math.sin(t * 0.28) * 2 };
    const vx = player?.vx ?? 1.3;
    const vy = player?.vy ?? 0;
    if (this.propeller) this.propeller.rotation.z += dt * (3 + Math.hypot(vx, vy) * 2);
    this.submarine.position.set(p.x, -p.y + (this.reducedMotion ? 0 : Math.sin(t * 1.5) * 0.08), 2);
    const facing = player?.facing ?? (vx < -0.1 ? -1 : vx > 0.1 ? 1 : this.facing ?? 1);
    this.facing = facing;
    this.submarine.rotation.y = facing < 0 ? Math.PI : 0;
    this.submarine.rotation.z = clamp(-vy * 0.025 * facing, -0.2, 0.2);
    this.headlight.position.set(p.x + facing * 2, -p.y, 5);
    this.headlight.target.position.set(p.x + facing * 30, -p.y - 3, -5);
    this.headlight.intensity = player?.light === false || sim?.lightOn === false ? 0 : 260;
    this.glow.position.set(p.x, -p.y + 2, 7);
    const lookAhead = sim ? clamp(vx * 0.9, -8, 8) : -18;
    const wanted = new THREE.Vector3(p.x + lookAhead, -p.y + 2, 0);
    if (!this.cameraReady) { this.cameraTarget.copy(wanted); this.cameraReady = true; }
    this.cameraTarget.lerp(wanted, 1 - Math.exp(-dt * 3));
    const distance = sim ? (this.camera.aspect < 1.2 ? 86 / this.camera.aspect : 72) : (this.camera.aspect < 1.2 ? 65 / this.camera.aspect : 55);
    this.camera.position.set(this.cameraTarget.x, this.cameraTarget.y + 1.8, distance);
    this.camera.lookAt(this.cameraTarget);
    this.particles.position.set(this.cameraTarget.x, this.cameraTarget.y, -3);
    this.rays.position.set(this.cameraTarget.x * 0.8, this.cameraTarget.y + 25, 0);
    this.particleMaterial.uniforms.time.value = this.reducedMotion ? 0 : t;
    this.rayMaterial.uniforms.time.value = this.reducedMotion ? 0 : t;
    for (const school of this.fishSchools) {
      school.model.position.x = school.home.x + Math.sin(t * school.speed * 0.2 + school.phase) * 12;
      school.model.position.y = school.home.y + Math.sin(t * school.speed + school.phase) * 1.1;
      school.model.rotation.y = Math.cos(t * school.speed * 0.2 + school.phase) < 0 ? Math.PI : 0;
      school.model.rotation.z = Math.sin(t * 2 + school.phase) * 0.04;
    }
    if (sim) this._syncEntities(sim);
    const sonar = sim?.sonarPulse;
    const radius = sonar?.r ?? 0;
    this.sonar.visible = radius > 0;
    if (radius > 0) {
      this.sonar.position.set(sonar?.x ?? p.x, -(sonar?.y ?? p.y), 4);
      this.sonar.scale.setScalar(radius);
      this.sonar.material.opacity = clamp(1 - radius / 65, 0, 0.65);
    }
    this.tetherLine.visible = !!sim?.tether;
    if (sim?.tether) {
      const positions = this.tetherLine.geometry.attributes.position;
      positions.setXYZ(0, p.x, -p.y - .5, 3);
      positions.setXYZ(1, sim.tether.x, -sim.tether.y, 3);
      positions.needsUpdate = true;
      this.tetherLine.geometry.computeBoundingSphere();
    }
    this.dockRing.material.opacity = .22 + Math.sin(t * 2) * .07;
    for (const mixer of this.mixers) mixer.update(Math.min(dt, .05));
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  }

  setOptions({ quality, reducedMotion } = {}) {
    if (reducedMotion !== undefined) this.reducedMotion = reducedMotion;
    if (quality) { this.quality = quality; this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'eco' ? 1 : 1.75)); this.resize(); }
  }

  dispose() {
    for (const mixer of this.mixers) { mixer.stopAllAction(); mixer.uncacheRoot(mixer.getRoot()); }
    this.mixers = [];
    const geometries = new Set(), materials = new Set(), textures = new Set(), skeletons = new Set();
    this.scene.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.skeleton) skeletons.add(object.skeleton);
      for (const material of (Array.isArray(object.material) ? object.material : [object.material])) if (material) {
        materials.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
      }
    });
    skeletons.forEach(value => value.dispose());
    geometries.forEach(value => value.dispose());
    materials.forEach(value => value.dispose());
    textures.forEach(value => value.dispose());
    this.renderer.dispose();
  }
}
