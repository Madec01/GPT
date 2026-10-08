# Architecture technique — FRONDE

Dernière mise à jour : 8 octobre 2026, version 0.5.1. Ce document décrit ce qui existe, pas ce qui est prévu. La feuille de route tient le reste.

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
    components.ts         Composants de jeu : Kind, Health, Enemy et son intention, Pushable, Breakable,
                          Springboard, Hazard, Pickup, Hero, RoomState et son journal d'événements
    archetypes.ts         Fiches des ennemis et poussables, seuils des règles (valeurs du GDD)
    zones.ts              Disques et polygones convexes, intersections avec un cercle
    intents.ts            Motifs d'attaque par archétype, cycle du boss, sans trigonométrie
    room.ts               RoomSpec et construction du monde : limites, boîtes et segments, ennemis,
                          poussables, tremplins, gouffres, état transporté du héros
    simulation.ts         Cadence fixe, lancer, frein, journal d'entrées, systèmes par pas, clone
    replay.ts             Rejoue un journal d'entrées sur une salle
    lookahead.ts          Suit un lancer sur un clone jusqu'à l'arrêt
    rules/contacts.ts     Crochet de contact : dégâts, écrasement, éclatement, projectiles, bumper,
                          collant, casse, éboulement, butin seedé, boss
    rules/systems.ts      Systèmes par pas : tremplins, gouffres, cœurs
    rules/turn.ts         RoomRun : le tour en six étapes, sonné, attaques, objectifs, prédiction
    rules/powers.ts       Formes et élément : cartes, corps au lancer, filtre de collision, arcs, synergies
    solver.ts             Solveur headless de salles (recherche en faisceau déterministe)
  input/gesture.ts        Machine d'état du geste de fronde, en pixels, sans DOM
  audio/cues.ts           Correspondance pure événements de règles → sons, gamme pentatonique des combos
  audio/audio.ts          Web Audio pour les bruitages, élément audio pour la musique, déverrouillage, volumes
  render/
    assets.ts             Manifeste typé, chargement des textures et des polices, substituts
    camera.ts             Ajustement de l'arène au viewport portrait, conversions
    disclosure.ts         Politique de divulgation de l'aide à la visée
    tween.ts              Enveloppe d'écrasement et interpolations pures
    characterView.ts      Corps, yeux et bouche en couches, expressions, écrasement, étoiles du sonné
    fx.ts                 Bassin de particules brèves et petites
    hudView.ts            Cœurs, salle, objectif, frein, pouvoir et jauge
    overlayView.ts        Écrans de transition : panneau, titre, lignes, boutons
    pixiRenderer.ts       Orchestration des couches, sol et murs en tuiles, props, zones, aperçu, masque d'arène
  app/expressions.ts      Choix pur de l'expression de Dodu et des ennemis
  app/options.ts          Options du joueur, paliers de volume, lecture tolérante
  app/storage.ts          Sauvegarde et options versionnées sur un stockage injecté
  app/screens.ts          Constructeurs purs des écrans : accueil, options, crédits, pause, carte, fin
  app/game.ts             Campagne, salle en cours, échelle de temps, arrêt image, retours visuels et sonores
  data/schema.ts          Validation d'une salle JSON sans dépendance
  data/campaign.ts        Structure de campagne en nœuds avec embranchement
  data/rooms/*.json       Les salles de la tranche verticale
  data/rooms/grey.ts      Salle grise d'essai et de test
  main.ts                 Démarrage et point d'accès window.__fronde
scripts/solve-rooms.ts    Valide et résout toutes les salles, exécuté par la CI
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

Chaque événement de contact porte les vitesses des deux corps avant résolution. Le crochet de contact, appelé après chaque résolution, applique les règles de jeu ; s'il détruit ou crée une entité, il renvoie `true` et le pas recharge ses listes de corps avant de chercher le contact suivant. Les systèmes par pas, tremplins, gouffres et cœurs, s'exécutent après la physique dans un ordre fixe.

## Règles de jeu

Tout l'état de jeu est dans le monde ECS, donc cloné avec lui : la prédiction d'un lancer joue les vraies règles sur un clone, bumper et collant compris, et `tests/rules.test.ts` prouve que l'arrêt prédit est l'arrêt réel. `RoomState`, porté par une entité singleton, tient le numéro de tour, la phase, l'état du générateur seedé et le journal des événements de règles que l'orchestrateur vide à chaque pas.

Les personnalités sont des règles de contact nommées, pas seulement des masses. Le crapaud renvoie Dodu avec sa vitesse d'arrivée réfléchie ; la gelée l'arrête net ; le rocailleux et le boulet deviennent des projectiles au-dessus de quatre unités par seconde, infligent deux points et brisent barricades et colonnes ; le boss n'encaisse que le Boulet de siège, un boulet ou une colonne effondrée. Les seuils vivent dans `archetypes.ts` et viennent du tableau du GDD.

`RoomRun` orchestre le tour. Les intentions sont calculées au début du tour depuis les positions de l'ennemi et du héros, puis figées au sol. À l'arrêt du héros : sonné pour tout ennemi déplacé d'au moins une unité, objectif, attaques des ennemis vivants et non sonnés sur chaque zone chevauchant le cercle du héros, victoire ou défaite, puis nouvelles intentions. Le seul aléatoire est le butin des caisses, tiré du générateur seedé de la salle.

Le pouvoir Pierre modifie la masse et le rebond du héros au moment du lancer. La jauge compte les rebonds de mur au-dessus de deux unités par seconde ; pleine, le lancer suivant est un Boulet de siège : masse triple, le premier obstacle cède sans ralentir, tout rocailleux percuté part à la vitesse de Dodu. La charge est consommée au lancer et se reconstruit sur les rebonds suivants.

## Habillage, retours et son

Le manifeste `public/assets/manifest.json` est le contrat entre le sous-agent Assets et le code : clés fixes, fichiers libres, `pixelsPerUnit` par sprite. Toute clé absente ou nulle donne un substitut vectoriel ; le jeu entier tourne sans aucun asset, ce qui garde les tests de fumée indépendants du contenu. Les corps sont des vues persistantes : corps, yeux et bouche en couches, expression choisie chaque image par `app/expressions.ts` depuis la phase, le marqueur de visée et des minuteries. L'écrasement à l'impact suit une enveloppe qui part de 1, passe en négatif puis revient à 0 en 180 ms, orientée le long de la normale du contact, avec contre-rotation des couches pour que le visage reste droit.

Règle "rien ne masque la trajectoire" : les particules sont brèves, petites et sous les corps ; les zones, l'aperçu et les particules sont masqués par le rectangle de l'arène ; aucune secousse de caméra. L'arrêt image dure 40 ms sur une mort ou un coup reçu, 70 ms sur une barricade ou une colonne, en suspendant l'accumulateur sans toucher à la simulation.

Les sons sont des buffers Web Audio décodés après le premier toucher, qui déverrouille aussi iOS. Chaque impact d'un lancer joue une note transposée sur une gamme pentatonique montante, remise à zéro au lancer suivant. La musique est un élément audio HTML qui boucle avec fondu, une piste par salle ; les volumes sont persistés dans le stockage local.

## Écrans, sauvegarde et options

Les écrans sont des descriptions pures, titre, lignes et boutons, construites par `app/screens.ts` et dessinées par la vue d'écran ; les identifiants de boutons sont le contrat avec le jeu, ce qui rend les écrans testables en Node et pilotables par les tests de fumée via `window.__fronde.press`. Le jeu démarre sur l'accueil avec la première salle en décor, et entre directement dans une salle avec `?node=`.

`app/storage.ts` lit et écrit la sauvegarde et les options sur un stockage injecté, `localStorage` dans le navigateur, un stockage mémoire dans les tests, et ignore sans erreur toute donnée corrompue, absente ou d'une autre version. La sauvegarde est écrite à chaque entrée de salle, avec l'état du héros à l'entrée, le chemin et les statistiques, et effacée en fin de run. Les options s'appliquent au son, au côté du frein et à la politique de divulgation ; le mode test porte l'invincibilité dans `RoomState` pour que les règles l'honorent, et le choix de la salle de départ.

## Solveur de salles

`sim/solver.ts` est une recherche en faisceau tour par tour : une table de directions construite sans trigonométrie, trois puissances, chaque candidat joué sur un clone jusqu'à la fin du tour, défaites écartées, première victoire renvoyée, états classés par une heuristique puis tronqués à la largeur du faisceau. Un verdict "résoluble" est une preuve, la séquence se rejoue ; un verdict "non résoluble" signifie seulement que le budget est épuisé. `scripts/solve-rooms.ts`, exécuté par la CI avec `npm run solve`, valide chaque salle JSON, vérifie sa structure et son état de départ, la résout avec l'état du héros attendu à l'entrée, et rejoue la solution. Mesure : environ 1,2 ms par lancer évalué, les sept salles en six secondes.

## Pouvoirs

Dodu tient une forme, Pierre, Rebond ou Glu, et un élément, Électricité. `rules/powers.ts` porte les cartes et leurs descriptions, le réglage du corps au lancer, le filtre de collision de Rebond, les cibles des arcs et les synergies. Le filtre de collision est une option de la physique : une fonction pure du monde qui déclare quels couples corps mobile et segment s'ignorent ; comme tout le reste, il est cloné avec la simulation et la prédiction reste exacte. L'ancrage de Glu et les arcs d'Électricité vivent dans le crochet de contact ; les arcs sont journalisés comme événements pour le rendu et le son. La jauge de charge se remplit dès qu'un pouvoir est tenu et la version forte s'applique à tout ce qui est équipé.

## Décor actif et usure

Les boîtes sont des rectangles statiques faits de quatre segments. Un ressort est une boîte dont les segments portent un rebond de 1,3 : la physique rend plus de vitesse qu'elle n'en reçoit, sans règle à part. Un cassable porte une solidité : une pour les caisses et les explosifs, trois pour les barricades et les colonnes. `hitBreakable`, dans `rules/contacts.ts`, décide à chaque contact : le projectile et le Boulet de siège brisent d'un coup ; une caisse ou un explosif cède à quatre unités par seconde ; une barricade ou une colonne perd un cran à trois, journalise `crack` avec le reste, et casse à zéro. L'explosion est une fonction du monde : dégâts et poussée sur tout cercle à moins de deux unités, puis rupture des cassables à portée, ce qui enchaîne les explosifs voisins ; chaque boîte est détruite avant de propager, donc n'explose qu'une fois. La solidité fait partie de la signature d'état du solveur. Le rendu dessine les fissures sur un calque au-dessus des accessoires, une par cran perdu, avec une suite pseudo-aléatoire fixée par l'entité pour qu'elles ne tremblent pas.

## Campagne et écrans

`data/campaign.ts` décrit une ligne de nœuds ; deux successeurs forment un embranchement. `app/game.ts` transporte l'état du héros d'une salle à l'autre, mémorise l'état d'entrée pour la reprise après défaite, et affiche des écrans de transition dessinés par le renderer : salle terminée, défaite, deux chemins, pouvoir trouvé, fin. L'échelle de temps vaut 1, puis 2 et 3 après une et deux secondes sans contact, 8 sur un tap pendant le mouvement, 0,25 pendant quatre dixièmes de seconde quand le dernier ennemi tombe. La simulation ne voit jamais ces échelles : seul l'accumulateur change.

Le marqueur d'arrêt est coloré face aux zones telles qu'affichées, sans anticiper les sonnés : rouge barré si l'arrêt chevauche une zone, orange si la prédiction a touché un corps mobile ou si le halo touche une zone, vert sinon.

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

## Limites connues de la version 0.2

- Boîtes alignées sur les axes uniquement, sans rotation.
- Interface en formes et texte système, sans asset de jeu ni son. Seules les icônes d'installation existent.
- Les écrans d'accueil, d'options, de crédits et de pause, ainsi que la sauvegarde, viennent en phase 4.
- La prédiction se recalcule sur le fil principal ; si elle devient coûteuse, elle passera dans un Worker.
- Un gouffre ne teste que le centre du corps : plus étroit qu'un pas à vitesse maximale, 0,12 unité, il pourrait être franchi. Les salles n'en contiennent pas de si étroit.
- Le solveur n'utilise jamais le frein.
