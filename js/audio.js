/** Licensed recordings only. Playback rejection is expected before browser audio unlock. */
export class Soundtrack {
  constructor(options) {
    this.options = options;
    this.unlocked = false;
    this.track = 'menu';
    this.hidden = false;
    this.music = {
      menu: new Audio('assets/audio/snowfall.ogg'),
      game: new Audio('assets/audio/midnight.ogg')
    };
    for (const audio of Object.values(this.music)) {
      audio.loop = true;
      audio.preload = 'auto';
    }
    this.effects = {};
    this.voices = new Set();
    for (const name of ['click', 'switch', 'delivery', 'error']) {
      const audio = new Audio(`assets/audio/${name}.ogg`);
      audio.preload = 'auto';
      this.effects[name] = audio;
    }
    this.apply(options);
  }
  play(audio) {
    try {
      const pending = audio.play();
      if (pending?.catch) pending.catch(() => this.voices.delete(audio));
    } catch {
      this.voices.delete(audio);
    }
  }
  unlock() {
    this.unlocked = true;
    this.playMusic();
  }
  apply(options) {
    this.options = options;
    const volume = key => options.muted ? 0 : Math.max(0, Math.min(1, Number(options[key]) || 0));
    for (const audio of Object.values(this.music)) audio.volume = volume('music');
    for (const audio of [...Object.values(this.effects), ...this.voices]) audio.volume = volume('sfx');
  }
  scene(scene) {
    const track = scene === 'game' ? 'game' : 'menu';
    if (this.track !== track) {
      this.music[this.track].pause();
      this.track = track;
    }
    this.playMusic();
  }
  playMusic() {
    if (this.unlocked && !this.hidden) this.play(this.music[this.track]);
  }
  suspend(hidden) {
    this.hidden = hidden;
    if (hidden) {
      for (const audio of Object.values(this.music)) audio.pause();
      for (const voice of this.voices) voice.pause();
      this.voices.clear();
    } else this.playMusic();
  }
  effect(name) {
    if (!this.unlocked || this.options.muted || this.hidden) return;
    const source = this.effects[name];
    if (!source) return;
    // Bound overlapping effects, including repeated alarm and UI events.
    if (this.voices.size >= 12) {
      const oldest = this.voices.values().next().value;
      oldest.pause();
      this.voices.delete(oldest);
    }
    const voice = source.cloneNode();
    voice.volume = source.volume;
    voice.onended = voice.onerror = () => this.voices.delete(voice);
    this.voices.add(voice);
    this.play(voice);
  }
}
