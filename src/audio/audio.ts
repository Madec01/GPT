/**
 * Moteur audio : bruitages en Web Audio, musique en élément HTML audio avec
 * fondu, déverrouillage au premier toucher (iOS), volumes persistés.
 * Tout appel avant le déverrouillage est silencieux et sans erreur.
 */
import type { AssetManifest } from '../render/assets';
import type { SoundCue } from './cues';

export interface AudioVolumes {
  master: number;
  sfx: number;
  music: number;
}

const STORAGE_KEY = 'fronde.audio';
const DEFAULT_VOLUMES: AudioVolumes = { master: 1, sfx: 0.9, music: 0.6 };

export interface AudioState {
  unlocked: boolean;
  decoded: number;
  played: number;
  musicTrack: string | null;
  musicPlaying: boolean;
  volumes: AudioVolumes;
}

function readVolumes(): AudioVolumes {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_VOLUMES };
    const parsed = JSON.parse(raw) as Partial<AudioVolumes>;
    return {
      master: clamp(parsed.master ?? DEFAULT_VOLUMES.master),
      sfx: clamp(parsed.sfx ?? DEFAULT_VOLUMES.sfx),
      music: clamp(parsed.music ?? DEFAULT_VOLUMES.music),
    };
  } catch {
    return { ...DEFAULT_VOLUMES };
  }
}

function clamp(v: number): number {
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private readonly buffers = new Map<string, AudioBuffer>();
  private readonly pending = new Map<string, ArrayBuffer>();
  private readonly music = new Audio();
  private musicTrack: string | null = null;
  private fadeTimer: number | null = null;
  private volumes: AudioVolumes;
  private unlocked = false;
  private played = 0;

  constructor(
    private readonly manifest: AssetManifest | null,
    private readonly baseUrl: string,
  ) {
    this.volumes = readVolumes();
    this.music.loop = true;
    this.music.preload = 'auto';
  }

  /** Télécharge les bruitages sans les décoder : le décodage attend le contexte. */
  async preload(): Promise<void> {
    if (!this.manifest) return;
    const entries = Object.entries(this.manifest.audio);
    await Promise.all(
      entries.map(async ([key, def]) => {
        try {
          const response = await fetch(`${this.baseUrl}${def.file}`);
          if (response.ok) this.pending.set(key, await response.arrayBuffer());
        } catch {
          // Son manquant : le jeu reste silencieux sur cette clé.
        }
      }),
    );
    if (this.ctx) await this.decodePending();
  }

  /** À appeler sur le premier geste utilisateur. Idempotent. */
  async unlock(): Promise<void> {
    if (this.unlocked) return;
    this.unlocked = true;
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.applyVolumes();
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      await this.decodePending();
    } catch (error) {
      console.warn('Audio indisponible', error);
      this.ctx = null;
    }
    if (this.musicTrack) void this.music.play().catch(() => undefined);
  }

  private async decodePending(): Promise<void> {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const entries = [...this.pending.entries()];
    this.pending.clear();
    await Promise.all(
      entries.map(async ([key, data]) => {
        try {
          this.buffers.set(key, await ctx.decodeAudioData(data.slice(0)));
        } catch {
          // Format non décodable sur ce navigateur.
        }
      }),
    );
  }

  play(cue: SoundCue): boolean {
    if (!this.ctx || !this.sfxGain) return false;
    const buffer = this.buffers.get(cue.key);
    if (!buffer) return false;
    const def = this.manifest?.audio[cue.key];
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = Math.pow(2, cue.semitones / 12);
    const gain = this.ctx.createGain();
    gain.gain.value = cue.volume * (def?.volume ?? 1);
    source.connect(gain);
    gain.connect(this.sfxGain);
    source.start();
    this.played++;
    return true;
  }

  /** Lance une piste avec fondu ; ne fait rien si elle joue déjà. */
  playMusic(track: string, fadeMs = 800): void {
    if (!this.manifest) return;
    const file = this.manifest.music[track];
    if (!file || this.musicTrack === track) return;
    this.musicTrack = track;
    const start = (): void => {
      this.music.src = `${this.baseUrl}${file}`;
      this.music.volume = 0;
      if (this.unlocked) {
        void this.music.play().catch(() => undefined);
        this.fadeTo(this.volumes.master * this.volumes.music, fadeMs);
      }
    };
    if (!this.music.paused && this.music.volume > 0) {
      this.fadeTo(0, fadeMs, start);
    } else {
      start();
    }
  }

  private fadeTo(target: number, ms: number, done?: () => void): void {
    if (this.fadeTimer !== null) clearInterval(this.fadeTimer);
    const from = this.music.volume;
    const startedAt = performance.now();
    this.fadeTimer = window.setInterval(() => {
      const k = Math.min(1, (performance.now() - startedAt) / ms);
      this.music.volume = from + (target - from) * k;
      if (k >= 1) {
        clearInterval(this.fadeTimer!);
        this.fadeTimer = null;
        done?.();
      }
    }, 50);
  }

  setVolumes(volumes: Partial<AudioVolumes>): void {
    this.volumes = { ...this.volumes, ...volumes };
    this.applyVolumes();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.volumes));
    } catch {
      // Stockage indisponible : les volumes ne survivent pas au rechargement.
    }
  }

  private applyVolumes(): void {
    if (this.masterGain) this.masterGain.gain.value = this.volumes.master;
    if (this.sfxGain) this.sfxGain.gain.value = this.volumes.sfx;
    if (this.fadeTimer === null) this.music.volume = this.volumes.master * this.volumes.music;
  }

  state(): AudioState {
    return {
      unlocked: this.unlocked,
      decoded: this.buffers.size,
      played: this.played,
      musicTrack: this.musicTrack,
      musicPlaying: !this.music.paused && !this.music.ended && this.music.currentTime > 0,
      volumes: { ...this.volumes },
    };
  }
}
