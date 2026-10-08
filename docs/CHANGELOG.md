# Journal des modifications

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/). Versionnage sémantique.

## [0.5.3] — 2026-10-08 — Contrats et second avant-poste

### Ajouté

- Contrats secondaires par salle : sans dégât, en N tours au plus, briser N cassables, sonner N ennemis d'un lancer ; réussis à la victoire, ils rendent un cœur ou remplissent la jauge. Ligne sous l'objectif avec avancement et rupture, résultat sur l'écran de victoire, son et lueur.
- Les Terrasses, second avant-poste après le Portier : le Perron (ressorts), le Mur d'écus (boucliers), la Poudrière (explosifs en chaîne), l'Infirmerie (guérisseuse, usure, choix d'une forme) ou le Verger suspendu (bâtisseuse, deux cœurs rendus), l'Atelier du Boutefeu (bouclier et artificière), le Belvédère et son gardien Mâche-Bastion, à blesser par tonneau, éboulement ou boulet renvoyé par un ressort. Chaque salle porte un contrat et passe le solveur pour les quatre entrées possibles : 43 résolutions en 45 secondes. Section 15 du GDD, lore à valider.
- Carte de campagne avec un en-tête par avant-poste ; épilogue à deux gardiens et deux œufs.

### Modifié

- Le plafond de trois boîtes posées par genre compte les poses de la salle, plus les boîtes du décor ni celles déjà brisées.
- `boulderDamage` remplace `boulderDamageToBoss` : un boulet projeté blesse tout ennemi de deux points.
- GDD 14.2 et 14.3 précisés : poussée d'explosion indépendante de la masse, artificier à portée de son propre tonneau.

## [0.5.2] — 2026-10-08 — Boucliers et rôles

### Ajouté

- Bouclier orienté : l'ennemi blindé tourne son bouclier vers Dodu au début du tour. Un impact de face, à moins de 90 degrés, renvoie Dodu sans le blesser, sans le coller ni déclencher d'arc ; de dos, dégâts normaux. Projectiles, explosions et sonné l'ignorent. Arc d'acier dessiné sur le corps.
- Rôle guérisseur : en fin de tour, s'il n'est pas sonné, rend un point à chaque autre ennemi blessé ; petite zone de soin sans dégâts.
- Rôle artificier : sa zone ne frappe plus, il y pose un explosif en fin de tour si la place est libre. Rôle bâtisseur : même chose avec une caisse. Trois boîtes posées au plus par genre.
- Les zones des rôles sont dessinées en ambre et l'aide à la visée ne les compte pas comme un danger. Pastille colorée du rôle sur le corps.
- Validateur : `shield` et `role` sur un ennemi, deux rôles au plus par salle, rien sur le boss.
- Campagne : le crapaud de la Nurserie volée est artificier, la gelée de la Forge du rempart est guérisseuse, le rocailleux de tête de la Herse porte un bouclier. Le solveur résout toujours toutes les salles ; la Forge passe de quatre à six tours.
- Événements `shield`, `enemyHeal` et `place` avec sons et particules. Neuf tests dans `tests/roles.test.ts`.

### Modifié

- GDD 14.3 précisé : guérisseur inactif s'il est sonné, zones des rôles sans dégâts, plafond de boîtes posées, boss sans bouclier ni rôle.

## [0.5.1] — 2026-10-08 — Décor actif et usure

### Ajouté

- Ressort : boîte à rebond 1,3, teintée en bleu ; ce qui la touche repart plus vite qu'il n'est arrivé. Un ressort borde le mur gauche du Chemin de ronde.
- Caisse explosive, teintée en orange : elle éclate au premier impact à 4 unités par seconde ou plus. Deux points aux ennemis à moins de 2 unités, un point à Dodu, poussée vers l'extérieur, cassables voisins brisés, explosifs voisins en chaîne. Une caisse explosive attend près de la colonne d'ennemis de la Herse.
- Usure : barricades et colonnes ont trois points de solidité ; tout impact à 3 unités par seconde ou plus en retire un et laisse une fissure dessinée sur la boîte. Le projectile et le Boulet de siège les brisent toujours d'un coup. Les caisses cassent toujours au premier coup.
- Événements `crack` et `explosion` journalisés, avec sons, arrêt image long et gerbes de particules ; la solidité des cassables entre dans la signature du solveur.
- Salle grise d'essai : un ressort et un explosif, pour la fumée et les rejeux dorés.
- Neuf tests du décor actif dans `tests/scenery.test.ts`.

### Modifié

- Le validateur accepte `bouncy` sur une boîte, le genre cassable `explosive`, et un rebond de boîte jusqu'à 1,5. Un ressort n'est pas cassable.
- Rejeux dorés régénérés : la physique reproduit encore les lancers de référence à l'identique, seuls les événements de règles de la salle grise changent avec son nouveau décor.

## [0.5.0] — 2026-10-08 — Pouvoirs : trois formes et un élément

### Ajouté

- Forme Rebond : rebond vif, saut par-dessus les caisses lancé à au moins 4 unités par seconde ; version forte : franchit aussi barricades et colonnes. Réalisé par un filtre de collision pur dans la physique, donc prédit exactement par l'aide à la visée.
- Forme Glu : Dodu s'ancre au premier mur ou boîte touché, une fois par lancer ; version forte : il s'accroche aussi au premier ennemi frappé.
- Élément Électricité : chaque ennemi blessé foudroie ses voisins à moins de 1,8 unité ; version forte : la chaîne saute d'ennemi en ennemi, deux sauts au plus, chaque ennemi une seule fois. Le boss ignore les arcs.
- Synergies, affichées à l'écran de choix : avec Pierre, les arcs du Boulet de siège infligent deux points ; avec Rebond, rayon des arcs à 2,4 ; avec Glu ancré sur un ennemi, rayon à 3.
- La Forge du rempart offre le choix d'une forme parmi trois, la Herse offre l'Électricité. La jauge de charge se remplit dès qu'un pouvoir est tenu et déclenche la version forte de tout ce qui est équipé.
- Arcs électriques et ancrage rendus à l'écran, teinte du corps de Dodu selon la forme, étiquette du pouvoir avec l'élément.
- Le solveur vérifie les salles 5 et 6 avec chaque forme, l'élément seul, Pierre et Électricité, et sans rien : quinze résolutions en seize secondes.
- Section 14 du GDD : conception détaillée de la phase 5, validée par défaut sauf objection.

### Corrigé

- La traversée du premier obstacle, propre au Boulet de siège, ne s'appliquait pas qu'à la forme Pierre.

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
