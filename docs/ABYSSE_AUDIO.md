# ABYSSE — direction et provenance audio

Livraison du sous-agent audio, 17 septembre 2026. Tous les fichiers livrés sont dans `assets/abysse/audio/`, avec un manifeste comportant taille, durée et SHA-256. Aucun son n'est synthétisé à l'exécution.

## Direction

Une musique mélodique continue accompagne les plongées : piano, cordes et textures cinématiques. Les bruitages mécaniques doivent rester plus courts et moins forts que cette musique. La profondeur n'est pas représentée par un bourdon seul. Deux compositions distinctes permettent une alternance entre découverte et tension. Les fichiers sont des œuvres enregistrées distribuées par une banque musicale ; aucune composition par oscillateurs n'est utilisée.

| Fichier | Œuvre / source | Utilisation proposée | Licence |
| --- | --- | --- | --- |
| undertow.ogg | Undertow — Scott Buckley | Accueil et exploration, 249,93 s | CC BY 4.0 |
| the-long-dark.ogg | The Long Dark — Scott Buckley | Profondeur et révélations, montage 285 s | CC BY 4.0 |
| engine.ogg | spaceEngineLow_002 — Kenney Sci-Fi Sounds | Propulsion, boucle à faible volume | CC0 |
| sonar.ogg | forceField_000 — Kenney Sci-Fi Sounds | Impulsion de scanner | CC0 |
| impact.ogg | impactMetal_000 — Kenney Sci-Fi Sounds | Collision de coque | CC0 |
| water.ogg | slime_001 — Kenney Sci-Fi Sounds | Bouillonnement / organismes | CC0 |
| cut.ogg | laserLarge_000 — Kenney Sci-Fi Sounds | Découpe | CC0 |
| dock.ogg | doorClose_001 — Kenney Sci-Fi Sounds | Verrouillage du sas | CC0 |
| grapple.ogg | weapon_change — Kenney Starter Kit FPS | Attache du treuil | CC0 |

Les effets Kenney sont des fichiers sonores de banque (certains conçus électroniquement), pas des enregistrements naturalistes de sous-marin. Leur usage narratif constitue une adaptation sonore. Le sonar est une impulsion de scanner de science-fiction.

## Vérification des licences et crédits à afficher

Les pages officielles de [Undertow](https://www.scottbuckley.com.au/library/undertow/) et [The Long Dark](https://www.scottbuckley.com.au/library/the-long-dark/) indiquent explicitement CC BY 4.0 et la possibilité d'utilisation commerciale sous attribution. [Licence CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Crédit à inclure dans le jeu et dans les crédits du dépôt :

> « Undertow » et « The Long Dark » — Scott Buckley, sous licence CC BY 4.0. www.scottbuckley.com.au. Transcodage OGG ; The Long Dark utilisé en montage bouclé de 285 secondes.

Undertow a été acquis directement depuis le lien MP3 officiel puis transcodé avec FFmpeg en Vorbis qualité 5, durée complète conservée. The Long Dark vient du [miroir documenté](https://github.com/nighomni123/Clock-app-productivity-v3/blob/main/public/themes/audio/README.md), qui décrit le réencodage et le fondu de bouclage. Le MP3 original a retourné une erreur HTTP 502 ; le miroir a été décodé et validé. La licence est vérifiée chez l'auteur, et non déduite de celle du dépôt miroir.

La page officielle [Kenney Sci-Fi Sounds](https://kenney.nl/assets/sci-fi-sounds) et le fichier `KENNEY_LICENSE.txt` inclus dans l'archive confirment CC0. Les effets n'ont subi qu'un renommage. Le [README officiel Starter Kit FPS](https://github.com/KenneyNL/Starter-Kit-FPS) confirme explicitement que les sons inclus sont CC0. Crédits : Kenney — Sci-Fi Sounds et Starter Kit FPS, CC0.

Archive officielle Sci-Fi Sounds utilisée : https://kenney.nl/media/pages/assets/sci-fi-sounds/6b296f9ecf-1677589334/kenney_sci-fi-sounds.zip

## Intégration et validation

- Démarrer l'audio après un geste utilisateur et gérer le rejet éventuel de `play()`.
- Ne pas relancer la musique à chaque événement ni à chaque retour de pause.
- Prévoir des réglages séparés musique / effets, conservés localement.
- Viser musique audible par défaut, moteurs discrets ; transitions par fondu sans multiplication des lecteurs.
- Les neuf fichiers OGG ont été intégralement décodés par FFmpeg sans erreur ; les durées sont consignées dans le manifeste.
- L'équilibre perceptif et la bonne lecture dans les navigateurs doivent être évalués dans l'intégration finale. La validité du codec ne certifie pas le mixage.
