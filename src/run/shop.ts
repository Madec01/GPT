/**
 * Marchand : trois charmes à prix fixe, un soin, une relance de l'offre.
 * L'offre est tirée du générateur du run et vit avec le nœud.
 */
import { charmPrice, type CharmId } from './charms';
import { offerCharms, takeCharm, withRng, type RunState } from './state';

export const HEAL_PRICE = 30;
export const REROLL_PRICE = 20;

export interface ShopOffer {
  charms: Array<{ id: CharmId; price: number; sold: boolean }>;
  healSold: boolean;
  rerolled: boolean;
}

export function makeShop(state: RunState): ShopOffer {
  const ids = withRng(state, (rng) => offerCharms(state, rng, 3));
  return { charms: ids.map((id) => ({ id, price: charmPrice(id), sold: false })), healSold: false, rerolled: false };
}

export function buyCharm(state: RunState, shop: ShopOffer, index: number): boolean {
  const item = shop.charms[index];
  if (!item || item.sold || state.plumes < item.price) return false;
  if (!takeCharm(state, item.id)) return false;
  state.plumes -= item.price;
  item.sold = true;
  return true;
}

export function buyHeal(state: RunState, shop: ShopOffer): boolean {
  if (shop.healSold || state.plumes < HEAL_PRICE || state.hp >= state.maxHp) return false;
  state.plumes -= HEAL_PRICE;
  state.hp++;
  shop.healSold = true;
  return true;
}

export function reroll(state: RunState, shop: ShopOffer): boolean {
  if (shop.rerolled || state.plumes < REROLL_PRICE) return false;
  state.plumes -= REROLL_PRICE;
  const ids = withRng(state, (rng) => offerCharms(state, rng, 3));
  shop.charms = ids.map((id) => ({ id, price: charmPrice(id), sold: false }));
  shop.rerolled = true;
  return true;
}
