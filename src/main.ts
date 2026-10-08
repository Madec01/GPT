import { Game } from './app/game';
import { GREY_ROOM } from './data/rooms/grey';
import { PixiRenderer } from './render/pixiRenderer';

declare global {
  interface Window {
    /** Point d'accès des tests de bout en bout et du débogage manuel. */
    __fronde?: {
      version: string;
      state: () => ReturnType<Game['debugState']>;
      throw: (dirX: number, dirY: number, power: number) => boolean;
    };
  }
}

async function boot(): Promise<void> {
  const renderer = await PixiRenderer.create(document.body, GREY_ROOM.width, GREY_ROOM.height);
  const game = new Game(GREY_ROOM, renderer);
  game.attachPointer(renderer.canvas);
  renderer.app.ticker.add((ticker) => game.update(ticker.deltaMS));
  window.__fronde = {
    version: __APP_VERSION__,
    state: () => game.debugState(),
    throw: (dirX, dirY, power) => game.throwFromAim(dirX, dirY, power),
  };
}

boot().catch((error: unknown) => {
  console.error(error);
  const message = document.createElement('p');
  message.style.cssText = 'color:#f9fafb;font:16px system-ui;padding:24px';
  message.textContent = 'FRONDE ne peut pas démarrer : WebGL est indisponible sur ce navigateur.';
  document.body.appendChild(message);
});
