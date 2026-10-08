/**
 * Particules simples : un bassin de sprites réutilisés, sans gravité, qui
 * s'éloignent, ralentissent et s'effacent. Règle du GDD : rien ne masque la
 * trajectoire, donc les particules restent petites, brèves et sous les corps.
 */
import type { Graphics} from 'pixi.js';
import { Container, Sprite, type Texture } from 'pixi.js';

interface Particle {
  node: Sprite | Graphics;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  spin: number;
}

export interface BurstOptions {
  count: number;
  speed: number;
  life: number;
  size: number;
  color: number;
  texture: Texture | null;
  /** Direction privilégiée en radians écran, ou `null` pour toutes les directions. */
  angle: number | null;
  spread: number;
}

export class ParticleSystem {
  readonly root = new Container();
  private readonly particles: Particle[] = [];
  private readonly pool: Particle[] = [];
  private seed = 1;

  /** Pseudo-aléatoire local au rendu : jamais dans la simulation. */
  private random(): number {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  burst(x: number, y: number, options: BurstOptions): void {
    for (let i = 0; i < options.count; i++) {
      const base = options.angle ?? this.random() * Math.PI * 2;
      const a = base + (this.random() - 0.5) * options.spread;
      const speed = options.speed * (0.5 + this.random());
      const p = this.pool.pop() ?? this.create();
      if (p.node instanceof Sprite) {
        if (options.texture) {
          p.node.texture = options.texture;
          p.node.tint = options.color;
        }
        p.node.visible = true;
      } else {
        p.node.clear();
        p.node.circle(0, 0, options.size / 2).fill(options.color);
      }
      p.node.x = x;
      p.node.y = y;
      p.node.alpha = 1;
      p.node.rotation = this.random() * Math.PI * 2;
      p.vx = Math.cos(a) * speed;
      p.vy = Math.sin(a) * speed;
      p.life = 0;
      p.maxLife = options.life * (0.7 + this.random() * 0.6);
      p.size = options.size * (0.6 + this.random() * 0.8);
      p.spin = (this.random() - 0.5) * 8;
      this.particles.push(p);
      this.root.addChild(p.node);
    }
  }

  private create(): Particle {
    const node = new Sprite();
    node.anchor.set(0.5);
    return { node, vx: 0, vy: 0, life: 0, maxLife: 1, size: 8, spin: 0 };
  }

  /** `dt` en secondes. */
  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!;
      p.life += dt;
      const k = p.life / p.maxLife;
      if (k >= 1) {
        p.node.visible = false;
        this.root.removeChild(p.node);
        this.particles.splice(i, 1);
        this.pool.push(p);
        continue;
      }
      const damping = 1 - 3 * dt;
      p.vx *= damping;
      p.vy *= damping;
      p.node.x += p.vx * dt;
      p.node.y += p.vy * dt;
      p.node.rotation += p.spin * dt;
      p.node.alpha = 1 - k * k;
      if (p.node instanceof Sprite && p.node.texture.width > 0) {
        const s = (p.size * (1 - k * 0.5)) / p.node.texture.width;
        p.node.scale.set(s);
      } else {
        p.node.scale.set(1 - k * 0.5);
      }
    }
  }

  get count(): number {
    return this.particles.length;
  }
}
