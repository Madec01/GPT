import { registerSW } from 'virtual:pwa-register';
import { Game, type DebugState } from './app/game';
import { TEST_CAMPAIGN } from './data/campaign';
import { PixiRenderer } from './render/pixiRenderer';

declare global {
  interface Window {
    /** Point d'accès des tests de bout en bout et du débogage manuel. */
    __fronde?: {
      version: string;
      state: () => DebugState;
      throw: (dirX: number, dirY: number, power: number) => boolean;
      brake: () => boolean;
      skip: () => void;
      press: (buttonId: string) => void;
    };
  }
}

async function boot(): Promise<void> {
  const campaign = TEST_CAMPAIGN;
  const params = new URLSearchParams(window.location.search);
  const startNode = params.get('node') ?? undefined;
  const start = startNode && campaign.nodes[startNode] ? campaign.nodes[startNode] : campaign.nodes[campaign.start]!;
  const renderer = await PixiRenderer.create(document.body, start.room.width, start.room.height);
  const game = new Game(campaign, renderer, startNode ? { startNode } : {});
  game.attachPointer(renderer.canvas);
  renderer.app.ticker.add((ticker) => game.update(ticker.deltaMS));
  window.__fronde = {
    version: __APP_VERSION__,
    state: () => game.debugState(),
    throw: (dirX, dirY, power) => game.throwFromAim(dirX, dirY, power),
    brake: () => game.brake(),
    skip: () => game.skip(),
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
