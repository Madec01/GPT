# ABYSSE — vérification de reprise

17 septembre 2026.

## Résultats locaux

- `npm test` : 26 tests réussis, couvrant physique, transport, découpe, sonar, prédateurs, sauvegarde, mode test, menus, audio, dépendances des modèles et appuis clavier brefs.
- `node scripts/abysse/verify-campaign.mjs` : les cinq secteurs sont terminés par commandes de pilotage simulées, sans téléportation. Durées du pilote automatisé : 61, 113, 82, 160 et 176 secondes. Ce ne sont pas des durées de découverte pour un joueur.
- Empreintes SHA-256 des 17 modèles GLB et des 9 fichiers audio conformes aux manifestes.
- Décodage intégral FFmpeg des 9 fichiers audio réussi.

## Parcours navigateur

Le workflow `.github/workflows/abysse-qa.yml` vérifie Chrome, Firefox et Edge : chargement WebGL, ressources, menus, musique réellement en lecture, mouvement, pause, reprise, redémarrage, persistance et mode test.

Exécution [35237260280](https://github.com/Madec01/GPT/actions/runs/35237260280), commit `43a5a81b2b985a6e088a5ef449ff8b8c46fef5b1` : **succès sur Chrome, Firefox et Edge**.

Les trois navigateurs vérifient le chargement WebGL2, les crédits, les réglages, une musique effectivement en lecture, le pilotage clavier, la pause/reprise, le redémarrage, la persistance après rechargement, les cinq secteurs en mode test, le déplacement dans le dernier secteur, le phare et le sonar. Aucun échec JavaScript ni ressource manquante sur ces parcours. Les 26 tests et les cinq replays de campagne passent également sur chaque machine de CI.

Captures de l’accueil, de la première plongée et du secteur final inspectées. Les captures et traces complètes sont conservées dans les artefacts du workflow. Le navigateur cloud de contrôle ne crée pas de contexte WebGL ; les validations graphiques proviennent des vrais navigateurs de CI avec rendu logiciel.

Deux défauts corrigés lors de cette reprise : palette externe absente des modèles Watercraft et perte possible d’un appui bref sur Espace/E entre deux images. Tests de non-régression ajoutés. Les attentes asynchrones et l’environnement audio/graphique du banc de test ont aussi été corrigés.

Ces parcours ne constituent pas une victoire manuelle sur toute la campagne, ni une mesure de cadence sur ordinateur personnel.

## Limites

Jeu conçu pour ordinateur avec clavier et WebGL2. Pas de validation sur téléphone physique, pas de panel joueur et pas de promesse de cadence sur toutes les machines. Le plaisir, la variété et la qualité artistique restent à évaluer en jouant.
