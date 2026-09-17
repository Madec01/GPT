# JOURNAL DE BORD — MINUIT AU MUSÉE

## Vision du jeu
Infiltrez les galeries d'un collectionneur qui expose des œuvres confisquées.
Observez les patrouilles, détournez leur attention et traversez les faisceaux pour récupérer les œuvres.
Ressortez sans vous faire arrêter : chaque restitution rapproche le musée de sa réouverture au public.

Public : amateurs d'infiltration accessible, souris ou clavier, sessions de quelques minutes.
Sensation recherchée : tension lisible, plaisir d'un passage audacieux et satisfaction d'une évasion propre.
Le premier objectif est atteignable en moins de 60 secondes. Pas de violence ni de combat.

## GDD
L'histoire, les textes et les neuf plans de mission sont dans js/levels.js et docs/design.md.
Boucle : briefing → repérer les patrouilles → choisir un passage → récupérer les œuvres → rejoindre la sortie → découvrir la restitution.
Trois systèmes se combinent : déplacement et lignes de vue, leurres sonores, lasers cycliques et impulsion EMP.
Les gardes suivent des itinéraires, voient dans un cône bloqué par les murs et enquêtent sur les leurres.
La détection augmente progressivement pour permettre de se mettre à couvert. Pleine alerte = échec de la mission, reprise illimitée.
Les œuvres sont ramassées à proximité. La sortie s'ouvre quand la collection de la mission est complète.
Les gadgets sont limités par mission, renouvelés au redémarrage. Pas d'achat ni de monnaie.
Une réussite déverrouille la mission suivante. Trois étoiles récompensent réussite, temps et discrétion ; elles ne bloquent jamais la campagne.

## Direction artistique et audio
Palette nocturne bleu encre, ivoire et laiton ; musée graphique vu du dessus, éclairage doux et silhouettes de banque.
Sources, auteurs, licences et transformations : CREDITS.md et assets/manifest.json.
Tous les assets distribués doivent être locaux ; aucune ressource CDN au lancement.
Musique préenregistrée issue de banque, bruitages de banque. Interdiction des oscillateurs musicaux respectée.

## Architecture technique
HTML/CSS + modules JavaScript natifs ; Canvas 2D pour le terrain et HTML pour les interfaces.
Simulation indépendante du DOM, pas fixe interne, collision sur grille 20×12 à cellules de 48 unités.
Navigation par clic avec recherche de chemin ; clavier directionnel/ZQSD/WASD prioritaire.
Sauvegarde localStorage tolérante aux erreurs, données versionnées. Mode test séparé de la progression.
Arborescence : index.html, css/style.css, js/{app,engine,renderer,audio,storage,levels}.js, assets/, tests/, docs/, README.md, CREDITS.md.
Choix du moteur maison : mécanique géométrique limitée, tests unitaires possibles, distribution sans compilation.

## Registre des décisions
| Date | Décision | Alternatives | Raison |
|---|---|---|---|
| 2026-09-17 | Abandon complet de Dernier Courrier | Continuer le ferroviaire | Demande explicite de l'utilisateur : ni jeu ni histoire ne lui plaisaient. |
| 2026-09-17 | Infiltration dans un musée | Action combat, gestion | Tension, observation et manipulation des patrouilles ; univers distinct des projets antérieurs. |
| 2026-09-17 | Neuf missions éditées | Procédural | Progression maîtrisée, fin narrative, vérification de chaque plan. |
| 2026-09-17 | Canvas + modules natifs | Phaser/Pixi | Pas de dépendance réseau au jeu, contrôle du rendu et moteur testable. |
| 2026-09-17 | Menu complet et mode test | Accueil minimal | Ajout explicite utilisateur : jouer, options, mode test, crédits et sélection des missions. |
| 2026-09-17 | Mode test sans progression | Déblocage permanent | Explorer tous les niveaux sans altérer la campagne. |

## Journal chronologique
- 2026-09-17 — Direction : accès GitHub confirmé, dépôt vide ; journal initial ferroviaire publié avant retour utilisateur.
- 2026-09-17 — Utilisateur : demande d'un accueil complet et d'un mode test intégrée.
- 2026-09-17 — Utilisateur : refuse le concept ferroviaire ; direction change intégralement jeu et histoire.
- 2026-09-17 — Agent design : réaffecté aux neuf missions de musée et à la narration.
- 2026-09-17 — Agent moteur : réaffecté à la navigation, patrouilles, visibilité, leurres, lasers et tests.
- 2026-09-17 — Agent assets/audio : réaffecté aux silhouettes et illustrations de musée, avec licences vérifiées.
- 2026-09-17 — Direction : nouveau journal, menus, rendu, sauvegarde et intégration en production. Tests disponibles : Node 24 et navigateur Chromium via Playwright. Les résultats seront consignés après exécution.

## Problèmes et solutions
- Téléchargement réseau direct limité : récupération par connecteurs autorisés ; aucune tentative de contournement.
- Dépôt vide : initialisation par API GitHub. Commits ultérieurs publiés via arbres/blobs si le transport Git direct reste inaccessible.
- Changement de concept : abandon explicite des fichiers ferroviaires, ne pas livrer leurs données inutilisées.

## Idées écartées
- Jeu de train : rejeté par l'utilisateur.
- Combat : nuit à la lisibilité des mécaniques de diversion et de discrétion.
- Progression bloquée par étoiles : frustration inutile, toutes les réussites débloquent la suite.
- Argent, boutique, améliorations : complexité sans renforcer la boucle d'infiltration.
- CDN et musique synthétisée par oscillateurs : incompatibles avec les contraintes de livraison.

## Acquisition des assets — 2026-09-17
- Agent assets/audio : acquisition de 25 SVG Game-icons.net, tous attribués individuellement dans CREDITS.md sous CC-BY 3.0 ; retrait du fond et recoloration documentés.
- Police Manrope variable de Google Fonts, OFL 1.1 conservée. Ancienne police Lilita et illustrations ferroviaires supprimées après changement de concept.
- Bruitages Kenney CC0 : quatre fichiers OGG ; musiques OpenGameArt CC0 Project Utopia (18,32 s) et Snowfall (49,5 s), licences originales vérifiées, acquisition par miroir GitHub identifié. Aucune synthèse par oscillateur.
- Résolution technique : le connecteur GitHub renvoie le base64 des binaires inférieurs à 1 Mo. Sélection de morceaux complets en boucle compatibles ; les gros fichiers Carefree non acquis ont été abandonnés.
- Vérifications : décodage intégral FFmpeg des six fichiers audio sans erreur ; 32 assets avec taille et SHA-256 dans assets/manifest.json. Tous les assets sont locaux.

## Revue du moteur — 2026-09-17
- Agent moteur : simulation furtive terminée (navigation BFS souris/gardiens, collisions, lignes de vue, patrouilles, suspicion, œuvres, sortie, lasers, leurres, EMP et étoiles). Douze tests unitaires réussis sous Node 24, rapport détaillé dans docs/qa-engine.md.
- Agent moteur : correction de deux abus relevés en revue : leurres désormais limités à 180 pixels ; suspicion ne décroît plus sur un faisceau actif, permettant la capture en cas d'immobilité dessus. Portées de vision 170/125 pixels et angle publiés pour partager exactement les paramètres avec le rendu. Contrôle visuel du cône à réaliser lors de l'intégration du renderer.

## Intégration de la boucle — 2026-09-17
- Direction : accueil thématique, sélection de missions, briefings, HUD, pause, options, mode test, crédits, résultats et épilogue intégrés. Rendu Canvas avec silhouettes de banque, sol/murs texturés, cônes de vision obstrués, lasers, trajectoire au clic et effets de récupération.
- Direction : musique enregistrée menu/mission, volumes séparés, mute et suspension en arrière-plan ; options de réduction des animations ; sauvegarde robuste. Commandes physiques compatibles AZERTY/QWERTY, boutons de gadgets et navigation au clic.
- Agent design/QA : neuf missions gagnées par replays de vrais déplacements et gadgets, sans altération de visibilité ni téléportation. Dix tests campagne et douze tests moteur exécutés : 22 réussites. Replays et solveur conservés pour reprise.
- Limite environnement : navigateur Chromium local non installé ; téléchargement non abouti, interrompu. Le navigateur cloud ne peut pas ouvrir localhost. Vérification visuelle à poursuivre après mise à disposition des fichiers publics du dépôt. Aucun test Chrome/Firefox/Edge ne doit être annoncé réussi à ce stade.

- 2026-09-17 — Agent assets/audio : ajout de Cormorant Garamond Regular WOFF2 pour remplacer Georgia système dans les titres ; police originale Catharsis Fonts, licence OFL 1.1 conservée, manifeste et crédits mis à jour. Format WOFF2 original choisi pour son poids (206 Ko) et sa compatibilité web.

## Revue indépendante interface et audio — 2026-09-17
- Agent moteur : correction des retours Options → briefing/pause/résultat par conservation des vrais boutons et de l'état de pause ; changement du mode test annule explicitement l'essai. Sauvegardes locales malformées normalisées, volume et effets audio robustes aux erreurs de lecture et à l'onglet caché. Vingt tests moteur/UI réussis, dont huit tests supplémentaires sous VM Node avec DOM simulé. Détails et limites : docs/qa-ui.md. Parcours navigateur laissé à la direction.

## Lisibilité de livraison — 2026-09-17
- Agent moteur : mise en forme de app.js, audio.js, storage.js et renderer.js par le générateur Babel déjà disponible dans le runtime, sans plugin de transformation ni dépendance ajoutée ; arbres syntaxiques avant/après identiques. Indentation HTML/CSS/JSON et contrôle des caractères non blancs. Crédit musical affiché corrigé en « Project Utopia (seamless loop) » ; nom du fichier audio local inchangé. Trente tests globaux réussis après formatage.

## Contrôle visuel et finalisation — 2026-09-17
- Direction : inspection effective dans Chrome cloud d'un aperçu des fichiers publics du dépôt : accueil, briefing, rendu première et dernière galerie, déplacement au clic, pause, options, activation mode test, déverrouillage des neuf missions, impulsion EMP et persistance des options après rechargement.
- Résultat : chargement des graphismes, polices et scènes réussi ; aucune erreur provenant du jeu dans les journaux observés. Les messages d'erreur relevés proviennent d'une extension du navigateur de contrôle, pas de l'application.
- Corrections visuelles : déplacement d'une étiquette coupée par l'arrondi du panneau d'accueil ; ajout du crédit Cormorant dans le jeu et du favicon de banque.
- Corrections feedback : compteurs actualisés dès les événements de jeu. Diagnostic FPS calculé sur le temps réel entre images, séparément du pas de simulation borné.
- Le navigateur cloud cadence les actions de façon peu représentative : aucune promesse de 60 fps ni validation Firefox/Edge déduite de cet aperçu. Une suite GitHub Actions multi-navigateurs est ajoutée pour exécuter des scénarios complets dans des navigateurs séparés.
- Agent QA : suite navigateur écrite pour les véritables canaux Chrome et Edge ainsi que Firefox, en CI. Scénarios : victoire réelle par clics, pause/reprise, sauvegarde, rechargement, victoire test sans progression, gadgets de la dernière galerie, ressources et console ; captures desktop/mobile et cadence RAF enregistrées.
- Direction : transition légère entre écrans, neutralisée par l'option de réduction des animations et la préférence système. Source de l'automatisation : documentation officielle Playwright, https://playwright.dev/docs/ci et https://playwright.dev/docs/browsers.

## Livraison — 2026-09-17
- Direction : phases conception, boucle, production, QA et livraison terminées pour MINUIT AU MUSÉE 1.0.0. Le concept ferroviaire refusé n'est pas présent dans le jeu livré ; son abandon reste consigné dans l'historique.
- Code, neuf missions, épilogue, accueil, sélection, options, mode test, crédits, sons, musiques et sauvegarde présents sur main ; commits atomiques docs/feat/art/fix/test conservés.
- Validation locale puis CI : 30 tests réussis. Exécution https://github.com/Madec01/GPT/actions/runs/35220583330 terminée en succès pour Chrome, Firefox et Edge. Les trois navigateurs gagnent une mission par clics, contrôlent pause et sauvegarde, puis vérifient l'isolement du mode test et les gadgets. Aucune erreur JS ni ressource manquante sur ces parcours.
- Cadence indicative sur 60 images de la première galerie en CI : Chrome 59,9 fps ; Firefox 58,5 fps ; Edge 59,9 fps. Pas de généralisation à toutes les machines. Rapport complet et limites : docs/QA_FINAL.md.
- Contrôle des licences et fichiers : 33 assets, empreintes SHA-256 concordantes, huit binaires distants identiques aux fichiers locaux, fichier maximal 754 406 octets. Aucun CDN nécessaire au lancement du dossier téléchargé.
- GitHub Pages du dépôt actif : https://madec01.github.io/GPT/ chargé et inspecté dans Chrome. Le README inclut accès en ligne, lancement statique, commandes, reproduction des tests et crédits.
- Aucun défaut bloquant connu à l'issue de ces vérifications. Aucun test manuel sur machine Windows ou téléphone physique ; ces limites restent explicites dans le rapport. Pas de validation subjective par panel externe.

## Carnet de retour joueur — 2026-09-17
- Demande utilisateur : document web pour noter le jeu sur 10 et commenter, catégories choisies par l'assistant.
- Ajout de evaluation.html, css/evaluation.css et js/evaluation.js, dans la direction artistique existante et avec les polices de banque déjà créditées.
- Dix critères : plaisir, mécaniques, commandes, graphismes, fluidité, audio, clarté, équilibrage, histoire et rejouabilité. Notes 0–10 sans présélection, commentaires libres, priorité finale facultative, progression et moyenne des seuls critères notés.
- Brouillon local indépendant de la sauvegarde du jeu. Copie du rapport avec alternative manuelle et téléchargement texte pour transmission dans la conversation ; aucun envoi automatique ni collecte serveur.
- Vérification Chrome de la page publiée : saisie des notes extrêmes 0 et 10, moyenne exacte 5/10, commentaire conservé après rechargement, copie complète du bilan et retrait des notes réussis. Données d'essai effacées via le formulaire après contrôle. Syntaxe JavaScript validée par Node.

## Choix du nouveau jeu — 2026-09-17
- Direction, décision explicite de l'utilisateur : ABYSSE retenu, exploration sous-marine et récupération avec interactions physiques, sonar/lumière/bruit et progression narrative.
- Évaluation de MINUIT AU MUSÉE reçue : 2,3/10. Refonte demandée ; les validations techniques précédentes ne constituent pas une validation du plaisir ni de la direction artistique.
- COLOSSAL, RICOCHET et CONTRETEMPS conservés avec leurs histoires, mécaniques et risques dans CONCEPTS_DE_JEUX.md pour les futures sessions. La proposition de course reste refusée.
- Cette étape consigne la sélection ; aucun nouveau gameplay implémenté et aucune licence de nouveaux assets annoncée vérifiée.

## Reprise et transfert — 17 septembre 2026
- Travail ABYSSE retrouvé dans l’espace de travail précédent ; le dépôt distant contenait encore MINUIT AU MUSÉE et le choix du nouveau concept.
- Reprise des cinq secteurs, menus, modèles et musiques existants ; intégration des corrections de démarrage WebGL, qualité économique, mémoire du renderer et orientation des créatures.
- Vérification locale : 23 tests réussis, cinq secteurs terminés par le pilote simulé, 26 empreintes concordantes et neuf fichiers audio entièrement décodés.
- Transfert des fichiers par le connecteur GitHub ; conservation de l’historique distant, sans force-push. Rapport de vérification dans docs/ABYSSE_QA.md.
