# Feuille de route — FRONDE

Dernière mise à jour : 8 octobre 2026. Versionnage sémantique, versions 0.x pendant le développement. Chaque phase se termine par un critère de sortie vérifiable ; on ne passe pas à la suivante tant qu'il n'est pas atteint.

## Décisions qui structurent cette feuille de route

- Physique déterministe, pas de temps fixe, aucun aléatoire dans les collisions.
- Tout ce qui bouge est rond ; le décor est statique et éventuellement cassable.
- Zones d'attaque fixées au sol, ennemi sonné s'il est déplacé au-delà d'un seuil.
- Collant = fin de course immédiate. Charge alimentant la version forte du pouvoir équipé.
- Tranche verticale d'abord : un héros, un pouvoir, trois ennemis, six salles dont un boss, un seul embranchement, deux objectifs.
- Univers : aventure épique fantasy, identité du héros à valider par le propriétaire.
- Stack : TypeScript strict, Vite, PixiJS 8 en rendu pur, ECS maison, physique 2D maison, Web Audio, Vitest, Playwright, PWA, déploiement GitHub Pages.

## Phase 0 — Réinitialisation et cadrage — terminée

- Dépôt vidé, documents de suivi créés.
- Concept FRONDE analysé, arbitrages validés, GDD rédigé, inventaire des assets libres réalisé.

## Phase 1 — Socle technique et prototype gris — v0.1 — terminée le 8 octobre 2026

Résultat : 23 tests unitaires et 2 tests de fumée mobile verts, prédiction exacte de l'arrêt prouvée par test, 2,6 ms par prédiction en Node. Écart par rapport au plan : le balayage continu est remplacé par une résolution par temps d'impact avec plafond de vitesse, qui donne la même garantie ; la mesure à 60 images par seconde sur téléphone réel reste à faire par le propriétaire.

**Livrables**

- Projet Vite + TypeScript strict, Vitest, ESLint, scripts `dev`, `build`, `test`, `lint`, `check`.
- ECS maison léger : entités, composants typés, systèmes ordonnés, requêtes.
- Physique 2D déterministe : cercles dynamiques, segments et boîtes statiques, restitution et friction par corps, balayage continu contre les traversées, pas fixe, sous-pas, état clonable.
- Simulation headless : lancer complet calculé à l'avance pour le marqueur d'arrêt, politique de divulgation réglable par données.
- Rendu PixiJS en formes grises : une salle, le héros, trois cercles ennemis inertes, murs et caisses.
- Geste de lancer : pose du doigt n'importe où, tir en arrière, zone morte, annulation, premier segment affiché, marqueur d'arrêt coloré.
- Intégration continue GitHub Actions : lint, typage, tests, build, déploiement sur GitHub Pages.
- Document d'architecture dans `docs/ARCHITECTURE.md`.

**Tests**

- Déterminisme : deux exécutions du même lancer donnent le même état, à l'octet près.
- Rejeux dorés : lancers de référence avec position finale attendue.
- Traversées : aucun corps ne franchit un mur à vitesse maximale.
- Un test Playwright de fumée sur viewport mobile : chargement, geste, lancer, arrêt.

**Critère de sortie**

Un lancer est prévisible, identique à chaque rejeu, et tourne à 60 images par seconde sur un téléphone de milieu de gamme en formes grises.

## Phase 2 — Boucle de tour complète en gris — v0.2 — terminée le 8 octobre 2026

Résultat : les sept salles de la tranche verticale se terminent en gris, le solveur les valide à chaque exécution de la CI, 56 tests unitaires et 3 tests de fumée verts. Reste à vérifier avec une personne extérieure que le tour se comprend sans explication, critère de sortie qui dépend d'un test joueur.

**Livrables**

- Tour en six étapes, ordre fixe. Intentions et zones au sol, attaque des ennemis, défaite et victoire.
- Les trois ennemis avec leur personnalité physique : gonflable, collant avec fin de course immédiate, lourd. Règle du sonné.
- Points de vie, dégâts d'impact, dégâts d'écrasement contre un mur, barricades cassables, tremplins, zones dangereuses.
- Frein à bouton dédié, une charge par salle. Jauge de charge remplie par les rebonds, version faible et forte du pouvoir unique.
- Objectifs éliminer et pousser un objet rond jusqu'à une zone. Enchaînement des six salles en carte linéaire avec un embranchement. Boss à grande masse.
- Accélération automatique, tap pour passer, ralenti court sur le dernier ennemi, trace fantôme après le lancer.
- Salles décrites en JSON validé par schéma. Solveur headless qui prouve l'existence d'une séquence gagnante et rejette les salles triviales.

**Tests**

- Règles de tour testées en Node sans navigateur, audio et rendu mockés.
- Solveur en dry-run sur les six salles à chaque exécution de la CI.
- Rejeux dorés étendus aux collisions entre ennemis.

**Critère de sortie**

Les six salles se terminent en gris, le solveur les valide, et une personne extérieure comprend le tour sans explication orale.

## Phase 3 — Habillage de la tranche verticale — v0.3 — livrée le 8 octobre 2026, en attente du test joueur

Résultat : assets libres intégrés avec manifeste, crédits et test de licences ; Dodu et les ennemis expressifs ; retours visuels et sonores ; interface et écrans habillés ; décor Sokoban retenu par délégation du propriétaire au Lead. Le critère de sortie, la première minute amusante sur un vrai téléphone, reste à constater par une personne extérieure.

**Livrables**

- Assets libres intégrés depuis l'inventaire vérifié, atlas unique, crédits et licences dans le dépôt.
- Héros expressif : écrasement et étirement, expressions à l'impact, au repos, au danger.
- Feedback : hit-stop court, gamme montante des combos, éclats, destruction du décor, règle "rien ne masque la trajectoire".
- Interface portrait : haut d'écran pour l'état, bas d'écran pour le frein et le pouvoir, zones de pouce, encoche gérée.
- Audio Web Audio : bruitages, musique, déverrouillage iOS au premier toucher, réglages de volume.
- PWA installable, plein écran portrait, hors ligne : livrée par anticipation en 0.1.1.

**Tests**

- Test Playwright de fumée étendu : écrans, son réellement en lecture, lancer, fin de salle.
- Vérification automatique que chaque asset du dépôt est cité dans les crédits avec sa licence.

**Critère de sortie**

La première minute est amusante sur un vrai téléphone, constatée par au moins une personne qui n'a pas travaillé sur le jeu. La validation technique ne vaut pas preuve de plaisir.

## Phase 4 — Structure de run — v0.4 — livrée le 8 octobre 2026

Résultat : accueil, options avec mode test, crédits, pause, carte, sauvegarde et reprise, fin de run à deux épilogues ; 86 tests unitaires et 6 tests de fumée dont la reprise après rechargement. La génération seedée de la carte reste à venir avec un contenu plus large : la tranche a une carte fixe.

- Écrans d'accueil, options avec mode test, crédits, pause, fin de salle, choix de pouvoir avec synergies affichées.
- Sauvegarde locale, reprise, redémarrage.
- Carte à embranchements complète : salle risquée contre salle de récupération, génération seedée, aléatoire limité à la carte et au butin.
- Boss en fin de run, deux épilogues de salle finale au minimum.

Critère de sortie : un run complet se joue du début à la fin, se sauvegarde et se reprend.

## Phase 5 — Contenu et options validées après la tranche verticale — v0.5 et suivantes — en cours

Découpée en quatre livraisons : 5.1 pouvoirs, livrée le 8 octobre 2026 en 0.5.0 ; 5.2 ressorts, explosifs et usure ; 5.3 boucliers et rôles ; 5.4 contrats et second avant-poste. Conception en section 14 du GDD.

- Deux autres formes de pouvoir et électricité avec propagation.
- Boucliers orientés, ressorts et explosifs, parois à usure progressive, état "fissuré", contrats secondaires par salle.
- Rôles d'ennemis : guérisseur, artificier, bâtisseur, deux par salle maximum.
- Personnages supplémentaires, sans rendre les anciens inutiles.
- Salles supplémentaires produites en JSON et filtrées par le solveur.

Critère de sortie : chaque ajout passe le solveur et ne dégrade pas la lisibilité, mesurée par le nombre de zones dangereuses par salle.

## Phase 6 — Polish et publication — v1.0

- Équilibrage piloté par le solveur et les rejeux, accessibilité, performance sur téléphones modestes, page de crédits complète.
- Publication sur GitHub Pages, page d'évaluation pour recueillir les retours.

## Hors périmètre de la version 1.0

- Réactions élémentaires combinées, portails, surfaces glissantes.
- Tirs limités et ligne à protéger, déplacement libre du décor, duplication du héros : rejetés.
- Défis quotidiens seedés et partage de rejeux : en boîte à idées.
