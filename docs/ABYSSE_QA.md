# ABYSSE — vérification de reprise

17 septembre 2026.

## Résultats locaux

- `npm test` : 23 tests réussis, couvrant physique, transport, découpe, sonar, prédateurs, sauvegarde, mode test, menus et audio.
- `node scripts/abysse/verify-campaign.mjs` : les cinq secteurs sont terminés par commandes de pilotage simulées, sans téléportation. Durées du pilote automatisé : 61, 113, 82, 160 et 176 secondes. Ce ne sont pas des durées de découverte pour un joueur.
- Empreintes SHA-256 des 17 modèles GLB et des 9 fichiers audio conformes aux manifestes.
- Décodage intégral FFmpeg des 9 fichiers audio réussi.

## Parcours navigateur

Le workflow `.github/workflows/abysse-qa.yml` vérifie Chrome, Firefox et Edge : chargement WebGL, ressources, menus, musique réellement en lecture, mouvement, pause, reprise, redémarrage, persistance et mode test.

Les résultats navigateur seront consignés après exécution sur la version publiée. Le succès des tests locaux ne constitue pas une validation visuelle ni une mesure de fluidité.

## Limites

Jeu conçu pour ordinateur avec clavier et WebGL2. Pas de validation sur téléphone physique, pas de panel joueur et pas de promesse de cadence sur toutes les machines. Le plaisir, la variété et la qualité artistique restent à évaluer en jouant.
