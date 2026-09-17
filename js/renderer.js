import { GAMEPLAY } from './engine.js';
const W = 960,
  H = 576,
  CELL = 48;
const ASSETS = ['player', 'guard', 'gem', 'painting', 'statue', 'exit', 'decoy', 'emp', 'wall', 'floor', 'vase', 'column', 'museum'];
export async function loadArt() {
  const art = {};
  await Promise.all(ASSETS.map(name => new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => {
      art[name] = i;
      resolve();
    };
    i.onerror = () => reject(new Error(`Ressource graphique introuvable : ${name}`));
    i.src = `assets/graphics/${name}.svg`;
  })));
  return art;
}
export class Renderer {
  constructor(canvas, art) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.art = art;
    this.particles = [];
    this.pulses = [];
    this.pointer = null;
    this.reduced = false;
    this.fps = 60;
    this.last = 0;
    this.background = null;
    this.level = null;
  }
  configure(level) {
    this.level = level;
    this.particles = [];
    this.pulses = [];
    const bg = document.createElement('canvas');
    bg.width = W;
    bg.height = H;
    const c = bg.getContext('2d');
    c.fillStyle = '#151e28';
    c.fillRect(0, 0, W, H);
    for (let y = 0; y < 12; y++) for (let x = 0; x < 20; x++) {
      const wall = level.tiles[y][x] === '#',
        px = x * CELL,
        py = y * CELL;
      c.fillStyle = wall ? '#283743' : (x + y) % 2 ? '#1a2731' : '#1c2a34';
      c.fillRect(px, py, CELL, CELL);
      c.globalAlpha = wall ? .075 : .022;
      c.drawImage(this.art[wall ? 'wall' : 'floor'], px + 3, py + 3, 42, 42);
      c.globalAlpha = 1;
      if (wall) {
        c.strokeStyle = '#48606a66';
        c.strokeRect(px + .5, py + .5, 47, 47);
        if (y < 11 && level.tiles[y + 1][x] !== '#') {
          c.fillStyle = '#070f1880';
          c.fillRect(px, py + CELL, CELL, 9);
          c.fillStyle = '#68818a66';
          c.fillRect(px, py + CELL - 3, CELL, 3);
        }
      } else {
        c.strokeStyle = '#adbec408';
        c.strokeRect(px + .5, py + .5, 47, 47);
      }
    }
    // Gallery lighting and brass inlay remain subordinate to the bank textures.
    for (const item of level.loot) {
      const x = item.x * 48 + 24,
        y = item.y * 48 + 24;
      const g = c.createRadialGradient(x, y, 2, x, y, 105);
      g.addColorStop(0, '#dfc98d12');
      g.addColorStop(1, '#dfc98d00');
      c.fillStyle = g;
      c.fillRect(x - 105, y - 105, 210, 210);
    }
    c.strokeStyle = '#d8b76b25';
    c.lineWidth = 1;
    c.strokeRect(55, 55, 850, 466);
    c.font = '9px Manrope, sans-serif';
    c.fillStyle = '#a5b1b340';
    c.textAlign = 'left';
    c.fillText(`VESPER COLLECTION     /     GALERIE ${String(level.id).padStart(2, '0')}`, 62, 32);
    c.textAlign = 'right';
    c.fillText('ACCÈS RÉSERVÉ', 895, 551);
    this.background = bg;
  }
  icon(name, x, y, size, angle = 0, alpha = 1) {
    const c = this.ctx,
      i = this.art[name];
    if (!i) return;
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    c.globalAlpha = alpha;
    c.drawImage(i, -size / 2, -size / 2, size, size);
    c.restore();
  }
  event(event) {
    const p = event.item || event.decoy;
    if (p) {
      this.pulses.push({
        x: p.x,
        y: p.y,
        life: 0,
        color: event.type === 'pickup' ? '#d8b76b' : '#91d7cf'
      });
      if (event.type === 'pickup' && !this.reduced) for (let i = 0; i < 18; i++) this.particles.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(i) * 35 * (1 + i % 3),
        vy: Math.sin(i) * 35 * (1 + i % 3),
        life: 1
      });
    }
    if (event.type === 'emp') this.pulses.push({
      x: 480,
      y: 288,
      life: 0,
      color: '#7bbfd1',
      emp: true
    });
  }
  cone(sim, g, sneak) {
    const c = this.ctx,
      range = g.visionRange ?? sim.guardVisionRange ?? GAMEPLAY.visionRange,
      half = GAMEPLAY.visionHalfAngle,
      points = [];
    for (let i = 0; i <= 24; i++) {
      const a = g.angle - half + i / 24 * half * 2;
      let r = 0;
      for (; r <= range; r += 6) if (!sim.walkable(Math.floor((g.x + Math.cos(a) * r) / 48), Math.floor((g.y + Math.sin(a) * r) / 48))) break;
      points.push({
        x: g.x + Math.cos(a) * Math.min(r, range),
        y: g.y + Math.sin(a) * Math.min(r, range)
      });
    }
    c.beginPath();
    c.moveTo(g.x, g.y);
    for (const p of points) c.lineTo(p.x, p.y);
    c.closePath();
    const grad = c.createRadialGradient(g.x, g.y, 0, g.x, g.y, range);
    grad.addColorStop(0, g.seesPlayer ? '#ef786f65' : '#d8b76b38');
    grad.addColorStop(1, g.seesPlayer ? '#ef786f0d' : '#d8b76b06');
    c.fillStyle = grad;
    c.fill();
    c.strokeStyle = g.seesPlayer ? '#ef786f77' : '#d8b76b25';
    c.lineWidth = 1;
    c.stroke();
  }
  draw(sim, dt, {
    sneak = false,
    diagnostics = false,
    frameTime = dt
  } = {}) {
    const c = this.ctx;
    this.fps = this.fps * .95 + 1 / Math.max(frameTime, .001) * .05;
    c.clearRect(0, 0, W, H);
    if (this.background) c.drawImage(this.background, 0, 0);
    const time = sim.time;
    const ready = sim.loot.every(a => a.collected);
    c.save();
    c.translate(sim.exit.x, sim.exit.y);
    c.fillStyle = ready ? '#8ccfb11c' : '#cad6d008';
    c.fillRect(-20, -20, 40, 40);
    c.strokeStyle = ready ? '#8ccfb199' : '#c9d1c733';
    c.lineWidth = 1;
    c.strokeRect(-20, -20, 40, 40);
    c.restore();
    this.icon('exit', sim.exit.x, sim.exit.y, 27, 0, ready ? 1 : .4);
    if (ready) {
      c.fillStyle = '#8ccfb1';
      c.font = '8px Manrope';
      c.textAlign = 'center';
      c.fillText('SORTIE', sim.exit.x, sim.exit.y + 32);
    }
    for (const g of sim.guards) this.cone(sim, g, sneak);
    if (sim.targetPath.length) {
      c.save();
      c.setLineDash([2, 7]);
      c.strokeStyle = '#a7d5ce44';
      c.beginPath();
      c.moveTo(sim.player.x, sim.player.y);
      for (const p of sim.targetPath) c.lineTo(p.x, p.y);
      c.stroke();
      c.restore();
      const end = sim.targetPath.at(-1);
      c.strokeStyle = '#a7d5ce88';
      c.beginPath();
      c.arc(end.x, end.y, 8, 0, Math.PI * 2);
      c.stroke();
    }
    for (const l of sim.lasers) {
      const active = l.active;
      c.save();
      c.strokeStyle = active ? '#ef786f' : '#799ba533';
      c.lineWidth = active ? 2 : 1;
      c.shadowColor = '#ef786f';
      c.shadowBlur = active ? 9 : 0;
      if (!active) c.setLineDash([3, 5]);
      c.beginPath();
      c.moveTo(l.a.x, l.a.y);
      c.lineTo(l.b.x, l.b.y);
      c.stroke();
      c.restore();
      for (const p of [l.a, l.b]) {
        c.fillStyle = active ? '#ffada5' : '#5b7f8a';
        c.beginPath();
        c.arc(p.x, p.y, 4, 0, Math.PI * 2);
        c.fill();
      }
    }
    for (const item of sim.loot) {
      if (item.collected) {
        c.strokeStyle = '#d8b76b19';
        c.strokeRect(item.x - 14, item.y - 14, 28, 28);
        continue;
      }
      const pulse = this.reduced ? 0 : Math.sin(time * 2 + item.id) * 2;
      c.save();
      c.shadowColor = '#d8b76b';
      c.shadowBlur = 8;
      c.strokeStyle = '#d8b76b66';
      c.strokeRect(item.x - 19, item.y - 19, 38, 38);
      c.restore();
      this.icon(item.asset, item.x, item.y + pulse, 28);
      c.fillStyle = '#d8b76b';
      c.textAlign = 'center';
      c.font = '8px Manrope';
      c.fillText(String(item.id + 1).padStart(2, '0'), item.x, item.y + 32);
    }
    for (const d of sim.decoys) {
      const r = 12 + time * 25 % 35;
      c.strokeStyle = '#91d7cf77';
      c.beginPath();
      c.arc(d.x, d.y, r, 0, Math.PI * 2);
      c.stroke();
      this.icon('decoy', d.x, d.y, 17);
    }
    for (const g of sim.guards) {
      c.fillStyle = '#08101988';
      c.beginPath();
      c.ellipse(g.x, g.y + 12, 14, 7, 0, 0, Math.PI * 2);
      c.fill();
      this.icon('guard', g.x, g.y, 30);
      c.fillStyle = g.seesPlayer ? '#ef786f' : '#d8b76b';
      c.beginPath();
      const a = g.angle;
      c.moveTo(g.x + Math.cos(a) * 24, g.y + Math.sin(a) * 24);
      c.lineTo(g.x + Math.cos(a + .23) * 18, g.y + Math.sin(a + .23) * 18);
      c.lineTo(g.x + Math.cos(a - .23) * 18, g.y + Math.sin(a - .23) * 18);
      c.closePath();
      c.fill();
      if (g.investigatingUntil > time) {
        c.font = 'bold 13px Manrope';
        c.textAlign = 'center';
        c.fillStyle = '#91d7cf';
        c.fillText('?', g.x, g.y - 24);
      }
    }
    const p = sim.player;
    c.fillStyle = '#080f17aa';
    c.beginPath();
    c.ellipse(p.x, p.y + 13, 14, 7, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = sim.detection > .05 ? '#ef786f' : '#91d7cf66';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(p.x, p.y, 19, 0, Math.PI * 2);
    c.stroke();
    this.icon('player', p.x, p.y, 29);
    if (sneak) {
      c.strokeStyle = '#91d7cf44';
      c.setLineDash([2, 4]);
      c.beginPath();
      c.arc(p.x, p.y, 25, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);
    }
    if (time < 3) {
      c.font = '8px Manrope';
      c.textAlign = 'center';
      c.fillStyle = '#a7d5ce';
      c.fillText('VOUS', p.x, p.y + 32);
    }
    for (const pulse of this.pulses) {
      pulse.life += dt;
      c.globalAlpha = Math.max(0, 1 - pulse.life);
      c.strokeStyle = pulse.color;
      c.lineWidth = pulse.emp ? 3 : 2;
      c.beginPath();
      c.arc(pulse.x, pulse.y, 12 + pulse.life * (pulse.emp ? 650 : 65), 0, Math.PI * 2);
      c.stroke();
    }
    c.globalAlpha = 1;
    this.pulses = this.pulses.filter(p => p.life < 1);
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      c.globalAlpha = Math.max(0, p.life);
      c.fillStyle = '#d8b76b';
      c.beginPath();
      c.arc(p.x, p.y, 2, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
    this.particles = this.particles.filter(p => p.life > 0);
    if (diagnostics) {
      c.strokeStyle = '#70d9af66';
      c.lineWidth = 1;
      for (const g of sim.guards) {
        c.beginPath();
        g.path.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y));
        c.closePath();
        c.stroke();
      }
      c.strokeStyle = '#91d7cf';
      c.strokeRect(p.x - 11, p.y - 11, 22, 22);
    }
    const vignette = c.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 600);
    vignette.addColorStop(0, '#050a1000');
    vignette.addColorStop(1, '#050a1066');
    c.fillStyle = vignette;
    c.fillRect(0, 0, W, H);
  }
}
