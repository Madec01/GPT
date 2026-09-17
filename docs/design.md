# MINUIT AU MUSÉE — dossier de conception

## Vision
Un jeu d’infiltration nocturne en neuf galeries, jouable immédiatement dans un navigateur. Le joueur reprend les œuvres confisquées par un collectionneur pour les restituer à leurs propriétaires. Le plaisir recherché est de lire une ronde, créer une ouverture et réussir un passage propre ; aucune violence n’est nécessaire.

Public : joueurs occasionnels ou habitués des jeux d’infiltration, parties de cinq à quinze minutes avec reprise entre niveaux. Direction : musée élégant, éclairages chauds dans la nuit, œuvres identifiables et danger nettement lisible.

## Univers et personnages
**Vesper**, collectionneur, a acquis sa réputation grâce à des confiscations. **Mara**, archiviste du quartier, a retrouvé les preuves et les propriétaires ; elle accompagne à distance le personnage joueur. Les gardiens font leur travail sans connaître l’origine des collections : les détourner remplace le combat.

Acte I : entrer, identifier les œuvres, apprendre les rondes et la diversion. Acte II : pénétrer dans les ailes protégées et retrouver les archives. Acte III : récupérer la collection privée et le triptyque collectif de l’aube. La fin montre la restitution et la mise à disposition des preuves. L’objectif narratif est entièrement résolu.

## Boucle principale
Lire une courte mission → observer la salle → collecter toutes les œuvres dans l’ordre choisi → atteindre la sortie → découvrir la conséquence narrative → ouvrir la galerie suivante. La première salle enseigne déplacement, collecte et sortie sans garde ni laser. Chaque nouvelle règle est ensuite isolée avant d’être combinée.

### Mécaniques
1. Déplacement et lecture des lignes de vue : les murs coupent les cônes de surveillance. Le déplacement discret ralentit le personnage et permet une approche maîtrisée.
2. Leurre sonore : Q attire un garde vers le point visé pendant cinq secondes. Charges limitées par salle, renouvelées au niveau suivant.
3. Lasers temporisés et brouilleur : les faisceaux alternent trois secondes actifs et deux éteints. E les neutralise six secondes. Un leurre ne neutralise pas un laser ; un brouilleur ne détourne pas un garde.
4. Collecte puis extraction : les œuvres peuvent être récupérées dans n’importe quel ordre ; la sortie ne valide la galerie qu’une fois l’inventaire complet.

Les ressources doivent encourager l’utilisation : aucun stock ne doit être conservé pour le niveau suivant. Le temps indicatif récompense une meilleure exécution, sans interdire de prendre son temps. L’échec concerne seulement la salle courante et ne supprime pas les niveaux acquis.

## Campagne
| # | Galerie | Apprentissage / enjeu | Gardes | Lasers | Leurre / EMP | Temps cible initial |
|---|---|---|---:|---:|---:|---:|
| 1 | La réserve oubliée | Collecter et ressortir | 0 | 0 | 0 / 0 | 55 s |
| 2 | La ronde de nuit | Observer une ronde | 1 | 0 | 0 / 0 | 65 s |
| 3 | Un bruit dans le silence | Détourner le garde | 1 | 0 | 3 / 0 | 70 s |
| 4 | La ligne rouge | Attendre un laser ou utiliser l’EMP | 0 | 2 | 0 / 2 | 70 s |
| 5 | Le salon des miroirs | Combiner observation et outils | 2 | 1 | 3 / 2 | 85 s |
| 6 | Les archives de verre | Traverser plusieurs compartiments | 2 | 2 | 3 / 2 | 90 s |
| 7 | Le jardin intérieur | Changer d’abri entre deux rondes | 2 | 2 | 3 / 3 | 95 s |
| 8 | La collection privée | Choisir sa tournée de quatre œuvres | 3 | 3 | 4 / 3 | 115 s |
| 9 | La salle de l’aube | Synthèse et restitution finale | 3 | 3 | 4 / 3 | 120 s |

Les valeurs de temps sont des objectifs de score initiaux, jamais des échéances éliminatoires. La difficulté vient des décisions simultanées, pas de cônes invisibles ou de passages exigeant une précision à la frame.

## Parcours conseillés pour la QA
Coordonnées en cellules, origine en haut à gauche. Les chemins intermédiaires doivent suivre le sol ; ces listes indiquent l’ordre d’objectifs et non une solution temporelle garantie contre les patrouilles.

| Niveau | Ordre conseillé des œuvres | Stratégie |
|---|---|---|
| 1 | (3,2), (10,5), (16,2), sortie (17,9) | Contourner les deux îlots, apprendre le clic de déplacement. |
| 2 | (4,4), (16,9), sortie (2,2) | Rejoindre la partie droite par le passage central ; contourner le garde par le sud. |
| 3 | (3,3), (9,2), (16,5), sortie (17,9) | Créer une diversion loin du pendentif avant de traverser le haut. |
| 4 | (15,9), (15,2), sortie (2,2) | Tester une traversée au cycle puis une traversée sous EMP. |
| 5 | (3,2), (10,5), (16,2), sortie (17,9) | Préparer la collecte centrale ; détourner la ronde haute. |
| 6 | (3,2), (10,2), (16,2), sortie (17,9) | Utiliser les espaces au nord pour observer chaque compartiment. |
| 7 | (3,2), (10,5), (16,2), sortie (17,9) | Prendre l’œuvre centrale à couvert entre les deux rondes. |
| 8 | (3,6), (3,2), (17,2), (17,6), sortie (17,9) | Faire le tour extérieur ; réserver une diversion à la galerie droite. |
| 9 | (3,2), (10,2), (17,2), sortie (17,9) | Faire une pause avant la pièce centrale ; garder un outil pour l’extraction. |

## Contrat de données
`js/levels.js` exporte `LEVELS`, neuf objets indépendants. Chaque carte mesure 20 × 12 cellules de 48 px ; `#` désigne un mur et `.` un sol. Les murs périphériques sont continus. `player`, `exit`, `loot`, les points de patrouille et les extrémités laser occupent exclusivement du sol. Les patrouilles forment des cycles dont chaque segment est horizontal ou vertical et libre de mur. `phase` décale le cycle laser. `charges` définit les quantités de leurres et d’EMP à l’entrée de la salle.

Champs narratifs : `story` avant la salle, `epilogue` après réussite, `hint` rappel d’une règle, `act` progression générale. `asset` utilise les identifiants `gem`, `painting`, `statue` ; leur résolution vers les fichiers de banque revient au manifeste graphique. Aucun dessin provisoire ne constitue un asset final.

## Direction artistique et audio
La cohérence du musée prime sur la variété des banques : architecture sombre, sols chaleureux, œuvres contrastées, icônes compréhensibles. Les cônes et faisceaux sont des informations de gameplay rendues par le moteur ; bâtiments, personnages, œuvres, interface, polices et sons doivent employer les ressources sous licence vérifiée sélectionnées par la direction artistique. Les preuves de licence et attributions finales figurent dans le journal principal et les crédits, pas dans des affirmations de licence non vérifiées ici.

Musique : tension douce et élégante issue d’un enregistrement ou d’une banque, sans synthèse chiptune. Les sons de collecte, signal de détection, laser et outils doivent être différenciables et les volumes réglables.

## Décisions et vérifications — 17 septembre 2026
- Pivot complet : l’utilisateur a refusé le concept ferroviaire. Aucun texte, niveau ni système de courrier n’est conservé dans ces données.
- Neuf salles composées à la main retenues plutôt que génération procédurale : apprentissage fiable et qualité vérifiable.
- Première salle sans danger ; quatrième salle sans garde pour isoler la découverte des lasers.
- Grilles entièrement connectées ; accès aux objectifs validé par parcours en largeur depuis le départ.
- Validation statique effectuée sur les neuf cartes : dimensions, murs périphériques, positions sur sol, accessibilité de toutes les œuvres et sorties, segments de patrouille alignés sans mur, extrémités laser sur sol.
- Les routes proposées servent aux tests de jeu ; leur sécurité face au moteur réel doit être mesurée en situation, la validation statique ne remplaçant pas cette vérification.
- Alternatives écartées : combat, inventaire marchand, construction de carte, procedural, chronomètre de défaite. Elles n’améliorent pas la lecture rapide d’une salle ni la satisfaction de sa traversée.

## Preuve dynamique de fin de campagne — 17 septembre 2026
Le solveur `scripts/solve-campaign.mjs` a exécuté les neuf salles sur la classe `Simulation` réelle, sans changement du moteur, téléportation, invulnérabilité ni désactivation de gardes. Il cherche des trajectoires et attentes, puis utilise les seules commandes publiques `setTarget`, `update`, `decoy` et `emp`. Les états copiés servent uniquement à explorer les alternatives ; les replays finaux repartent toujours d’une simulation neuve et ne modifient aucun état interne.

`docs/solutions.json` conserve les neuf replays gagnants. `tests/campaign.test.mjs` les rejoue et exige toutes les œuvres, la vraie condition de victoire, zéro alerte et trois étoiles. Il vérifie aussi la vitesse réelle, la présence du joueur sur sol, les charges disponibles, une diversion effective au niveau 3 et un EMP réellement activé au niveau 4.

Résultat : **10 tests réussis**, neuf niveaux achevés sans alerte. Temps de parcours calculés : 15,48 ; 19,98 ; 18,63 ; 15,48 ; 15,48 ; 13,68 ; 16,38 ; 19,08 ; 19,08 secondes. Ces temps de solveur supposent une connaissance parfaite de la carte ; ils ne mesurent ni le temps d’apprentissage ni la durée d’une première partie humaine. Les temps cibles restent permissifs pour laisser de la place à l’observation.

Commandes : `node scripts/solve-campaign.mjs` pour recalculer les solutions ; `node --test tests/campaign.test.mjs` pour rejouer la preuve. Aucun rééquilibrage des cartes n’a été nécessaire pour obtenir ces neuf victoires propres.
