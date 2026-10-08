# Journal des modifications

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/). Versionnage sémantique.

## [0.4.0] — 2026-10-08 — Structure de run

### Ajouté

- Écran d'accueil : Jouer ou Continuer la partie, Nouvelle partie, Options, Crédits. La première salle sert de décor derrière l'accueil.
- Options : volumes général, bruitages et musique par paliers, frein à gauche ou à droite, mode test avec invincibilité, trajet complet affiché et choix de la salle de départ. Options persistées.
- Crédits à l'écran, paginés, avec les attributions exactes des ressources CC BY.
- Pause depuis un bouton en haut de l'écran : reprendre, recommencer la salle, carte, options, quitter vers l'accueil.
- Carte de l'avant-poste : les salles dans l'ordre, l'embranchement sur une ligne, la salle courante fléchée, les salles traversées cochées.
- Sauvegarde automatique à chaque entrée de salle : nœud, état du héros, chemin et statistiques ; reprise depuis l'accueil ; effacement en fin de run.
- Fin de run à deux épilogues selon les dégâts subis, avec salles, tours et dégâts du run.
- Diagnostic audio à l'écran avec `?diag=1`.

### Corrigé

- B-002 : son muet sur téléphone. Déverrouillage au relâché du doigt en plus de l'appui, session de lecture déclarée, reprise du contexte à chaque geste, musique relancée si elle n'a pas démarré.

## [0.3.0 à 0.3.2] — 2026-10-08 — Habillage de la tranche verticale et correctifs du son

### Ajouté

- Moteur d'habillage : manifeste d'assets typé, chargement des textures et polices, substituts vectoriels pour toute clé absente.
- Dodu expressif : corps, yeux et bouche en couches, sept expressions pilotées par la phase, le marqueur de visée et les chocs ; écrasement et étirement à l'impact. Ennemis avec expressions normal, sonné et touché, étoiles de sonné.
- Retours : étincelles, lueur, poussière, débris de bois et de pierre, arrêt image sur mort, casse et coup reçu, règle "rien ne masque la trajectoire" avec masque d'arène.
- Son : bruitages Web Audio par événement de règles, gamme pentatonique montante des combos, musique par salle avec fondu, déverrouillage iOS au premier toucher, volumes persistés.
- Interface et écrans en panneaux et boutons du pack, polices Lilita One et Nunito quand elles sont chargées.
- Assets libres de l'ensemble A intégrés avec manifeste, crédits et test de licences : 74 sprites, 22 sons, 3 musiques de Scott Buckley, polices Lilita One et Nunito, 12 Mo dont 11 de musique.
- Décor Sokoban de Kenney, plat et cohérent avec les personnages, retenu après comparaison avec Scribble Dungeons ; les tuiles Scribble non retenues ont été retirées, seul le tremplin en vient.
- Application hors ligne : polices et bruitages précachés, musique mise en cache à la première lecture.

### Corrigé

- B-001 : le halo d'incertitude ne déborde plus de l'arène.

## [0.2.0] — 2026-10-08 — Boucle de tour complète en gris

### Ajouté

- Règles de jeu dans l'ECS, clonables et prédictibles : intentions figées au sol, règle du sonné par déplacement, attaques des ennemis, victoire et défaite, objectifs éliminer et pousser.
- Les trois ennemis avec leur personnalité de contact : crapaud bumper qui éclate à grande vitesse, gelée qui arrête Dodu net, rocailleux projectile. Boss à grande masse battu par boulets, colonnes effondrées et Boulet de siège.
- Dégâts d'impact et d'écrasement, caisses, barricades et colonnes cassables, tremplins, gouffres, cœurs de soin tirés d'un générateur seedé.
- Frein à bouton dédié, une fois par salle. Jauge de charge et pouvoir Pierre en version faible et forte.
- Campagne en nœuds avec embranchement, état du héros transporté entre salles, écrans de salle terminée, défaite, deux chemins, pouvoir trouvé et fin.
- Interface grise : cœurs, nom de salle et tour, objectif, bouton de frein, pouvoir et jauge ; zones annoncées, grisées quand l'ennemi est sonné ; points de vie et étoiles de sonné sur les ennemis ; marqueur d'arrêt vert, orange ou rouge barré.
- Accélération automatique par paliers, tap pour passer, ralenti court sur le dernier ennemi.
- Salles en JSON validées par un schéma sans dépendance. Solveur headless déterministe et script `npm run solve` exécuté par la CI. Les sept salles de la tranche verticale, embranchement compris, sont résolues en une à quatre tours, avec et sans le pouvoir Pierre pour les salles 5 et 6, en six secondes.
- Tests : règles de contact et de tour, intentions, déterminisme avec règles, schéma, rejeu doré des règles, solveur ; tests de fumée mis à jour aux phases de tour.

### Modifié

- Les événements de contact portent les vitesses avant résolution ; le crochet de contact peut déclencher une recollecte des corps ; la simulation exécute des systèmes après la physique.
- La salle grise utilise les archétypes et sert de campagne d'essai.

## [0.1.1] — 2026-10-08 — Installable sur téléphone

### Ajouté

- Application web installable : manifeste avec nom, icônes 192 et 512 dont une version maskable, affichage autonome, orientation portrait ; service worker Workbox avec mise à jour automatique et jeu hors ligne après la première visite ; icône Apple et métadonnées plein écran iOS ; favicon SVG.
- Icônes de Dodu générées par script, boule dorée à deux yeux et bec sur fond sombre.
- Marges d'interface augmentées des zones sûres de l'appareil, encoche et barre de geste, lues depuis les variables CSS.
- Activation de GitHub Pages par le workflow quand le jeton le permet.

### Modifié

- Phase 3 de la feuille de route : la PWA, prévue plus tard, est livrée dès maintenant à la demande du propriétaire.

## [0.1.0] — 2026-10-08 — Socle technique et prototype gris

### Ajouté

- Projet Vite 8, TypeScript 6 strict, Vitest 5, ESLint 10 avec règles interdisant aléatoire, horloge et trigonométrie dans la simulation, Playwright 1.64, PixiJS 8.22.
- ECS maison : entités, composants en données simples, requêtes par identifiant croissant, clone profond, instantané stable.
- Physique 2D déterministe : cercles dynamiques, segments et boîtes statiques, pas fixe de 1/120 s, contacts résolus par temps d'impact, restitution maximale, décélération de roulement, plafond de vitesse, sommeil, événements de contact et crochet pour les règles de jeu.
- Simulation à cadence fixe avec lancer, frein, journal d'entrées, clone et instantané ; rejeu d'un journal ; prédiction d'un lancer par clone joué jusqu'à l'arrêt.
- Geste de fronde en machine d'état pure : zone morte, rayon maximal, annulation, un seul pointeur.
- Rendu PixiJS en formes grises : arène ajustée au portrait, décor, trace fantôme, corps, premier segment de visée, marqueur d'arrêt vert ou orange avec halo d'incertitude, indicateur de geste.
- Salle grise avec trois cercles inertes préfigurant les trois ennemis et trois boîtes.
- Tests : 23 tests unitaires dont preuves de déterminisme, absence de traversée sur 150 lancers à vitesse maximale, rejeux dorés ; 2 tests Playwright de fumée sur viewport mobile 390 x 844.
- Intégration continue GitHub Actions : lint, typage, tests, fumée mobile, build, déploiement GitHub Pages depuis `main`.
- Document d'architecture.

### Validé par le propriétaire

- Héros Dodu et univers de Rondeval, direction artistique vectorielle (ensemble A de l'inventaire), tous les points du GDD précédemment marqués à valider.

## [0.0.1] — 2026-10-08 — Cadrage de FRONDE

### Ajouté

- Concept FRONDE présenté par le propriétaire, analysé et validé avec neuf arbitrages : physique déterministe, zones d'attaque au sol et ennemi sonné, collant à fin de course immédiate, corps mobiles ronds, charge alimentant la version forte du pouvoir, poussée d'objet à la place de l'escorte, tranche verticale, univers d'aventure épique fantasy, frein à bouton dédié.
- Options issues du concept RICOCHET tranchées : retenues pour après la tranche verticale ou rejetées, voir la boîte à idées.
- Document de conception [GDD.md](GDD.md), rédigé par le sous-agent Game Designer. Les propositions d'univers et d'identité du héros y sont taguées à valider.
- Inventaire des ressources libres [ASSETS_SURVEY.md](ASSETS_SURVEY.md), rédigé par le sous-agent Assets : licences recopiées depuis chaque page, deux ensembles visuels cohérents proposés, ressources écartées documentées.
- Feuille de route en six phases avec livrables, tests et critères de sortie.

### Modifié

- Boîte à idées réorganisée : RICOCHET absorbé comme inspiration de FRONDE, options différées listées, COLOSSAL et CONTRETEMPS conservés.

## [0.0.0] — 2026-10-08 — Réinitialisation

### Supprimé

- Le jeu ABYSSE dans son intégralité : pages HTML, feuilles de style, modules JavaScript, simulation, rendu three.js, niveaux, audio, sauvegarde, page d'évaluation.
- Les ressources d'ABYSSE : 17 modèles GLB, 15 fichiers audio OGG, polices, icônes SVG, manifestes et fichiers de licence associés.
- La bibliothèque three.js vendorisée et ses utilitaires.
- Les tests, scripts de vérification de campagne, scripts de parcours navigateur et le workflow d'intégration continue.
- Les résidus du jeu antérieur MINUIT AU MUSÉE, qui n'étaient plus chargés par aucune page.
- La documentation de conception, de moteur, d'assets, d'audio et d'assurance qualité d'ABYSSE, ainsi que le journal de bord et les crédits.
- Le `package.json` d'ABYSSE et le marqueur `.nojekyll`. Le site GitHub Pages associé ne sert plus rien.

### Conservé

- L'historique git complet. Le dernier commit contenant ABYSSE est `8f47d94`.
- Les trois concepts de jeu en réserve, les retours utilisateur et les contraintes héritées, déplacés dans [BACKLOG.md](BACKLOG.md).

### Ajouté

- README de réinitialisation décrivant la gouvernance et la stack cible.
- Les quatre documents de suivi : feuille de route, journal des modifications, registre des bugs, boîte à idées.
- Un `.gitignore` adapté à un projet Vite et TypeScript.
