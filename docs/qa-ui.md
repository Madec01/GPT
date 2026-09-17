# Revue indépendante interface, sauvegarde et audio

Date : 17 septembre 2026. Agent moteur, en revue transversale.

## Correctifs

- Options conserve les nœuds DOM réels et leurs gestionnaires. Revenir depuis Options restaure le briefing, la pause ou le résultat d'origine, sans démarrer une mission encore en préparation et sans reprendre une mission que le joueur avait mise en pause.
- Options ouverte pendant une partie active revient normalement au jeu. Changer le mode test annule la tentative courante et revient à la sélection ; aucune validation de campagne n'est effectuée.
- Les valeurs sauvegardées sont validées : booléens réels, volumes finis bornés, identifiants de mission entiers canoniques, étoiles entières entre 1 et 3. Un fichier local corrompu ne peut plus provoquer une erreur de construction des étoiles.
- Les rejets de lecture audio et les exceptions synchrones sont absorbés sans callback non géré. Les effets sont bornés à douze voix ; masquer l'onglet les arrête. Les réglages de volume s'appliquent également aux effets déjà démarrés.
- Le message d'échec de chargement reste visible dans l'interface, sans émission explicite d'une erreur console par le callback.

## Vérifications

20 tests réussis : 12 moteur et 8 interface/stockage/audio. Commande : `node --test tests/ui-state.test.mjs js/engine.test.mjs`.

Les tests interface exécutent le code réel d'app.js dans une VM Node avec un petit double de DOM et des doublures audio. Ils vérifient les transitions et l'identité des boutons conservés. Ce n'est pas un rendu de navigateur et cela ne remplace pas les parcours Chromium réalisés séparément par la direction.

Lecture statique du renderer : les cônes utilisent les mêmes rayons 125/170 et demi-angle 32,5° que le moteur. Recommandation transmise d'utiliser les constantes exportées pour éviter une divergence future. Aucun changement effectué dans renderer.js pendant cette revue.
