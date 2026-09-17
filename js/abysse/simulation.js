const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const copy = value => JSON.parse(JSON.stringify(value));

/** Pure, deterministic metre-based simulation. Rendering and audio consume events. */
export class Simulation {
  constructor(level, { testMode = false } = {}) {
    this.level = copy(level);
    this.testMode = testMode;
    this.player = { ...level.spawn, vx: 0, vy: 0, r: 1.7, hull: 100, energy: 100, cargo: [], tether: null, light: true };
    this.entities = (level.objects || []).map((o, i) => ({ id: `object-${i}`, type: 'cargo', r: 1.2, mass: 1, vx: 0, vy: 0, revealed: false, recovered: false, active: false, cutProgress: 0, cutTime: 3, ...copy(o) }));
    this.creatures = (level.creatures || []).map((c, i) => ({ id: `creature-${i}`, r: 2.3, speed: 6, state: 'patrol', timer: 0, waypoint: 0, home: {x:c.x,y:c.y}, target: null, ...copy(c) }));
    this.events = [];
    this.time = 0;
    this.status = 'playing';
    this.delivered = 0;
    this.requiredDelivered = 0;
    this.sonarCooldown = 0;
    this.sonarPulse = null;
    this.damageCooldown = 0;
    this.previous = {};
    this.stats = { sonar: 0, collisions: 0, damage: 0, brokenTethers: 0 };
  }

  emit(type, data = {}) { this.events.push({ type, ...data }); }
  drainEvents() { return this.events.splice(0); }
  get tether() { return this.entities.find(o => o.id === this.player.tether) || null; }
  get inRefuge() { return (this.level.refuges || []).some(r => distance(this.player, r) < (r.r || 8)); }
  get objectivesComplete() {
    const objectives = this.level.objectives || {cargo: 1};
    const beacons = objectives.beacons || 0;
    const complete = Array.isArray(beacons)
      ? beacons.every(id => this.entities.some(o => o.id === id && o.active))
      : this.entities.filter(o => o.type === 'beacon' && o.active).length >= beacons;
    return this.requiredDelivered >= (objectives.cargo || 0) && complete;
  }

  update(dt, input = {}) {
    if (this.status !== 'playing' || !Number.isFinite(dt) || dt <= 0) return;
    // A stalled tab never fast-forwards predators or crushes the player.
    dt = Math.min(dt, 0.1);
    const actions = {sonar: !!input.sonar && !this.previous.sonar, interact: !!input.interact && !this.previous.interact};
    this.previous = {...input};
    this.time += dt;
    this.sonarCooldown = Math.max(0, this.sonarCooldown - dt);
    this.damageCooldown = Math.max(0, this.damageCooldown - dt);
    if (typeof input.light === 'boolean') this.player.light = input.light;
    if (actions.sonar) this.ping();
    if (actions.interact) this.interact();
    const steps = Math.ceil(dt / (1 / 60));
    for (let i = 0; i < steps; i++) this.step(dt / steps, input);
    if (this.sonarPulse) {
      this.sonarPulse.age += dt;
      this.sonarPulse.r = this.sonarPulse.age * 42;
      if (this.sonarPulse.age > 1.8) this.sonarPulse = null;
    }
    if (this.player.hull <= 0) { this.status = 'lost'; this.emit('lost'); }
    else if (this.objectivesComplete && distance(this.player, this.level.dock) < (this.level.dock.r || 7)) {
      this.status = 'won'; this.emit('won', {time: this.time});
    }
  }

  step(dt, input) {
    const p = this.player;
    const nearDock = distance(p, this.level.dock) < (this.level.dock.r || 7);
    p.energy = Math.min(100, p.energy + dt * (nearDock ? 22 : 3.5));
    if (nearDock) p.hull = Math.min(100, p.hull + dt * 9);
    let ix = clamp(Number(input.x) || 0, -1, 1), iy = clamp(Number(input.y) || 0, -1, 1);
    const length = Math.hypot(ix, iy);
    if (length > 1) { ix /= length; iy /= length; }
    const boosting = input.boost && p.energy > 2 && length > 0;
    if (boosting) p.energy = Math.max(0, p.energy - dt * 13);
    const mass = this.tether?.mass || 0;
    const thrust = (boosting ? 40 : 26) / (1 + mass * .35);
    p.vx += ix * thrust * dt;
    p.vy += iy * thrust * dt;
    const drag = Math.exp(-dt * (length > 0 ? 1.9 : 2.5));
    p.vx *= drag; p.vy *= drag;
    for (const c of this.level.current || this.level.currents || []) {
      if (p.x >= c.x && p.x <= c.x+c.w && p.y >= c.y && p.y <= c.y+c.h) {
        p.vx += (c.dx || 0) * dt; p.vy += (c.dy || 0) * dt;
      }
    }
    p.x += p.vx * dt; p.y += p.vy * dt;
    this.collide(p, true);
    for (const o of this.entities) {
      if (o.recovered) continue;
      if (distance(p,o) < (p.light ? 23 : 7)) o.revealed = true;
      if (o.locked && input.cut && (!this.level.tools || this.level.tools.includes('cut')) && distance(p,o) < 7 && p.energy > 0) {
        o.cutProgress += dt;
        p.energy = Math.max(0, p.energy-dt*5);
        if (o.cutProgress >= o.cutTime) {o.locked = false; this.emit('cutComplete',{id:o.id,x:o.x,y:o.y});}
      }
    }
    const cargo = this.tether;
    if (cargo) {
      const d = distance(p,cargo);
      if (d > 14) { p.tether = null; this.stats.brokenTethers++; this.emit('tetherBroken'); }
      else {
        if (d > 3.6) { const force = (d - 3.6) * 11; cargo.vx += (p.x-cargo.x)/d*force*dt; cargo.vy += (p.y-cargo.y)/d*force*dt; }
        cargo.vx *= Math.exp(-dt*2.2); cargo.vy *= Math.exp(-dt*2.2);
        for (const flow of this.level.current || this.level.currents || []) {
          if(cargo.x>=flow.x&&cargo.x<=flow.x+flow.w&&cargo.y>=flow.y&&cargo.y<=flow.y+flow.h){cargo.vx+=(flow.dx||0)*dt;cargo.vy+=(flow.dy||0)*dt;}
        }
        cargo.x += cargo.vx*dt; cargo.y += cargo.vy*dt;
        this.collide(cargo, false);
        if (distance(cargo,this.level.dock) < (this.level.dock.r || 7)) {
          cargo.recovered = true; p.tether = null; p.cargo.push(cargo.id); this.delivered++;
          if(cargo.required !== false)this.requiredDelivered++;
          this.emit('delivered',{id:cargo.id,delivered:this.delivered});
        }
      }
    }
    const cutting = input.cut && this.entities.some(o=>o.locked && distance(p,o)<7);
    for (const c of this.creatures) this.updateCreature(c, dt, boosting || cutting);
  }

  ping() {
    if ((this.level.tools && !this.level.tools.includes('sonar')) || this.sonarCooldown > 0 || this.player.energy < 18) {this.emit('unavailable',{reason:'sonar'}); return;}
    const p = this.player;
    p.energy -= 18; this.sonarCooldown = 3.5; this.stats.sonar++;
    this.sonarPulse = {x:p.x,y:p.y,r:0,age:0};
    for (const o of this.entities) {
      if (distance(p,o) <= 65) o.revealed = true;
      if (o.type === 'beacon' && distance(p,o) <= 12) this.activate(o);
    }
    for (const c of this.creatures) if (distance(p,c) < 75 && !['charge','windup'].includes(c.state)) {
      c.state = 'investigate'; c.target = {x:p.x,y:p.y}; c.timer = 9;
    }
    this.emit('sonar',{x:p.x,y:p.y});
  }

  activate(o) {
    if (o.active) return;
    if ((o.requires || []).some(id => !this.entities.find(e => e.id === id)?.active)) { this.emit('unavailable',{reason:'sequence',id:o.id}); return; }
    o.active = true; o.revealed = true; this.emit('beaconActivated',{id:o.id,x:o.x,y:o.y});
  }

  interact() {
    if (this.player.tether) {this.emit('detached',{id:this.player.tether}); this.player.tether=null; return;}
    const candidates = this.entities.filter(o => !o.recovered && !o.active && distance(this.player,o)<7).sort((a,b)=>distance(this.player,a)-distance(this.player,b));
    const o = candidates[0];
    if (!o) {this.emit('unavailable',{reason:'range'}); return;}
    if (o.locked) {this.emit('unavailable',{reason:'locked',id:o.id}); return;}
    if (o.type === 'beacon') {this.activate(o); return;}
    this.player.tether=o.id; this.emit('attached',{id:o.id});
  }

  hurt(amount, source) {
    if (this.damageCooldown > 0 || this.testMode) return;
    this.player.hull = Math.max(0,this.player.hull-amount);
    this.damageCooldown=1.2; this.stats.damage+=amount;
    this.emit('damage',{amount,source,x:this.player.x,y:this.player.y});
  }

  collide(body, damage) {
    const bounds = this.level.bounds;
    body.x=clamp(body.x,body.r,bounds.width-body.r);
    body.y=clamp(body.y,body.r,bounds.height-body.r);
    for (const o of this.level.obstacles || []) {
      let nx, ny, penetration;
      if (o.r) {
        const dx=body.x-o.x,dy=body.y-o.y,d=Math.hypot(dx,dy);
        if (d>=body.r+o.r) continue;
        nx=d>0?dx/d:1; ny=d>0?dy/d:0; penetration=body.r+o.r-d;
      } else {
        const qx=clamp(body.x,o.x,o.x+o.w),qy=clamp(body.y,o.y,o.y+o.h);
        const dx=body.x-qx,dy=body.y-qy,d=Math.hypot(dx,dy);
        if (d>=body.r) continue;
        if (d>0) {nx=dx/d;ny=dy/d;penetration=body.r-d;}
        else {
          const sides=[{d:body.x-o.x,nx:-1,ny:0},{d:o.x+o.w-body.x,nx:1,ny:0},{d:body.y-o.y,nx:0,ny:-1},{d:o.y+o.h-body.y,nx:0,ny:1}].sort((a,b)=>a.d-b.d);
          ({nx,ny}=sides[0]);penetration=body.r+sides[0].d;
        }
      }
      body.x+=nx*penetration;body.y+=ny*penetration;
      const impact=body.vx*nx+body.vy*ny;
      if (impact<0) {body.vx-=impact*nx*1.15;body.vy-=impact*ny*1.15;}
      if (damage && impact < -7 && this.damageCooldown <= 0) {this.stats.collisions++;this.hurt(Math.min(15,Math.abs(impact)*.65),'collision');}
    }
  }

  updateCreature(c,dt,boosting) {
    const oldX=c.x,oldY=c.y;
    const p=this.player,d=distance(c,p);
    c.timer-=dt;
    const protectedByDock=distance(p,this.level.dock)<(this.level.dock.r||7)+3;
    const sightBlocked=(this.level.obstacles||[]).some(o=>{
      for(let t=0;t<=1;t+=1/Math.max(1,Math.ceil(d/1.5))){
        const x=c.x+(p.x-c.x)*t,y=c.y+(p.y-c.y)*t;
        if(o.r?Math.hypot(x-o.x,y-o.y)<o.r:x>o.x&&x<o.x+o.w&&y>o.y&&y<o.y+o.h)return true;
      }
      return false;
    });
    const visible=!sightBlocked && !this.inRefuge && !protectedByDock && d < (p.light ? 27 : boosting ? 22 : 10);
    if (c.state==='windup') {
      if (c.timer<=0) {c.state='charge';c.timer=1.05; const td=distance(c,c.target)||1;c.dx=(c.target.x-c.x)/td;c.dy=(c.target.y-c.y)/td;this.emit('charge',{id:c.id});}
    } else if (c.state==='charge') {
      c.x+=c.dx*29*dt;c.y+=c.dy*29*dt;
      if (!protectedByDock && d<c.r+p.r+1) {this.hurt(24,'creature');c.state='rest';c.timer=2.5;}
      if (c.timer<=0) {c.state='rest';c.timer=2.5;}
    } else if (c.state==='rest') {
      if(c.timer<=0){c.state='patrol';c.timer=0;}
    } else if (visible && d<19) {
      c.state='windup';c.timer=.95;c.target={x:p.x+p.vx*.35,y:p.y+p.vy*.35};this.emit('warning',{id:c.id,x:c.x,y:c.y});
    } else {
      if(visible){c.state='investigate';c.target={x:p.x,y:p.y};c.timer=4;}
      if(c.state==='investigate' && c.timer<=0)c.state='patrol';
      const patrol=c.patrol?.length?c.patrol:[c.home,{x:c.home.x+12,y:c.home.y}];
      const target=c.state==='investigate'?c.target:patrol[c.waypoint%patrol.length];
      if(target){const td=distance(c,target);if(td>1){c.x+=(target.x-c.x)/td*c.speed*dt;c.y+=(target.y-c.y)/td*c.speed*dt;}else if(c.state==='patrol')c.waypoint++;}
    }
    c.x=clamp(c.x,c.r,this.level.bounds.width-c.r);c.y=clamp(c.y,c.r,this.level.bounds.height-c.r);
    c.vx=(c.x-oldX)/dt;c.vy=(c.y-oldY)/dt;
    this.collide(c,false);
    if(c.state==='patrol' && Math.hypot(c.x-oldX,c.y-oldY)<dt*c.speed*.15)c.waypoint++;
  }
}
