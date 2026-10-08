import { describe, expect, it } from 'vitest';
import {
  actName,
  charmRewardScreen,
  charmsScreen,
  combatWonScreen,
  eventOutcomeScreen,
  eventScreen,
  restScreen,
  runDeadScreen,
  runWonScreen,
  shopScreen,
  treasureScreen,
} from '../src/app/runScreens';
import type { OverlaySpec } from '../src/render/overlayView';
import { CHARMS, charmById, MAX_CHARMS, type CharmId } from '../src/run/charms';
import { EVENTS, eventById } from '../src/run/events';
import { HEAL_PRICE, makeShop, REROLL_PRICE, type ShopOffer } from '../src/run/shop';
import { newRun, summary, takeCharm, type RunState } from '../src/run/state';

const ids = (spec: OverlaySpec): string[] => spec.buttons.map((b) => b.id);

function shopWith(state: RunState): ShopOffer {
  const shop = makeShop(state);
  // Prix fixes pour des tests indépendants de la graine.
  shop.charms.forEach((item) => (item.price = 50));
  return shop;
}

function richRun(plumes: number, hp = 2): RunState {
  const state = newRun(21);
  state.plumes = plumes;
  state.hp = hp;
  return state;
}

describe('marchand', () => {
  it('propose tout quand la bourse est pleine et que Dodu est blessé', () => {
    const state = richRun(200);
    const shop = shopWith(state);
    const spec = shopScreen(state, shop);
    expect(spec.title).toBe('Marchand');
    expect(ids(spec)).toEqual(['buy:0', 'buy:1', 'buy:2', 'heal', 'reroll', 'leave']);
    expect(spec.buttons[0]!.label).toBe(`${charmById(shop.charms[0]!.id).name}, 50 plumes`);
    expect(spec.buttons.find((b) => b.id === 'heal')!.label).toBe(`Un cœur, ${HEAL_PRICE} plumes`);
    expect(spec.buttons.find((b) => b.id === 'reroll')!.label).toBe(`Nouvelle offre, ${REROLL_PRICE} plumes`);
    expect(spec.buttons.find((b) => b.id === 'leave')!.label).toBe('Reprendre la route');
    expect(spec.lines[0]).toContain('200 plumes');
    for (const item of shop.charms) expect(spec.lines.join('\n')).toContain(charmById(item.id).description);
  });

  it('retire les boutons impossibles au lieu de les griser', () => {
    const state = richRun(25);
    const shop = shopWith(state);
    expect(ids(shopScreen(state, shop))).toEqual(['reroll', 'leave']);

    state.plumes = 10;
    expect(ids(shopScreen(state, shop))).toEqual(['leave']);

    state.plumes = 100;
    state.hp = state.maxHp;
    expect(ids(shopScreen(state, shop))).toEqual(['buy:0', 'buy:1', 'buy:2', 'reroll', 'leave']);

    shop.charms[1]!.sold = true;
    shop.rerolled = true;
    const spec = shopScreen(state, shop);
    expect(ids(spec)).toEqual(['buy:0', 'buy:2', 'leave']);
    expect(spec.lines.join('\n')).toContain(`${charmById(shop.charms[1]!.id).name} : vendu`);

    shop.healSold = true;
    state.hp = 1;
    expect(ids(shopScreen(state, shop))).not.toContain('heal');
  });

  it('ne vend plus de charme quand les six places sont prises et le dit', () => {
    const state = richRun(300);
    for (const c of CHARMS.slice(0, MAX_CHARMS)) takeCharm(state, c.id);
    const shop = shopWith(state);
    const spec = shopScreen(state, shop);
    expect(ids(spec).some((id) => id.startsWith('buy:'))).toBe(false);
    expect(ids(spec)).toContain('heal');
    expect(spec.lines.join('\n')).toContain('plus de place');
  });
});

describe('événements', () => {
  it('découpe le texte en phrases et nomme les choix', () => {
    const def = eventById('piege');
    const spec = eventScreen(def);
    expect(spec.title).toBe(def.title);
    expect(spec.lines.length).toBeGreaterThanOrEqual(1);
    expect(spec.lines.join(' ')).toBe(def.text);
    expect(spec.buttons).toEqual(def.choices.map((c) => ({ id: `choice:${c.id}`, label: c.label })));
  });

  it('affiche l\'issue ligne par ligne avec un seul bouton pour repartir', () => {
    const def = eventById('piege');
    const spec = eventOutcomeScreen(def, 'Soixante plumes. Et une cloche qui sonne au loin : le prochain combat sera une élite.');
    expect(spec.title).toBe(def.title);
    expect(spec.lines).toEqual(['Soixante plumes.', 'Et une cloche qui sonne au loin : le prochain combat sera une élite.']);
    expect(ids(spec)).toEqual(['leave']);
    expect(eventOutcomeScreen(def, 'Sans ponctuation').lines).toEqual(['Sans ponctuation']);
  });
});

describe('repos', () => {
  it('propose soigner et veiller selon les cœurs', () => {
    const state = newRun(1);
    state.hp = 1;
    const both = restScreen(state);
    expect(both.title).toBe('Repos');
    expect(ids(both)).toEqual(['rest:soigner', 'rest:veiller']);

    state.hp = state.maxHp;
    expect(ids(restScreen(state))).toEqual(['rest:veiller']);

    state.hp = 1;
    state.maxHp = 6;
    expect(ids(restScreen(state))).toEqual(['rest:soigner']);

    state.hp = 6;
    expect(ids(restScreen(state))).toEqual(['leave']);
  });
});

describe('charmes en récompense', () => {
  const options: CharmId[] = ['grelot', 'lanterne', 'tambour-de-guerre'];

  it('un bouton par charme avec son effet à l\'écran, et de quoi ne rien prendre', () => {
    const spec = treasureScreen(options);
    expect(ids(spec)).toEqual(['charm:grelot', 'charm:lanterne', 'charm:tambour-de-guerre', 'charm:none']);
    expect(spec.buttons.find((b) => b.id === 'charm:grelot')!.label).toBe('Grelot');
    expect(spec.buttons.find((b) => b.id === 'charm:none')!.label).toBe('Rien prendre');
    for (const id of options) expect(spec.lines.join('\n')).toContain(`${charmById(id).name} : ${charmById(id).description}`);
    expect(spec.lines.join('\n')).not.toContain('plus de place');
  });

  it('adapte le titre au contexte', () => {
    const titles = (['tresor', 'elite', 'boss'] as const).map((c) => charmRewardScreen(options, c).title);
    expect(new Set(titles).size).toBe(3);
    expect(treasureScreen(options)).toEqual(charmRewardScreen(options, 'tresor'));
  });

  it('dit quand les six places sont prises et ne laisse que de refuser', () => {
    for (const spec of [treasureScreen(options, MAX_CHARMS), charmRewardScreen(options, 'elite', MAX_CHARMS)]) {
      expect(ids(spec)).toEqual(['charm:none']);
      expect(spec.lines.join('\n')).toContain('six charmes');
    }
  });

  it('survit à une liste vide', () => {
    const spec = charmRewardScreen([], 'boss');
    expect(ids(spec)).toEqual(['charm:none']);
  });
});

describe('fin de salle', () => {
  it('résume la salle, accorde le singulier et ajoute le contrat s\'il y en a un', () => {
    const plain = combatWonScreen('Le Pont', 1, 25, null, false);
    expect(plain.title).toBe('Salle gagnée');
    expect(plain.lines).toEqual(['Le Pont', 'Terminée en 1 tour.', 'Vous gagnez 25 plumes d\'or.']);
    expect(ids(plain)).toEqual(['continue']);

    const elite = combatWonScreen('La Cour', 4, 85, 'Contrat rempli : sans dégât, 10 plumes', true);
    expect(elite.title).toBe('Élite vaincue');
    expect(elite.lines[1]).toBe('Terminée en 4 tours.');
    expect(elite.lines[3]).toBe('Contrat rempli : sans dégât, 10 plumes');
    expect(ids(elite)).toEqual(['continue']);
  });
});

describe('bilan de run', () => {
  function playedRun(): RunState {
    const state = newRun(8);
    state.act = 2;
    state.stats.rooms = 9;
    state.stats.kills = 17;
    state.stats.plumesEarned = 420;
    state.charms = ['grelot', 'oeuf-de-secours'];
    return state;
  }

  it('affiche cinq lignes aux bons chiffres à la défaite', () => {
    const state = playedRun();
    state.phase = 'dead';
    const spec = runDeadScreen(summary(state));
    expect(spec.lines).toEqual([
      'Acte atteint : 2 sur 3',
      'Salles franchies : 9',
      'Ennemis vaincus : 17',
      'Plumes d\'or gagnées : 420',
      'Charmes tenus : Grelot, Œuf de secours',
    ]);
    expect(spec.buttons).toEqual([
      { id: 'restart', label: 'Nouveau run' },
      { id: 'quit', label: 'Accueil' },
    ]);
  });

  it('distingue la victoire de la défaite et gère l\'absence de charme', () => {
    const state = newRun(2);
    state.act = 3;
    state.phase = 'won';
    const won = runWonScreen(summary(state));
    const dead = runDeadScreen(summary(state));
    expect(won.title).not.toBe(dead.title);
    expect(won.lines).toHaveLength(5);
    expect(won.lines[0]).toBe('Acte atteint : 3 sur 3');
    expect(won.lines[4]).toBe('Charmes tenus : aucun');
    expect(ids(won)).toEqual(['restart', 'quit']);
  });

  it('nomme les trois actes', () => {
    expect([1, 2, 3].map(actName)).toEqual(['La Porte de Goulafre', 'Les Terrasses', 'L\'Aire']);
  });
});

describe('inventaire de charmes', () => {
  it('liste les charmes tenus avec leur effet et revient à la pause', () => {
    const state = newRun(4);
    expect(charmsScreen(state).lines.join('\n')).toContain('Aucun charme');
    takeCharm(state, 'grelot');
    takeCharm(state, 'oeuf-de-secours');
    state.spareLifeUsed = true;
    const spec = charmsScreen(state);
    expect(spec.title).toBe('Charmes');
    expect(spec.lines[0]).toBe(`Charmes tenus : 2 sur ${MAX_CHARMS}`);
    expect(spec.lines.join('\n')).toContain(charmById('grelot').description);
    expect(spec.lines.join('\n')).toContain('Déjà utilisé');
    expect(spec.buttons).toEqual([{ id: 'back-pause', label: 'Retour' }]);
  });
});

describe('typographie', () => {
  it('n\'emploie ni tiret cadratin ni parenthèse, dans aucun écran', () => {
    const state = richRun(200);
    for (const c of CHARMS.slice(0, 3)) takeCharm(state, c.id);
    const specs: OverlaySpec[] = [
      shopScreen(state, shopWith(state)),
      restScreen(state),
      treasureScreen(CHARMS.map((c) => c.id)),
      charmRewardScreen(CHARMS.map((c) => c.id), 'boss', MAX_CHARMS),
      combatWonScreen('Salle', 3, 40, 'Contrat rempli', true),
      runDeadScreen(summary(state)),
      runWonScreen(summary(state)),
      charmsScreen(state),
      ...EVENTS.map((e) => eventScreen(e)),
    ];
    for (const spec of specs) {
      const text = [spec.title, ...spec.lines, ...spec.buttons.map((b) => b.label)].join('\n');
      expect(text).not.toMatch(/[—–()]/);
    }
  });
});
