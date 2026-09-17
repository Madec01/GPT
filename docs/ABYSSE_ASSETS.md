# ABYSSE — registre des ressources 3D

17 septembre 2026 — sous-agent assets.

## Choix artistique

Vrais modèles 3D de banques, silhouettes lisibles, avec volumes éclairés et profondeur. Sous-marin civil blanc avec hublots turquoise et hélice orange (Poly by Google), faune Quaternius animée, coraux et kelp distincts. Les modèles ne sont pas des icônes agrandies. Le rendu final dépend également de la lumière, du brouillard, de la mise en scène et des animations.

Aucun modèle généré par IA. Aucun remplacement par un personnage géométrique provisoire. Les fichiers GLB incluent géométrie et matériaux; pas de téléchargement distant requis en jeu.

## Inventaire et licences

| Fichier | Auteur | Licence | Source originale |
|---|---|---|---|
| `anglerfish.glb` | Quaternius | CC0-1.0 | [Anglerfish](https://quaternius.com/packs/cutefish.html) |
| `fish.glb` | Quaternius | CC0-1.0 | [Fish1](https://quaternius.com/packs/animatedfish.html) |
| `shark.glb` | Quaternius | CC0-1.0 | [Shark](https://quaternius.com/packs/animatedfish.html) |
| `manta.glb` | Quaternius | CC0-1.0 | [Manta_ray](https://quaternius.com/packs/animatedfish.html) |
| `whale.glb` | Quaternius | CC0-1.0 | [Whale](https://quaternius.com/packs/animatedfish.html) |
| `rock1.glb` | Quaternius | CC0-1.0 | [Rock_1](https://quaternius.com/packs/ultimatenature.html) |
| `rock2.glb` | Quaternius | CC0-1.0 | [Rock_4](https://quaternius.com/packs/ultimatenature.html) |
| `rock3.glb` | Quaternius | CC0-1.0 | [Rock_Moss_5](https://quaternius.com/packs/ultimatenature.html) |
| `plant.glb` | Quaternius | CC0-1.0 | [Plant_3](https://quaternius.com/packs/ultimatenature.html) |
| `grass.glb` | Quaternius | CC0-1.0 | [Grass](https://quaternius.com/packs/ultimatenature.html) |
| `wreck.glb` | Kenney | CC0-1.0 | [ship-cargo-a](https://kenney.nl/assets/watercraft-kit) |
| `container.glb` | Kenney | CC0-1.0 | [cargo-container-a](https://kenney.nl/assets/watercraft-kit) |
| `buoy.glb` | Kenney | CC0-1.0 | [buoy](https://kenney.nl/assets/watercraft-kit) |
| `submarine.glb` | Poly by Google | CC-BY 3.0 | [Submarine](https://poly.pizza/m/7-3Vgg6rR4j) |
| `coral1.glb` | Poly by Google | CC-BY 3.0 | [Coral](https://poly.pizza/m/4KUXdtDdgHR) |
| `coral2.glb` | Poly by Google | CC-BY 3.0 | [Coral](https://poly.pizza/m/80uVAty6wZ2) |
| `kelp.glb` | M Smith Jonn | CC-BY 3.0 | [kelp](https://poly.pizza/m/5ECC8rIOZJl) |

Les URLs exactes de téléchargement, noms d'origine, empreintes SHA256, tailles et animations sont dans `assets/abysse/models-manifest.json`. Les métadonnées Poly Pizza faisant foi pour la licence sont conservées dans `assets/abysse/licenses/*-source.json`. Notices : `assets/abysse/licenses/MODELS_LICENSES.md`.

## Intégration

- `submarine.glb` : Y vertical, avant +Z, hélice côté -Z. Centrer par Box3 puis normaliser la longueur avant rotation Y +π/2 pour avancer vers +X. Les coordonnées d'origine sont éloignées du centre : ne pas oublier ce centrage.
- `fish`, `shark`, `manta`, `whale` : avant +Z confirmé en calculant les positions mondiales des os tête/queue. Animation `Armature|Swim`. Cloner avec `SkeletonUtils.clone`, pas simplement `Object3D.clone`, pour conserver les squelettes indépendants.
- `anglerfish` : animations `Fish_Armature|Swimming_Normal`, `Swimming_Fast`, `Swimming_Impulse`, `Attack`, `Death`, `Out_Of_Water`. Préférer la nage normale. Orientation à confirmer à l'écran.
- `rock1/2/3` : différentes formes issues de Ultimate Nature. `plant/grass` servent de végétation secondaire; les véritables `kelp`, `coral1`, `coral2` assurent l'identité sous-marine.
- `wreck` : navire cargo Kenney, à incliner et enfoncer partiellement dans les rochers pour mise en scène d'épave. `container` pour caisses/outillage industriel; `buoy` pour balises.
- Aucune compression Draco ni extension requise, donc GLTFLoader seul suffit.

## Vérifications effectuées

17 GLB : en-tête `glTF` valide, JSON lisible, buffers internes, extensions obligatoires absentes. Sous-marin inspecté visuellement sur l'aperçu de la banque; deux autres variantes militaires évaluées puis écartées car moins adaptées au personnage civil et à la silhouette d'exploration.

## Décisions et difficultés

- 2026-09-17 : sous-marin civil Poly Google plutôt que modèle militaire; silhouette compacte et hublots donnent une identité compatible avec exploration/récupération.
- 2026-09-17 : GLB de miroirs publics pour Quaternius/Kenney; licences vérifiées sur les pages des auteurs, et non déduites de la licence logicielle des dépôts miroirs.
- 2026-09-17 : réseau curl initialement lent mais downloads aboutis; aucun recours à un asset sans preuve de licence.
- 2026-09-17 : modèle nbogie/submarine_june2024 repéré mais écarté faute de licence d'asset vérifiable.

## Audio

Traitement délégué au sous-agent audio. Voir `ABYSSE_AUDIO.md` pour pistes, bruitages, licences et vérifications.
