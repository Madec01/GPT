/**
 * Moteur audio : bruitages en Web Audio, musique en éléments audio HTML avec
 * fondu croisé, déverrouillage au premier toucher, volumes persistés.
 *
 * Contraintes mobiles respectées ici :
 * - sur iOS, la création du contexte, sa reprise et le premier `play()` de la
 *   musique doivent avoir lieu de façon synchrone dans le geste utilisateur,
 *   avant toute attente ;
 * - l'interrupteur silencieux de l'iPhone coupe Web Audio tant que la session
 *   audio n'est pas de type « playback » ;
 * - un retour d'arrière-plan peut laisser le contexte suspendu : chaque geste
 *   tente une reprise.
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
const FADE_MS = 800;

export interface AudioState {
  unlocked: boolean;
  contextState: string;
  decoded: number;
  pending: number;
  played: number;
  musicTrack: string | null;
  musicPlaying: boolean;
  lastError: string | null;
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

interface MusicChannel {
  element: HTMLAudioElement;
  track: string | null;
  fadeTimer: number | null;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private readonly buffers = new Map<string, AudioBuffer>();
  private readonly pending = new Map<string, ArrayBuffer>();
  private readonly channels: [MusicChannel, MusicChannel];
  private active = 0;
  private volumes: AudioVolumes;
  private unlocked = false;
  private played = 0;
  private lastError: string | null = null;

  constructor(
    private readonly manifest: AssetManifest | null,
    private readonly baseUrl: string,
  ) {
    this.volumes = readVolumes();
    this.channels = [this.makeChannel(), this.makeChannel()];
  }

  private makeChannel(): MusicChannel {
    const element = new Audio();
    element.loop = true;
    element.preload = 'auto';
    element.setAttribute('playsinline', '');
    return { element, track: null, fadeTimer: null };
  }

  /** Télécharge les bruitages sans les décoder : le décodage attend le contexte. */
  async preload(): Promise<void> {
    if (!this.manifest) return;
    await Promise.all(
      Object.entries(this.manifest.audio).map(async ([key, def]) => {
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

  /**
   * À appeler de façon synchrone dans chaque geste utilisateur. La première
   * fois, crée le contexte, déclare la session de lecture et lance la musique ;
   * ensuite, reprend un contexte suspendu par l'arrière-plan.
   */
  unlock(): void {
    if (this.unlocked) {
      if (this.ctx && this.ctx.state !== 'running') void this.ctx.resume().catch(() => undefined);
      return;
    }
    this.unlocked = true;
    this.declarePlaybackSession();
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.applyVolumes();
      // Reprise et tampon muet, tous deux dans le geste : c'est ce qui déverrouille iOS.
      void this.ctx.resume().catch(() => undefined);
      const silent = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
      const source = this.ctx.createBufferSource();
      source.buffer = silent;
      source.connect(this.ctx.destination);
      source.start();
    } catch (error) {
      this.note(error);
      this.ctx = null;
    }
    const channel = this.channels[this.active]!;
    if (channel.track) this.startElement(channel);
    void this.decodePending();
  }

  /** Session audio de lecture : iOS cesse alors de couper Web Audio avec l'interrupteur silencieux. */
  private declarePlaybackSession(): void {
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) {
      try {
        session.type = 'playback';
      } catch (error) {
        this.note(error);
      }
    }
  }

  private note(error: unknown): void {
    this.lastError = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
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
        } catch (error) {
          this.note(error);
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

  /** Lance une piste en fondu croisé ; ne fait rien si elle joue déjà. */
  playMusic(track: string): void {
    if (!this.manifest) return;
    const file = this.manifest.music[track];
    const current = this.channels[this.active]!;
    if (!file || current.track === track) return;
    const next = this.channels[1 - this.active]!;
    this.active = 1 - this.active;
    next.track = track;
    next.element.src = `${this.baseUrl}${file}`;
    next.element.volume = 0;
    if (this.unlocked) {
      this.startElement(next);
      if (current.track) {
        this.fade(current, 0, () => {
          current.element.pause();
          current.track = null;
        });
      }
    }
  }

  /** `play()` synchrone, puis fondu d'entrée. */
  private startElement(channel: MusicChannel): void {
    const target = this.volumes.master * this.volumes.music;
    const promise = channel.element.play();
    if (promise) promise.catch((error: unknown) => this.note(error));
    this.fade(channel, target);
  }

  private fade(channel: MusicChannel, target: number, done?: () => void): void {
    if (channel.fadeTimer !== null) clearInterval(channel.fadeTimer);
    const from = channel.element.volume;
    const startedAt = performance.now();
    channel.fadeTimer = window.setInterval(() => {
      const k = Math.min(1, (performance.now() - startedAt) / FADE_MS);
      channel.element.volume = from + (target - from) * k;
      if (k >= 1) {
        clearInterval(channel.fadeTimer!);
        channel.fadeTimer = null;
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
    const channel = this.channels[this.active]!;
    if (channel.fadeTimer === null && channel.track) channel.element.volume = this.volumes.master * this.volumes.music;
  }

  state(): AudioState {
    const channel = this.channels[this.active]!;
    const el = channel.element;
    return {
      unlocked: this.unlocked,
      contextState: this.ctx?.state ?? 'absent',
      decoded: this.buffers.size,
      pending: this.pending.size,
      played: this.played,
      musicTrack: channel.track,
      musicPlaying: channel.track !== null && !el.paused && !el.ended && el.currentTime > 0,
      lastError: this.lastError,
      volumes: { ...this.volumes },
    };
  }
}
