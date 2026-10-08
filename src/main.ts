import { registerSW } from 'virtual:pwa-register';
import { Game, type DebugState } from './app/game';
import { GameStorage } from './app/storage';
import { AudioEngine, type AudioState } from './audio/audio';
import { CAMPAIGN, TEST_CAMPAIGN } from './data/campaign';
import { loadAssets } from './render/assets';
import { PixiRenderer } from './render/pixiRenderer';

declare global {
  interface Window {
    /** Point d'accès des tests de bout en bout et du débogage manuel. */
    __fronde?: {
      version: string;
      state: () => DebugState;
      audio: () => AudioState;
      assets: () => { loaded: boolean; sprites: number };
      throw: (dirX: number, dirY: number, power: number) => boolean;
      brake: () => boolean;
      skip: () => void;
      pause: () => void;
      press: (buttonId: string) => void;
    };
  }
}

async function boot(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  // `?campagne=essai` charge la campagne d'essai sur la salle grise ; `?node=` choisit la salle de départ ;
  // `?assets=aucun` force les formes vectorielles.
  const campaign = params.get('campagne') === 'essai' ? TEST_CAMPAIGN : CAMPAIGN;
  const startNode = params.get('node') ?? undefined;
  const start = startNode && campaign.nodes[startNode] ? campaign.nodes[startNode] : campaign.nodes[campaign.start]!;
  const assetsBase = `${import.meta.env.BASE_URL}assets/`;
  const assets = params.get('assets') === 'aucun' ? null : await loadAssets(assetsBase);
  const audio = new AudioEngine(assets?.manifest ?? null, assetsBase);
  void audio.preload();
  const renderer = await PixiRenderer.create(document.body, start.room.width, start.room.height, assets);
  // `?diag=1` affiche l'état audio et la version en bas de l'écran.
  const game = new Game(campaign, renderer, {
    audio,
    storage: GameStorage.browser(),
    credits: assets?.manifest.credits ?? [],
    version: __APP_VERSION__,
    diagnostics: params.get('diag') === '1',
    ...(startNode ? { startNode } : {}),
  });
  game.attachPointer(renderer.canvas);
  renderer.app.ticker.add((ticker) => game.update(ticker.deltaMS));
  window.__fronde = {
    version: __APP_VERSION__,
    state: () => game.debugState(),
    audio: () => audio.state(),
    assets: () => ({ loaded: assets !== null, sprites: assets ? Object.keys(assets.manifest.sprites).length : 0 }),
    throw: (dirX, dirY, power) => game.throwFromAim(dirX, dirY, power),
    brake: () => game.brake(),
    skip: () => game.skip(),
    pause: () => game.pause(),
    press: (id) => game.pressOverlay(id),
  };
}

registerSW({ immediate: true });

boot().catch((error: unknown) => {
  console.error(error);
  const message = document.createElement('p');
  message.style.cssText = 'color:#f9fafb;font:16px system-ui;padding:24px';
  message.textContent = 'FRONDE ne peut pas démarrer : WebGL est indisponible sur ce navigateur.';
  document.body.appendChild(message);
});
