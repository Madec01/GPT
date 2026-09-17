// Recorded music and samples only. No generated oscillators.
export class Soundscape {
  constructor(options) {
    this.options = options;
    this.tracks = new Map();
    this.effects = new Map();
    this.active = null;
    this.suspended = false;
    this.enabled = false;
    this.engine = null;
    this.engineLevel = 0;
    this.cutCooldown = 0;
  }
  configure(manifest) { this.manifest = manifest; }
  unlock() { this.enabled = true; if (this.active) this.play(this.active); }
  play(name) {
    const changed = this.active !== name;
    this.active = name;
    if (!this.enabled || this.suspended || !this.manifest?.music?.[name]) return;
    for (const [key, a] of this.tracks) if (key !== name) a.pause();
    let a = this.tracks.get(name);
    if (!a) { a = new Audio(this.manifest.music[name]); a.loop = true; a.preload = 'auto'; this.tracks.set(name, a); }
    a.volume = this.options.music;
    if (changed || a.paused) a.play().catch(() => {});
  }
  effect(name) {
    if (!this.enabled || this.suspended || !this.options.effects) return;
    const path = this.manifest?.effects?.[name];
    if (!path) return;
    const pool = this.effects.get(name) || [];
    let a = pool.find(s => s.paused);
    if (!a && pool.length < 4) { a = new Audio(path); pool.push(a); this.effects.set(name, pool); }
    if (!a) return;
    a.currentTime = 0; a.volume = this.options.effects * 0.7; a.play().catch(() => {});
  }
  update(options) {
    this.options = options;
    for (const a of this.tracks.values()) a.volume = options.music;
    for (const pool of this.effects.values()) for (const a of pool) a.volume = options.effects * 0.7;
    if (this.engine) this.engine.volume = options.effects * this.engineLevel * .28;
  }
  motion(speed, cutting = false, dt = 0) {
    this.engineLevel = Math.min(1, Math.max(0, speed / 16));
    if (this.enabled && !this.suspended && this.engineLevel > .02 && this.manifest?.loops?.engine) {
      if (!this.engine) {this.engine = new Audio(this.manifest.loops.engine);this.engine.loop = true;this.engine.preload = 'auto';}
      this.engine.volume = this.options.effects * this.engineLevel * .28;
      this.engine.playbackRate = .7 + this.engineLevel * .45;
      if (this.engine.paused) this.engine.play().catch(() => {});
    } else this.engine?.pause();
    this.cutCooldown = Math.max(0, this.cutCooldown - dt);
    if (cutting && this.cutCooldown <= 0) {this.effect('cut');this.cutCooldown = .5;}
    if (!cutting) this.cutCooldown = 0;
  }
  suspend(flag) { this.suspended = flag; if (flag) { for (const a of this.tracks.values()) a.pause(); for (const pool of this.effects.values()) for (const a of pool) a.pause(); this.engine?.pause(); } else if (this.active) this.play(this.active); }
}
