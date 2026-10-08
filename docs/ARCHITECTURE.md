# Architecture technique — FRONDE

Dernière mise à jour : 8 octobre 2026, version 0.1.1. Ce document décrit ce qui existe, pas ce qui est prévu. La feuille de route tient le reste.

## Principes

1. **La simulation est déterministe.** Même salle, mêmes entrées, même résultat, à l'octet près, sur n'importe quel moteur JavaScript. C'est la condition de l'aide à la visée honnête, des rejeux, du solveur de salles et des tests.
2. **La simulation ignore le monde extérieur.** Pas d'horloge, pas de navigateur, pas de rendu, pas d'audio. Elle tourne en Node pour les tests et le solveur.
3. **Tout ce qui bouge est rond.** Les corps dynamiques sont des cercles, le décor est fait de segments et de boîtes alignées sur les axes. Cela réduit la physique à trois cas de collision, tous résolus analytiquement.
4. **Les composants sont des données.** Objets simples, sans méthode ni classe : le monde se clone par copie profonde et se sérialise de façon stable.
5. **Le rendu lit, il ne décide pas.** Ce que l'on montre de la prédiction est une politique de divulgation, séparée de la simulation.

## Arborescence

```
src/
  core/
    ecs/world.ts          Entités, composants, requêtes ordonnées, clone, instantané stable
    math/vec2.ts          Vecteurs 2D purs, sans trigonométrie
    math/rng.ts           Générateur seedé (mulberry32), seule source d'aléatoire autorisée
    physics/components.ts Transform, Velocity, CircleBody, SegmentBody, BoxShape, SegmentOwner
    physics/collision.ts  Temps d'impact cercle-segment, cercle-point, cercle-cercle
    physics/step.ts       Pas de physique : décélération, contacts par temps d'impact, séparation, sommeil
  sim/
    components.ts         Kind : nature de jeu d'une entité
    room.ts               RoomSpec et construction du monde (limites, boîtes et leurs segments, cercles)
    simulation.ts         Cadence fixe, lancer, frein, journal d'entrées, clone, instantané
    replay.ts             Rejoue un journal d'entrées sur une salle
    lookahead.ts          Prédit un lancer en jouant un clone jusqu'à l'arrêt
  input/gesture.ts        Machine d'état du geste de fronde, en pixels, sans DOM
  render/
    camera.ts             Ajustement de l'arène au viewport portrait, conversions
    disclosure.ts         Politique de divulgation de l'aide à la visée
    pixiRenderer.ts       Couches PixiJS : décor, trace fantôme, corps, aperçu, indicateur de geste
  app/game.ts             Accumulateur de temps, pointeur, prédiction, trace, état de débogage
  data/rooms/grey.ts      Salle grise de la phase 1
  main.ts                 Démarrage et point d'accès window.__fronde
tests/                    Vitest en Node : ECS, physique, déterminisme, geste, rejeux dorés
e2e/                      Playwright : fumée sur viewport mobile 390 x 844
```

## Déterminisme, règles concrètes

- Pas de temps fixe de 1/120 s. Le temps réel est converti en pas entiers par un accumulateur dans `app/game.ts`, plafonné à 100 ms par image pour ne pas rattraper une suspension d'onglet.
- Seules les quatre opérations et la racine carrée sont utilisées dans `core` et `sim`. Une règle ESLint y interdit `Math.random`, `Math.sin`, `Math.cos`, `Math.atan2`, `Math.pow`, `Date.now` et `performance.now`. Le geste de visée, qui vit dans `input`, normalise un vecteur avec une racine carrée : aucun angle n'entre jamais dans la simulation, seulement une vitesse.
- Les requêtes ECS renvoient les entités par identifiant croissant. Les paires de corps sont parcourues dans cet ordre, les égalités de temps d'impact sont tranchées par l'ordre d'énumération.
- Le frein est journalisé avec le numéro de pas où il a été pressé.
- Preuves : `tests/determinism.test.ts` compare deux exécutions à l'octet près, vérifie qu'un clone en plein vol poursuit à l'identique, que la prédiction annonce exactement l'arrêt réel, et que le rejeu du journal reproduit la partie. `tests/golden/throws.json` fige huit lancers de référence ; `npm run golden:update` le régénère après un changement voulu de la physique.

## Physique

Un pas se déroule ainsi :

1. Décélération de roulement constante sur chaque corps, plafond de vitesse, arrêt net sous la vitesse de sommeil.
2. Boucle de contacts : on cherche le premier temps d'impact dans le temps restant, parmi tous les couples cercle-segment et cercle-cercle. On avance tous les corps jusqu'à cet instant, on résout le contact par impulsion, on recommence. Seize contacts au plus par pas.
3. Avance du temps restant.
4. Passe de séparation : les chevauchements résiduels sont écartés sans toucher aux vitesses.
5. Sommeil : les vitesses sous le seuil tombent à zéro.

La restitution d'un contact est le maximum des deux restitutions. Il n'y a pas de friction tangentielle : la décélération de roulement joue ce rôle. Le plafond de vitesse, 30 unités par seconde, garantit qu'un corps ne peut pas sauter un segment en un pas, et la résolution par temps d'impact place les rebonds au point de contact exact. `tests/physics.test.ts` vérifie sur 150 lancers aléatoires à vitesse maximale qu'aucun corps ne sort de l'arène ni n'entre dans une boîte.

Un crochet de contact, appelé après chaque résolution, permettra aux règles de jeu de la phase 2 de modifier le monde : arrêt sur un collant, renvoi d'un bumper, dégâts.

## Simulation et prédiction

`Simulation` tient le monde, le numéro de pas, la phase (`idle` ou `moving`), le journal d'entrées et les événements de contact. `throwHero` est refusé pendant un mouvement ; `brake` immobilise le héros. `runUntilRest` avance jusqu'à l'immobilisation ou jusqu'au garde-fou de 20 secondes simulées.

`predictThrow` clone la simulation, lance, joue jusqu'à l'arrêt, et renvoie le trajet échantillonné, le premier contact, l'arrêt et un indicateur de contact avec un corps mobile. Mesure en Node sur la salle grise : 2,6 ms par prédiction, 13,5 µs par pas. Le jeu ne recalcule que lorsque la visée change de façon perceptible, direction quantifiée au demi-pour-cent et puissance au pour-cent.

`disclose` applique la politique du GDD : segment exact jusqu'au premier contact, arrêt exact si le trajet ne touche aucun corps mobile, halo incertain sinon. Le mode test pourra montrer le trajet entier en changeant la politique, sans toucher à la simulation.

## Rendu et entrée

PixiJS 8 sert de renderer pur. L'arène est ajustée au viewport avec des marges réservées à l'interface : 72 pixels en haut, 120 en bas. Les couches sont dessinées du fond vers l'avant : sol et décor statique, trace fantôme en pointillé, corps mobiles, aperçu de visée, indicateur de geste en pixels d'écran.

Le geste est une machine d'état pure alimentée par les événements de pointeur du canvas : un seul pointeur suivi, zone morte de 24 pixels, rayon maximal de 140 pixels, annulation si le doigt revient dans la zone morte ou si le pointeur est perdu. La souris produit les mêmes événements, ce qui rend le jeu jouable sur ordinateur et testable par Playwright.

## Application installable

`vite-plugin-pwa` génère le manifeste et un service worker Workbox en mode `generateSW` : tous les fichiers du build sont précachés, le jeu fonctionne hors ligne après la première visite, et une nouvelle version s'installe automatiquement à l'ouverture suivante. Le manifeste déclare l'affichage autonome et l'orientation portrait ; iOS ignore l'orientation mais respecte le plein écran grâce aux métadonnées Apple de `index.html`. Les icônes sont dans `public/icons/` ; `%BASE_URL%` dans `index.html` garantit des chemins corrects sous `/GPT/`. Les zones sûres de l'appareil sont exposées en variables CSS et ajoutées aux marges de la caméra.

## Tests et intégration continue

| Niveau | Outil | Ce qui est vérifié |
|---|---|---|
| Unitaire | Vitest en Node | ECS, temps d'impact, rebonds, quantité de mouvement, roulement, absence de traversée, déterminisme, geste, rejeux dorés |
| Bout en bout | Playwright, Chromium, 390 x 844 | Chargement sans erreur, geste de fronde, lancer, immobilisation, annulation en zone morte |
| Qualité | ESLint, tsc strict | Règles de déterminisme, typage strict avec index non vérifiés et propriétés optionnelles exactes |

Le workflow `.github/workflows/ci.yml` enchaîne lint, typage, tests, fumée mobile et build à chaque push, puis déploie `dist/` sur GitHub Pages depuis `main`. Le dépôt doit avoir GitHub Pages configuré sur la source "GitHub Actions". Le build Pages utilise la base `/GPT/` via la variable `FRONDE_BASE`.

En local, `PW_CHROMIUM_PATH` permet d'utiliser un Chromium déjà installé pour Playwright.

## Limites connues de la version 0.1

- Boîtes alignées sur les axes uniquement, sans rotation.
- Aucune règle de jeu : pas d'intentions, de dégâts, de sonné ni de collant. Les trois cercles de la salle grise ne sont que des masses.
- Aucune interface, aucun son, aucun asset de jeu : formes grises et deux yeux. Seules les icônes d'installation existent.
- La prédiction se recalcule sur le fil principal ; si elle devient coûteuse avec les règles de la phase 2, elle passera dans un Worker.
