# Vérification interface, sauvegarde et audio ABYSSE

17 septembre 2026 — sous-agent moteur, deuxième mission : revue indépendante de `app.js`, `storage.js`, `audio.js` et de leur intégration au moteur.

## Corrections

- **Blocage de fin supprimé.** Ouvrir les crédits depuis l’épilogue puis revenir masquait toute la modale tout en conservant une plongée terminée et en pause. Les crédits réaffichent maintenant l’épilogue et son bouton d’accueil.
- **Mode test capturé à la mise à l’eau.** `recordDive` accepte explicitement le mode de la plongée : activer/désactiver l’option depuis la pause ne transforme pas rétroactivement les records. L’application n’a plus à modifier temporairement l’option globale.
- **Sauvegardes endommagées.** Les records de format incorrect et les fins inconnues sont ignorés au chargement. En cas d’accès au stockage refusé, la progression reste en mémoire de session et l’écriture signale son échec.
- **Entrées transitoires nettoyées.** Un clic d’instrument en attente et l’apparence active du découpeur sont effacés lors d’une pause ou d’un changement d’écran.
- **Volume immédiat.** Le réglage bruitages agit aussi sur les échantillons déjà en cours de lecture.

## Complément sonore demandé par la direction

`Soundscape.motion(speed, cutting, dt)` lit un véritable échantillon moteur en boucle, avec volume et vitesse de lecture liés au déplacement. Arrêt à l’immobilité, pendant la pause et sur les menus/résultats. Le découpeur joue son échantillon à intervalles de 0,5 s uniquement pendant une découpe effective à proximité d’une charge verrouillée. Les fichiers proviennent du manifeste audio, aucun oscillateur n’est employé.

## Tests

`node --test tests/abysse-ui.test.mjs` : neuf tests passent.

1. Pause → options → pause → reprise : même plongée, reprise possible.
2. Plongée test puis option désactivée : aucun record enregistré.
3. Plongée normale puis option test activée : record normal conservé, option future intacte.
4. Rejouer après défaite : nouvelle simulation, état terminal et modale effacés.
5. Épilogue → crédits → retour : épilogue restauré.
6. Choix de fin en mode test : fin persistante inchangée.
7. Nettoyage des sauvegardes malformées.
8. Stockage refusé : progression de session et résultat d’écriture cohérents.
9. Musiques, moteur, découpe, mute immédiat et suspension des voix.

Les tests d’interface exécutent le vrai code de l’application avec un DOM minimal simulé ; ils ne remplacent pas la vérification graphique et les interactions dans un navigateur réel. Les 14 tests de simulation et les cinq parcours de campagne restent passants après ces modifications.
