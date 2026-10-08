# FRONDE - Crédits des ressources graphiques, sonores et typographiques

Date : 8 octobre 2026. Les fichiers concernés vivent dans `public/assets/`. Le fichier `public/assets/manifest.json` (bloc `credits`) contient les mêmes informations sous forme lisible par le jeu, pour l'écran Crédits.

## Règles appliquées

- Seules les licences CC0 1.0, CC BY 3.0, CC BY 4.0 et SIL OFL 1.1 sont acceptées.
- La licence de chaque ressource a été lue sur sa page d'origine ou dans le fichier de licence livré avec le pack (`License.txt`, `license.txt`, `OFL.txt`), pas seulement sur l'inventaire.
- Aucune ressource générée par IA, aucun dessin maison. Les modifications se limitent à des opérations mécaniques décrites plus bas : recadrage, réduction, assemblage de pièces d'un même pack, teinte, rotation, encodage audio.
- `tests/assets.test.ts` vérifie que chaque fichier de `public/assets/` est cité dans `manifest.json` et que chaque licence est dans la liste autorisée.

## Attributions obligatoires (CC BY)

À afficher dans l'écran Crédits du jeu, mot pour mot.

| Ressource | Texte d'attribution exact |
|---|---|
| Three Sheets To The Wind, Scott Buckley | `'Three Sheets To The Wind' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au` |
| Into The Wilds, Scott Buckley | `'Into The Wilds' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au` |
| Juggernaut, Scott Buckley | `'Juggernaut' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au` |
| Icônes "Hand" et "Rock", game-icons.net | `Icons made by Lorc. Available on https://game-icons.net` (licence CC BY 3.0, https://creativecommons.org/licenses/by/3.0/) |

Les pages de Scott Buckley précisent que la musique est libre dans tout projet, commercial compris, "as long as I'm credited". Pour des vidéos de promotion, le crédit doit figurer dans la description de la vidéo.

## Ressources CC0 (aucune attribution requise)

Mention de courtoisie suggérée par les packs Kenney : "Kenney (www.kenney.nl)". Licence : Creative Commons Zero 1.0 Universal, https://creativecommons.org/publicdomain/zero/1.0/.

### Personnages, décor, interface, effets

| Titre | Auteur | Lien | Fichiers utilisés | Modifications |
|---|---|---|---|---|
| Shape Characters | Kenney | https://kenney.nl/assets/shape-characters | `sprites/dodu-body.png`, `sprites/dodu-eyes-{neutral,aim,flight,impact,happy,worried,hit}.png`, `sprites/dodu-mouth-{smile,smirk,teeth,frown}.png` | Corps jaune `yellow_body_circle` réduit de 160 à 128 px. Yeux (avec sourcils) et bouches découpés dans les visages `face_a`, `face_c`, `face_e`, `face_f`, `face_g`, `face_i`, `face_j`, `face_k`, `face_l` (version 2x), réduits à 80 % et recentrés sur l'axe des yeux. |
| Monster Builder Pack | Kenney | https://kenney.nl/assets/monster-builder-pack | `sprites/crapaud-*.png`, `sprites/gelee-*.png`, `sprites/rocailleux-*.png`, `sprites/boss-*.png`, `props/egg.png`, `props/boulder.png` | Corps `body_greenB` (crapaud), `body_blueD` (gelée), `body_whiteB` (rocailleux, teinté gris pierre ; boulet, teinté gris ardoise, sans visage), `body_darkB` (boss), `body_whiteC` (œuf, couleurs d'origine). Chaque paire d'yeux est faite de deux copies (l'une retournée pour les yeux furieux) du même oeil du pack, plus deux sourcils pour le rocailleux. Bouches du pack, réduites. |
| Scribble Dungeons | Kenney | https://kenney.nl/assets/scribble-dungeons | `props/floor.png`, `props/wall.png`, `props/crate.png`, `props/barricade.png`, `props/column.png`, `props/pit.png`, `props/spring.png`, `fx/debris-wood.png`, `fx/debris-stone.png` | Version 128 px. Sol (`tile`) aplati sur fond blanc pour qu'il se répète sans couture transparente. Mur (`wall`) recadré en bande. Barricade = `barrels_stacked` recadré. Colonne = `wall_damaged` tourné de 90 degrés. Gouffre = `puddle` teinté bleu nuit. Tremplin = `floor_arrow_head`. Débris de bois = `planks`. Débris de pierre = les trois pierres libres de `wall_demolished`, sans les deux poteaux. |
| Sokoban Pack (jeu de rechange) | Kenney | https://kenney.nl/assets/sokoban | `props-alt/floor-grass.png`, `floor-stone.png`, `wall.png`, `crate.png`, `barricade.png`, `column.png`, `goal.png`, `pit.png` | Aucune, version Retina 128 px. Décor de remplacement au cas où le trait de Scribble Dungeons ne marierait pas avec les formes plates ; non utilisé par `props` du manifeste. |
| UI Pack - Adventure | Kenney | https://kenney.nl/assets/ui-pack-adventure | `ui/panel.png`, `ui/button.png`, `ui/button-pressed.png`, `ui/charge-on.png`, `ui/charge-off.png`, `fx/star.png` | Rendus depuis les sources SVG du pack en haute définition (panneau et bouton 4x, segments 8x, étoile 16x). `button-pressed.png` est `button_brown` assombri : le pack n'a pas d'état enfoncé. |
| Platformer Art Deluxe | Kenney | https://kenney.nl/assets/platformer-art-deluxe | `ui/heart-full.png`, `ui/heart-empty.png` | Aucune (53 x 45 px, taille d'origine, `hud_heartFull` et `hud_heartEmpty`). Sert aussi de cœur de soin dans l'arène. |
| Particle Pack | Kenney | https://kenney.nl/assets/particle-pack | `props/goal.png`, `fx/spark.png`, `fx/glow.png` | `magic_03` (marque de cible) teinté or et réduit à 256 px ; `star_07` (étincelle) et `circle_05` (lueur) réduits de 512 à 256 px, restés blancs. |
| Smoke Particles | Kenney | https://kenney.nl/assets/smoke-particles | `fx/smoke.png` | `whitePuff00` recadré en carré et réduit à 256 px, resté blanc. |

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

## Ressources CC BY

### Musique, CC BY 4.0, Scott Buckley

Licence : Creative Commons Attribution 4.0 International, https://creativecommons.org/licenses/by/4.0/. Auteur : Scott Buckley, https://www.scottbuckley.com.au.

| Titre | Lien | Fichier | Rôle |
|---|---|---|---|
| Three Sheets To The Wind | https://www.scottbuckley.com.au/library/three-sheets-to-the-wind/ | `music/three-sheets-to-the-wind.mp3` | Thème principal (`explore`) |
| Into The Wilds | https://www.scottbuckley.com.au/library/into-the-wilds/ | `music/into-the-wilds.mp3` | Exploration (`wilds`) |
| Juggernaut | https://www.scottbuckley.com.au/library/juggernaut/ | `music/juggernaut.mp3` | Boss (`boss`) |

Modifications : réencodage MP3 128 kbit/s stéréo 44,1 kHz depuis les MP3 d'origine (320 kbit/s), silences de début et de fin coupés, métadonnées retirées. Les pistes ne sont pas bouclées : elles durent 199 s, 244 s et 220 s.

### Icônes, CC BY 3.0, game-icons.net

Licence : Creative Commons Attribution 3.0, https://creativecommons.org/licenses/by/3.0/. La page About de game-icons.net propose : "Icons made by {author;}. Available on https://game-icons.net".

| Icône | Auteur | Lien | Fichier | Usage |
|---|---|---|---|---|
| Hand | Lorc | https://game-icons.net/1x1/lorc/hand.html | `ui/icon-brake.png` | Icône du frein |
| Rock | Lorc | https://game-icons.net/1x1/lorc/rock.html | `ui/icon-power.png` | Icône du pouvoir Pierre |

Modifications : fond noir du SVG retiré, tracé blanc rendu en PNG transparent de 256 px. Pour les colorer, teinter le sprite (le blanc se teinte sans perte).

## Polices, SIL Open Font License 1.1

Licence : SIL OPEN FONT LICENSE Version 1.1, 26 février 2007, http://scripts.sil.org/OFL. Pas d'attribution à l'écran requise, mais les fichiers `OFL.txt` sont conservés à côté des polices. Sources : dépôt `google/fonts` sur GitHub (`ofl/lilitaone` et `ofl/nunito`). Polices non modifiées.

| Police | Auteur et copyright | Fichiers |
|---|---|---|
| Lilita One (titres) | Copyright (c) 2011 Juan Montoreano (juan@remolacha.biz), with Reserved Font Name Lilita | `fonts/lilitaone/lilitaone-regular.ttf`, `fonts/lilitaone/OFL.txt` |
| Nunito (texte, variable, graisses 200 à 1000) | Copyright 2014 The Nunito Project Authors (https://github.com/googlefonts/nunito) | `fonts/nunito/nunito-variable.ttf`, `fonts/nunito/OFL.txt` |

## Packs téléchargés mais non retenus

- Fantasy UI Borders (Kenney, CC0) : cadres blancs décoratifs, redondants avec UI Pack - Adventure pour la tranche verticale. Aucun fichier dans `public/assets/`.
- Emotes Pack, Board Game Icons (Kenney, CC0) : examinés pour trouver un cœur, écartés au profit de Platformer Art Deluxe. Aucun fichier dans `public/assets/`.
