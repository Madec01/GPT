# FRONDE - Crédits des ressources graphiques, sonores et typographiques

Date : 8 octobre 2026, direction artistique 3 « Rondeval classique » intégrée en 0.6.1. Les fichiers concernés vivent dans `public/assets/`. Le fichier `public/assets/manifest.json` (version 2, bloc `credits`) contient les mêmes informations sous forme lisible par le jeu, pour l'écran Crédits.

## Règles appliquées

- Seules les licences CC0 1.0, CC BY 3.0, CC BY 4.0 et SIL OFL 1.1 sont acceptées.
- La licence de chaque ressource a été lue sur sa page d'origine ou dans le fichier de licence livré avec le pack (`LICENSE.txt`, `License.txt`, `OFL.txt`), pas seulement sur l'inventaire.
- Aucune ressource générée par IA, aucun dessin maison. Les modifications se limitent à des opérations mécaniques décrites plus bas : recadrage, réduction, agrandissement au voisin le plus proche, assemblage de pièces, mosaïque, teinte, contraste, rotation, seuillage, contour d'un pixel, encodage audio. L'ombre portée est un dégradé généré par script.
- Toutes les images sont rangées dans `public/assets/sprites/`, sous le nom de leur clé du manifeste (`char-hero.png`, `tile-floor-1.png`, `charm-grelot.png`...).
- `tests/assets.test.ts` vérifie que chaque fichier de `public/assets/` est cité dans `manifest.json`, que chaque fichier cité existe, que chaque licence est dans la liste autorisée et que le dossier pèse 15 Mo au plus, musique comprise.

## Attributions obligatoires (CC BY)

À afficher dans l'écran Crédits du jeu, mot pour mot.

| Ressource | Texte d'attribution exact |
|---|---|
| Three Sheets To The Wind, Scott Buckley | `'Three Sheets To The Wind' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au` |
| Into The Wilds, Scott Buckley | `'Into The Wilds' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au` |
| Juggernaut, Scott Buckley | `'Juggernaut' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au` |
| Icônes game-icons.net de Lorc (Hand, Rock, Crossed swords, Crowned skull, Uncertainty, Campfire) | `Icons made by Lorc. Available on https://game-icons.net` |
| Icônes game-icons.net de Delapouite (Coins, Ogre, Barrel, Spring) | `Icons made by Delapouite. Available on https://game-icons.net` |
| Icône game-icons.net de Skoll (Open treasure chest) | `Icons made by Skoll. Available on https://game-icons.net` |
| Icône game-icons.net de Caro Asercion (Porcupine) | `Icons made by Caro Asercion. Available on https://game-icons.net` |

Version groupée possible pour l'écran Crédits : `Icons made by Lorc, Delapouite, Skoll and Caro Asercion. Available on https://game-icons.net`. Licence des icônes : CC BY 3.0, https://creativecommons.org/licenses/by/3.0/.

Les pages de Scott Buckley précisent que la musique est libre dans tout projet, commercial compris, "as long as I'm credited". Pour des vidéos de promotion, le crédit doit figurer dans la description de la vidéo.

## Ressources CC0 (aucune attribution requise)

Mention de courtoisie suggérée : "Kenney (www.kenney.nl)" pour les packs Kenney, et, pour Dungeon Crawl, créditer les développeurs et artistes de Dungeon Crawl Stone Soup et la source (la `README.txt` de l'archive le demande « pour que d'autres puissent la trouver »). Licence : Creative Commons Zero 1.0 Universal, https://creativecommons.org/publicdomain/zero/1.0/.

### Dungeon Crawl 32x32 tiles (Dungeon Crawl Stone Soup)

Auteur : Chris Hamons (mainteneur de l'archive) et les artistes de Dungeon Crawl Stone Soup, qui ont cédé leurs droits sous CC0 1.0 (`LICENSE.txt` de l'archive). Page : https://opengameart.org/content/dungeon-crawl-32x32-tiles. Archive utilisée : `Dungeon Crawl Stone Soup Full_0.zip`, racine `Dungeon Crawl Stone Soup Full/`. Tous les sprites d'origine font 32 x 32 px, avec un contour noir et une ombre portée intégrée.

| Fichier produit | Fichier source | Modification |
|---|---|---|
| `sprites/char-hero.png` (Dodu, griffon adulte) | `monster/griffon.png` | Aucune. |
| `sprites/char-crapaud.png`, `char-crapaud-elite.png` | `monster/animals/giant_toad.png`, `spiny_frog.png` | Aucune. |
| `sprites/char-gelee.png`, `char-gelee-elite.png` | `monster/amorphous/azure_jelly_new.png`, `jelly.png` | Aucune. |
| `sprites/char-rocailleux.png`, `char-rocailleux-elite.png` | `monster/nonliving/stone_golem.png`, `iron_golem.png` | Aucune. |
| `sprites/char-boss.png`, `char-boss-elite.png` | `monster/troll.png`, `monster/iron_troll.png` | Aucune ; le manifeste les déclare à 16 px par unité pour les afficher environ deux fois plus grands. |
| `sprites/char-boulder.png` | `dungeon/boulder.png` | Aucune. |
| `sprites/char-chauve-souris.png` | `monster/animals/giant_bat.png` | Aucune. |
| `sprites/tile-floor-1.png` | `dungeon/floor/limestone_0.png`, `limestone_4.png`, `limestone_1.png`, `limestone_5.png` | Mosaïque de 2 x 2 tuiles (64 x 64 px), contraste 0,5, luminosité 0,75, saturation 0,55. |
| `sprites/tile-floor-2.png` | `dungeon/floor/grass/grass_0_new.png`, `grass_1_new.png`, `grass_2_new.png`, `grass_1_new.png` | Mosaïque de 2 x 2 tuiles, contraste 0,85, luminosité 1,5, saturation 0,65. |
| `sprites/tile-floor-3.png` | `dungeon/floor/floor_sand_rock_0.png` à `floor_sand_rock_3.png` | Mosaïque de 2 x 2 tuiles, contraste 0,65, luminosité 0,95, saturation 0,65. |
| `sprites/tile-wall-1.png` | `dungeon/wall/brick_gray_0.png` | Contraste 0,9, luminosité 0,85. |
| `sprites/tile-wall-2.png` | `dungeon/wall/wall_vines_2.png` | Contraste 0,95, luminosité 0,85, saturation 0,95. |
| `sprites/tile-wall-3.png` | `dungeon/wall/marble_wall_4.png` | Pixels roses de coin remplacés par un voisin proche, contraste 0,85, luminosité 0,9, saturation 0,8. |
| `sprites/prop-crate.png` | `dungeon/large_box.png` | Recadrée sur le contenu (32 x 22) puis étirée à 32 x 32 au voisin le plus proche, pour remplir sa case. |
| `sprites/prop-barricade.png` | `dungeon/doors/gate_closed_middle.png` | Aucune ; tuile de herse de bois, faite pour se répéter en largeur. |
| `sprites/prop-column.png`, `prop-column-cracked.png` | `dungeon/statues/crumbled_column_1.png` (intacte), `crumbled_column_3.png` (fissurée) | Aucune. |
| `sprites/prop-spring.png` (tremplin) | `item/armor/shields/large_shield_1_new.png` | Aucune ; bouclier bombé, à tourner selon la flèche. |
| `sprites/prop-torch.png` | `dungeon/wall/torches/torch_1.png` | Aucune. |
| `sprites/prop-pit.png` (gouffre) | `dungeon/traps/trap_shaft.png` | Forme du piège recadrée et étirée à 56 x 56 px au voisin le plus proche, puis liseré de pierre éclairé en diagonale, fond noir et contour noir ajoutés par script. |
| `sprites/prop-goal.png` (cible de poussée) | `dungeon/floor/sigil_circle.png` | Anneau d'or extrait par la couleur (fond retiré), agrandi à 64 x 64 px, épaissi d'un pixel, disque intérieur doré à 22 % d'opacité. |
| `sprites/prop-explosive.png` (tonneau de poudre) | Tonneau game-icons.net (Delapouite), flamme de `dungeon/wall/torches/torch_1.png` | Voir Assemblages ci-dessous. |
| `sprites/ui-plume.png` (monnaie) | `item/gold/gold_pile_5.png` | Aucune. |
| `sprites/charm-bille-de-verre.png` | `item/misc/misc_crystal_new.png` | Aucune. |
| `sprites/charm-plume-de-plomb.png` | `item/misc/misc_fan_inert.png` | Aucune. |
| `sprites/charm-grelot.png` | `item/amulet/stone_1_cyan.png` | Aucune. |
| `sprites/charm-corde-double.png` | `item/weapon/bullwhip_2.png` | Aucune. |
| `sprites/charm-ricochet-d-or.png` | `item/ring/gold.png` | Aucune. |
| `sprites/charm-mors-de-fer.png` | `item/ring/iron.png` | Aucune. |
| `sprites/charm-bouclier-de-plumes.png` | `item/armor/shields/shield_3.png` | Aucune. |
| `sprites/charm-aimant-a-plumes.png` | `item/amulet/cylinder_gray.png` | Aucune. |
| `sprites/charm-pierre-a-aiguiser.png` | `item/misc/misc_stone_inert.png` | Aucune. |
| `sprites/charm-tambour-de-guerre.png` | `item/misc/misc_quad.png` | Aucune. |
| `sprites/charm-lanterne.png` | `item/misc/misc_lamp_old.png` | Aucune. |

### Autres packs CC0

| Titre | Auteur | Lien | Fichiers utilisés | Modifications |
|---|---|---|---|---|
| Emotes Pack | Kenney | https://kenney.nl/assets/emotes-pack | `sprites/emote-aim.png` (`emote_circle`), `emote-flight.png` (`emote_exclamation`), `emote-impact.png` (`emote_alert`), `emote-happy.png` (`emote_faceHappy`), `emote-worried.png` (`emote_drop`), `emote-hit.png` (`emote_heartBroken`), `emote-stunned.png` (`emote_stars`) | Version pixel `PNG/Pixel/Style 1`, 16 px, doublée à 32 px au voisin le plus proche. |
| Egg Item Sprite | GoopyBus (OpenGameArt) | https://opengameart.org/content/egg-item-sprite | `sprites/char-egg.png`, `sprites/charm-oeuf-de-secours.png` | Contour sombre d'un pixel ajouté (même image pour l'œuf de l'arène et l'amulette). |
| Ninja Adventure Asset Pack | pixel-boy et AAA | https://pixel-boy.itch.io/ninja-adventure-asset-pack | `sprites/fx-debris-wood.png`, `sprites/fx-debris-stone.png` | Éclats de `FX/Particle/Wood.png` (images 1, 2, 3 et 6) et de `FX/Particle/RockGray.png` (images 1 à 4), recadrés et regroupés par trois ou quatre sur une image de 32 px. |
| Ombre portée | FRONDE | https://github.com/Madec01/GPT | `sprites/prop-shadow.png` | Disque noir flou de 64 px, opacité maximale 47 %, généré par script (aucun pack ne fournit d'ombre). |
| UI Pack - Adventure | Kenney | https://kenney.nl/assets/ui-pack-adventure | `sprites/ui-panel.png`, `ui-button.png`, `ui-button-pressed.png`, `ui-charge-on.png`, `ui-charge-off.png`, `fx-star.png` | Rendus depuis les sources SVG du pack en haute définition (panneau et bouton 4x, segments 8x, étoile 16x). `ui-button-pressed.png` est `button_brown` assombri : le pack n'a pas d'état enfoncé. Conservés tels quels de la version précédente, seulement déplacés dans `sprites/`. |
| Platformer Art Deluxe | Kenney | https://kenney.nl/assets/platformer-art-deluxe | `sprites/ui-heart-full.png`, `sprites/ui-heart-empty.png` | Aucune (53 x 45 px, `hud_heartFull` et `hud_heartEmpty`). Le cœur plein sert aussi de cœur de soin dans l'arène (clé `prop-heart`, même fichier). |
| Particle Pack | Kenney | https://kenney.nl/assets/particle-pack | `sprites/fx-spark.png`, `sprites/fx-glow.png` | `magic_03` teinté or et réduit à 256 px ; `circle_05` réduit à 256 px, resté blanc. Conservés tels quels. |
| Smoke Particles | Kenney | https://kenney.nl/assets/smoke-particles | `sprites/fx-smoke.png` | `whitePuff00` recadré en carré et réduit à 256 px, resté blanc. Conservé tel quel. |

### Sons

| Titre | Auteur | Lien | Fichiers utilisés |
|---|---|---|---|
| Impact Sounds | Kenney | https://kenney.nl/assets/impact-sounds | `audio/bounce-wall.mp3`, `bounce-enemy.mp3`, `impact-heavy.mp3`, `hero-hit.mp3`, `stun.mp3`, et en mélange `strong-throw.mp3` |
| Interface Sounds | Kenney | https://kenney.nl/assets/interface-sounds | `audio/throw.mp3`, `strong-throw.mp3` (mélange), `bumper.mp3`, `stick.mp3`, `spring.mp3`, `fall.mp3`, `heal.mp3`, `enemy-death.mp3`, `ui-tap.mp3`, `charge-up.mp3`, `note.mp3` |
| 75 CC0 breaking / falling / hit sfx | rubberduck (OpenGameArt) | https://opengameart.org/content/75-cc0-breaking-falling-hit-sfx | `audio/crate-break.mp3`, `barricade-break.mp3`, `column-break.mp3`, `crapaud-burst.mp3` |
| Music Jingles | Kenney | https://kenney.nl/assets/music-jingles | `audio/win.mp3` (`jingles_STEEL10`), `audio/lose.mp3` (`jingles_SAX01`) |

Correspondance clé du jeu, fichier source, fichier produit :

| Clé | Source | Fichier |
|---|---|---|
| `throw` | Interface `open_001` | `audio/throw.mp3` |
| `strongThrow` | Interface `open_003` mélangé à Impact `impactPunch_heavy_004` | `audio/strong-throw.mp3` |
| `bounceWall` | Impact `impactGeneric_light_002` | `audio/bounce-wall.mp3` |
| `bounceEnemy` | Impact `impactPunch_medium_000` | `audio/bounce-enemy.mp3` |
| `bumper` | Interface `maximize_008` | `audio/bumper.mp3` |
| `stick` | Interface `drop_003` | `audio/stick.mp3` |
| `impactHeavy` | Impact `impactPunch_heavy_002` | `audio/impact-heavy.mp3` |
| `crateBreak` | 75 sfx `bfh1_wood_breaking_04` | `audio/crate-break.mp3` |
| `barricadeBreak` | 75 sfx `bfh1_wood_breaking_03` | `audio/barricade-break.mp3` |
| `columnBreak` | 75 sfx `bfh1_rock_breaking_02` | `audio/column-break.mp3` |
| `spring` | Interface `maximize_005` | `audio/spring.mp3` |
| `fall` | Interface `minimize_005` | `audio/fall.mp3` |
| `heal` | Interface `confirmation_002` | `audio/heal.mp3` |
| `heroHit` | Impact `impactMetal_heavy_000` | `audio/hero-hit.mp3` |
| `enemyDeath` | Interface `question_002` | `audio/enemy-death.mp3` |
| `crapaudBurst` | 75 sfx `bfh1_hit_05` | `audio/crapaud-burst.mp3` |
| `stun` | Impact `impactBell_heavy_002` | `audio/stun.mp3` |
| `uiTap` | Interface `select_002` | `audio/ui-tap.mp3` |
| `win` | Music Jingles `jingles_STEEL10` | `audio/win.mp3` |
| `lose` | Music Jingles `jingles_SAX01` | `audio/lose.mp3` |
| `chargeUp` | Interface `maximize_001` | `audio/charge-up.mp3` |
| `note` | Interface `pluck_002` | `audio/note.mp3` |

Traitement commun des sons : décodage, mono, 44,1 kHz, silences de tête et de queue coupés (seuil -50 dB), niveau ramené vers -20 dB RMS avec un plafond de crête à -2 dB, encodage MP3 96 kbit/s (libmp3lame). Aucun autre effet.

### Musique, CC BY 4.0, Scott Buckley

Licence : Creative Commons Attribution 4.0 International, https://creativecommons.org/licenses/by/4.0/. Auteur : Scott Buckley, https://www.scottbuckley.com.au.

| Titre | Lien | Fichier | Rôle |
|---|---|---|---|
| Three Sheets To The Wind | https://www.scottbuckley.com.au/library/three-sheets-to-the-wind/ | `music/three-sheets-to-the-wind.mp3` | Thème principal (`explore`) |
| Into The Wilds | https://www.scottbuckley.com.au/library/into-the-wilds/ | `music/into-the-wilds.mp3` | Exploration (`wilds`) |
| Juggernaut | https://www.scottbuckley.com.au/library/juggernaut/ | `music/juggernaut.mp3` | Boss (`boss`) |

Modifications : réencodage MP3 128 kbit/s stéréo 44,1 kHz depuis les MP3 d'origine (320 kbit/s), silences de début et de fin coupés, métadonnées retirées. Les pistes ne sont pas bouclées : elles durent 199 s, 244 s et 220 s.

## Ressources CC BY 3.0 : icônes game-icons.net

Licence : Creative Commons Attribution 3.0, https://creativecommons.org/licenses/by/3.0/. La page About de game-icons.net propose : "Icons made by {author;}. Available on https://game-icons.net". Le dépôt `game-icons.net` livre des SVG blancs sur fond transparent (dossier `icons/ffffff/transparent/1x1/`).

| Icône | Auteur | Lien | Fichier | Usage |
|---|---|---|---|---|
| Hand | Lorc | https://game-icons.net/1x1/lorc/hand.html | `sprites/ui-icon-brake.png` | Icône du frein |
| Rock | Lorc | https://game-icons.net/1x1/lorc/rock.html | `sprites/ui-icon-power.png` | Icône du pouvoir Pierre |
| Crossed swords | Lorc | https://game-icons.net/1x1/lorc/crossed-swords.html | `sprites/ui-node-combat.png` | Nœud combat de la carte |
| Crowned skull | Lorc | https://game-icons.net/1x1/lorc/crowned-skull.html | `sprites/ui-node-elite.png` | Nœud élite |
| Uncertainty | Lorc | https://game-icons.net/1x1/lorc/uncertainty.html | `sprites/ui-node-event.png` | Nœud événement |
| Campfire | Lorc | https://game-icons.net/1x1/lorc/campfire.html | `sprites/ui-node-rest.png` | Nœud repos |
| Coins | Delapouite | https://game-icons.net/1x1/delapouite/coins.html | `sprites/ui-node-shop.png` | Nœud marchand |
| Ogre | Delapouite | https://game-icons.net/1x1/delapouite/ogre.html | `sprites/ui-node-boss.png` | Nœud boss |
| Open treasure chest | Skoll | https://game-icons.net/1x1/skoll/open-treasure-chest.html | `sprites/ui-node-treasure.png` | Nœud trésor |
| Barrel | Delapouite | https://game-icons.net/1x1/delapouite/barrel.html | `sprites/prop-explosive.png` | Tonneau de poudre (assemblé) |
| Spring | Delapouite | https://game-icons.net/1x1/delapouite/spring.html | `sprites/prop-ressort.png` | Ressort (assemblé) |
| Porcupine | Caro Asercion | https://game-icons.net/1x1/caro-asercion/porcupine.html | `sprites/char-herisson.png` | Hérisson (assemblé) |

Modifications : les sept icônes de nœuds sont rendues telles quelles en PNG blanc sur transparent de 64 px, à teinter dans le jeu (le blanc se teinte sans perte). Les icônes du frein et du pouvoir sont les rendus de 256 px de la version précédente, fond noir du SVG retiré. Les trois icônes assemblées sont décrites ci-dessous.

## Assemblages mécaniques

- **Tonneau de poudre** (`prop-explosive.png`) : le tonneau de Delapouite, rendu à 512 px, comblé de ses interstices, réduit à 28 x 22 px, seuillé (alpha dur), coloré en rouge (170, 44, 32) avec dégradé du haut clair au bas sombre, interstices assombris, contour noir d'un pixel ; la flamme (pixels orange et jaune de la moitié haute) du flambeau `torch_1.png` de Dungeon Crawl posée sur le dessus comme mèche allumée.
- **Ressort** (`prop-ressort.png`) : le ressort oblique de Delapouite, redressé à la verticale par la rotation qui maximise sa hauteur, réduit à 14 x 30 px, seuillé, coloré en bleu (70, 150, 255) avec dégradé et contour noir, sur une image de 16 x 32 px. Le CHANGELOG 0.5.1 décrit déjà le ressort comme teinté en bleu.
- **Hérisson** (`char-herisson.png`) : le porc-épic de Caro Asercion (silhouette pleine à piquants, plus lisible à 32 px que l'icône « hedgehog » du même auteur, qui n'est qu'un trait), réduit à 30 x 28 px, seuillé, coloré brun (150, 106, 72), dégradé, contour noir, retourné pour regarder à gauche comme les monstres du pack.
- **Gouffre, cible, ombre, œuf** : voir le tableau Dungeon Crawl, le tableau des autres packs CC0 et le détail ci-dessus.
- **Mosaïques de sol** : quatre variantes d'une même famille de sol assemblées en 64 x 64 px pour casser la répétition. Le raccord d'une tuile avec elle-même reste propre parce que les variantes d'une famille Dungeon Crawl sont dessinées pour se côtoyer.

## Polices, SIL Open Font License 1.1

Licence : SIL OPEN FONT LICENSE Version 1.1, 26 février 2007, http://scripts.sil.org/OFL. Pas d'attribution à l'écran requise, mais les fichiers `OFL.txt` sont conservés à côté des polices. Source : API Google Fonts (`fonts.gstatic.com`, familles `cinzel` et `alegreya`). Polices non modifiées, polices variables (axe de graisse de 400 à 900), accents français complets vérifiés avec fontTools.

| Police | Auteur et copyright | Fichiers |
|---|---|---|
| Cinzel (titres) | Copyright 2020 The Cinzel Project Authors (https://github.com/NDISCOVER/Cinzel) | `fonts/cinzel/cinzel-variable.ttf`, `fonts/cinzel/OFL.txt` |
| Alegreya (texte) | Copyright 2011 The Alegreya Project Authors (https://github.com/huertatipografica/Alegreya) | `fonts/alegreya/alegreya-variable.ttf`, `fonts/alegreya/OFL.txt` |

Note : Alegreya affiche des chiffres elzéviriens (de hauteurs inégales) par défaut ; pour les nombres du HUD, préférer Cinzel, dont les chiffres sont alignés.

## Retirés dans la 0.6.1

Les ressources de la direction précédente, vectorielle Kenney, ont été supprimées de `public/assets/` : Shape Characters (Dodu), Monster Builder Pack (ennemis, œuf, boulet), Sokoban Pack (décor), Scribble Dungeons (tremplin, débris), Lilita One et Nunito (polices). Seuls l'interface, les effets, les sons et la musique de la version précédente sont conservés, sans changement.

## Packs téléchargés mais non retenus

- Fantasy UI Borders (Kenney, CC0) : cadres blancs décoratifs, option pour un cadre ornemental plus tard. Aucun fichier dans `public/assets/`.
- Kenney Tiny Dungeon, Tiny Town, Roguelike Characters et Roguelike RPG Pack, 0x72 DungeonTileset II, Tiny Creatures (CC0) : directions 1 et 2, écartées. Détail dans `docs/ART_DIRECTION.md`.
- Pixel Frog Tiny Swords, Anokolisa Pixel Crawler, Kenmi Cute Fantasy RPG, Shikashi Fantasy Icons, Wesnoth Frankenpack : licences incompatibles, voir `docs/ART_DIRECTION.md`.
