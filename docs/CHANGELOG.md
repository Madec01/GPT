# Journal des modifications

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/). Versionnage sémantique.

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
