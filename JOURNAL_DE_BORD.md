# JOURNAL DE BORD — Dernier Courrier
## Vision
Rouvrez les liaisons d'une vallée à bord de petits trains postaux.
Orientez les aiguillages, retenez les convois et livrez les lettres dans le bon ordre.
Chaque tournée rapproche les habitants d'une fête qu'ils croyaient annulée.

Public : joueurs de puzzles accessibles, sessions courtes, desktop souris ou clavier.
Sensation : plaisir de mettre un petit monde en mouvement, anticipation puis soulagement.
Objectif qualité : campagne finie et vérifiable, aucun résultat de test supposé acquis.

## GDD
Alma reprend la ligne postale de son père Émile. Rose la boulangère, Basile le meunier et Inès l'institutrice échangent des lettres pour organiser la fête des Lumières.
Douze tournées éditées forment trois actes ; les textes complets et niveaux seront dans js/levels.js.
Boucle : lire → préparer → lancer → aiguiller et réguler → livrer → ouvrir la lettre.
Trois mécaniques : choix de branche, signaux stop/go, itinéraires de livraison ordonnés.
Le temps ne provoque jamais une défaite. Les collisions, une visite trop précoce à une étape future ou un retour avant livraison imposent de recommencer la tournée.
Aucune monnaie ni achat. Réussir déverrouille la suite ; étoiles et records encouragent le rejeu.
Sauvegarde locale versionnée, sans serveur. Une panne de stockage ne doit pas empêcher de jouer.

## Direction artistique et audio
Palette papier crème, vert sapin, terre cuite et jaune miel.
Carte illustrée, interface éditoriale postale, sprites exclusivement issus de banques.
Liste des sources et licences : assets/manifest.json et CREDITS.md, à compléter après acquisition vérifiée.
Musique enregistrée et bruitages de banque ; aucun oscillateur. Les assets doivent être locaux à la livraison.

## Architecture
HTML/CSS et modules JavaScript natifs, sans compilation ni dépendance distante au lancement.
Simulation déterministe séparée du rendu Canvas 2D ; UI HTML accessible ; sauvegarde localStorage.
La simplicité du graphe dirigé justifie un moteur spécialisé plutôt qu'un moteur généraliste.
Arborescence prévue : index.html ; css/style.css ; js/{app,engine,renderer,audio,storage,levels}.js ; assets/ ; tests/ ; docs/ ; README.md ; CREDITS.md.
Serveur statique : python -m http.server 8000.

## Registre des décisions
| Date | Décision | Alternatives | Raison |
|---|---|---|---|
| 2026-09-17 | Puzzle ferroviaire narratif | Action, roguelite, match-3 | Originalité par rapport aux projets antérieurs, interactions lisibles, niveaux courts. |
| 2026-09-17 | 12 niveaux édités | Procédural | Validation exhaustive et apprentissage contrôlé. |
| 2026-09-17 | Pas de chronomètre éliminatoire | Contre-la-montre | Permettre réflexion et pause sans punition ; records facultatifs. |
| 2026-09-17 | Modules natifs + Canvas | Phaser/Pixi | Pas de dépendance de distribution et simulation testable sans navigateur. |
| 2026-09-17 | Intégration GitHub via plugin | Clone direct | Dépôt vide ; plugin confirmé en lecture et écriture, réseau shell limité. |

## Journal des modifications
- 2026-09-17 — Direction : dépôt contrôlé, vide, branche par défaut main, accès écriture confirmé. Conception retenue et rôles délégués.
- 2026-09-17 — Agent design : proposition narrative et progression en trois actes ; production des données de campagne et solutions confiée.
- 2026-09-17 — Agent moteur : simulation déterministe et tests unitaires confiés, contrat partagé.
- 2026-09-17 — Agent assets/audio : recherche de banques et acquisition avec preuve de licence confiées.
- 2026-09-17 — Direction : journal initial créé. Vérifications : métadonnées du dépôt ; environnement Node 24 / Python 3.12 disponible. À faire : boucle jouable, ressources, campagne, QA, livraison.

## Problèmes rencontrés et solutions
- Réseau direct restreint : utiliser les connecteurs autorisés pour lire et publier les ressources. Ne pas supposer les téléchargements réussis.
- Aucune ressource préexistante dans le dépôt : création complète autorisée par l'utilisateur.

## Idées écartées
- Construction libre des rails : rend les parcours plus difficiles à vérifier sans renforcer l'aiguillage.
- Carburant, argent, améliorations : détourneraient l'attention des interactions entre trains.
- Génération musicale par oscillateurs : exclue par la demande.
- Dépendances CDN au lancement : compromettent le fonctionnement hors connexion après téléchargement.
