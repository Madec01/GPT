# FRONDE - Inventaire des ressources graphiques et sonores libres de droits

Date : 8 octobre 2026
Auteur : sous-agent Assets, pour le Lead Architect

**Décision du propriétaire, 8 octobre 2026 : ensemble A retenu, direction vectorielle Kenney.** L'ensemble B est conservé pour mémoire. Le mariage visuel entre Scribble Dungeons et les formes plates reste à confirmer sur previews en phase 3.

## Rappel des règles de licence

- Sources autorisées uniquement : kenney.nl, opengameart.org, itch.io (CC0 ou CC BY), freesound.org (CC0 ou CC BY), incompetech.com (CC BY), scottbuckley.com.au (CC BY), fonts.google.com (OFL).
- Licences acceptées : CC0 1.0, CC BY 3.0 ou 4.0, OFL 1.1. Refusées : CC BY-NC, CC BY-SA, CC BY-ND, GPL, "free for personal use", Apache 2.0 pour les polices, et toute licence ambiguë ou contradictoire sur la page.
- Chaque ressource des tableaux a sa page ouverte avec WebFetch, et la mention de licence est recopiée entre guillemets telle que la page l'affiche. Si la licence n'est pas lisible noir sur blanc, la ressource est "NON VÉRIFIÉ" et n'est pas recommandée. Aucun fichier n'a été téléchargé.

## Méthode et limites (à lire)

- Les résultats de recherche web n'ont servi qu'à trouver des pages candidates. Seules les pages ouvertes comptent comme preuve.
- WebFetch ne renvoie que du texte : je n'ai vu aucune image. Les jugements de style reposent sur les tags et descriptions des pages, et doivent être confirmés visuellement (prévisualisation du ZIP) avant tout engagement de direction artistique.
- Les pages kenney.nl n'indiquent ni les formats de fichiers ni la taille des sprites (sauf quelques tailles de tuiles). Quand le miroir itch.io ou OpenGameArt du même pack donne l'information, je l'ai ajouté et je cite la page. Sinon je note "non indiqué sur la page".
- Les pages "specimen" de fonts.google.com sont rendues en JavaScript et WebFetch n'y lit que le titre. Pour les polices, la licence est lue dans le fichier OFL.txt du manifeste `https://fonts.google.com/download/list?family=...` (page du site fonts.google.com, aucun fichier de police téléchargé). C'est un contournement : à signaler au Lead.
- Les pages de pistes de incompetech.com sont rendues en JavaScript ("Loading track... No Track selected") : les pistes de Kevin MacLeod restent donc NON VÉRIFIÉ au niveau de la piste.
- La couverture des accents français (é, è, ç, œ) des polices n'est pas lisible sur les pages : à tester dans PixiJS.

---

## 1. Héros candidats (créature ronde et expressive)

| Ressource | Auteur | Lien | Licence recopiée de la page | Format et contenu | Adéquation | Vérifié |
|---|---|---|---|---|---|---|
| Shape Characters | Kenney (pas de champ auteur distinct sur kenney.nl) | https://kenney.nl/assets/shape-characters et https://kenney-assets.itch.io/shape-characters | kenney.nl : "Creative Commons CC0". itch.io : "CC0 1.0 Universal" ; "There's no need to ask permission before using these and giving attribution is not required (but is appreciated!)" | itch.io : "Over 100 sprites!" ; "Includes spritesheets and separate sprites" ; tag Vector ; ZIP de 533 kB. kenney.nl : 100 fichiers, version 1.0 (2023). Taille des sprites non indiquée. | Description de la page : "various geometric characters with separate facial features and hands for thousands of combinations!". Visages et mains séparés donc expressions composables et étirement facile (format vectoriel annoncé). La page ne dit pas quelles formes de corps ni quelles expressions existent : à confirmer dans le ZIP. | OUI |
| Monster Builder Pack | Kenney | https://kenney.nl/assets/monster-builder-pack et https://kenney-assets.itch.io/monster-builder-pack | kenney.nl : "Creative Commons CC0". itch.io : "CC0 1.0 Universal" ; "You're allowed to use these game assets in any project including commercial ones." | itch.io : "Over 170 sprites!" ; "Includes spritesheets and separate sprites" ; "Each limb available in 6 colors" ; ZIP de 1,2 MB. kenney.nl : 170 fichiers, version 1.0 (2022). Dimensions non indiquées. | "Build your own monster using various types of eyes, mouths and limbs in six different colors." Très bon pour fabriquer héros et ennemis sur mesure, yeux et bouches interchangeables pour les expressions. La page ne dit pas s'il existe un corps rond ni la taille des sprites. | OUI |
| Emotes Pack | Kenney | https://kenney.nl/assets/emotes-pack | "Creative Commons CC0" | 480 fichiers ("480×"), tags "balloon" et "interface", ZIP kenney_emotes-pack.zip. Format et taille non indiqués. | Bulles d'émotion à poser au-dessus du héros ou des ennemis (réaction, effort, surprise). Ce n'est pas un jeu d'expressions faciales, et la page ne liste pas les émotions. Complément, pas un héros. | OUI |
| Jumping Blob | AntumDeluge (Jordan Irwin) | https://opengameart.org/content/jumping-blob | "Creative Commons Zero (CC0)" | blob-1.0.zip (7,1 KB). "Animated spritesheet of a blob-type creature. Designed for use with 32x32 pixel graphics." Orientation "orthogonal". Formats dans l'archive non listés. | Un vrai blob animé, mais minuscule (32x32), sans expressions, créé "for testing with RPG Toolkit". Utile comme référence d'animation, pas comme héros final. | OUI |

Recommandation : prendre Shape Characters en premier (CC0, format vectoriel annoncé donc net sur téléphone, visages et mains séparés pour les expressions et le squash/stretch), avec Emotes Pack pour les bulles de réaction. Monster Builder Pack sert de plan B ou pour des variantes. Aucune page vérifiée ne garantit un héros rond avec plusieurs expressions déjà dessinées : il faudra assembler le héros à partir des traits du visage et l'animer par étirement (scale) dans PixiJS.

---

## 2. Ennemis fantasy lisibles (gonflé, collant, lourd)

| Ressource | Auteur | Lien | Licence recopiée de la page | Format et contenu | Adéquation | Vérifié |
|---|---|---|---|---|---|---|
| Tiny Creatures | Clint Bellanger, avec Kenney en collaborateur | https://clintbellanger.itch.io/tiny-creatures et https://opengameart.org/content/tiny-creatures | itch.io : "CC0 1.0 Universal" ; "There's no need to ask permission before using these and giving attribution is not required (but is appreciated!)" ; "Made with Kenney's permission." OpenGameArt : "License: CC0 1.0 Universal." | 180 sprites de 16x16 pixels avec contours épais ; "Over 100 monsters", "Over 50 animals" ; exemple de carte Tiled ; ZIP de 176 kB (itch.io) ; formats internes non précisés. | Extension de Tiny Dungeon et Tiny Town, compatible avec eux. Beaucoup de choix, mais la page ne liste aucun monstre par nom : impossible de garantir un gonflé, un collant ou un golem sans ouvrir le ZIP. 16x16 demande un agrandissement entier (x4 ou plus). | OUI |
| 50+ Monsters Pack 2D | isaiah658 | https://opengameart.org/content/50-monsters-pack-2d | "CC0" ; "Everything included is licenced as Creative Commons 0 (CC0)." ; "Credit to isaiah658 is not required, but is appreciated." | ZIP de 242,8 KB ; 56 monstres de 64 x 64 pixels, chacun avec vue de face et de dos et une palette alternative ; pixel art (noir + 4 couleurs par monstre). Formats internes non listés. | 64x64 est lisible sur téléphone. Monstres numérotés, non nommés : on choisit par silhouette. Vues de face et de dos, pas de dessus. Style pixel, donc à réserver à une direction artistique pixel. | OUI |
| Animated top down creatures | MerlinOG (projet Open Bestiary) | https://opengameart.org/content/animated-top-down-creatures | Aucune licence affichée sur la page (seulement un lien vers un fichier de crédits généré) | La page cite Golem, Slime, Zombie, etc. mais aucune liste de fichiers, aucune taille. | Contenu très pertinent sur le papier (golem, slime), mais licence illisible sur la page. Ne pas utiliser. | NON VÉRIFIÉ |

Voir aussi Monster Builder Pack (section 1) pour fabriquer les trois archétypes par assemblage, et les sections 3 (Dungeon Crawl 32x32, DungeonTileset II) qui contiennent aussi des monstres.

Recommandation : si la direction artistique est vectorielle, construire les ennemis avec Monster Builder Pack (corps/yeux/bouches, 6 couleurs : le gonflé, le collant et le lourd se distinguent par assemblage et couleur). Si la direction est pixel, prendre Tiny Creatures (cohérent avec Tiny Dungeon). Aucune page vérifiée ne confirme un monstre "gonflé" ou "lourd" ; seule la page de 0x72 mentionne des "slugs" (limaces, v1.6), candidat pour le collant. À compléter par des assets maison pour le golem/rocher.

---

## 3. Tuiles et décor (sols, murs, props, dangers)

| Ressource | Auteur | Lien | Licence recopiée de la page | Format et contenu | Adéquation | Vérifié |
|---|---|---|---|---|---|---|
| Scribble Dungeons | Kenney | https://kenney.nl/assets/scribble-dungeons et https://kenney-assets.itch.io/scribble-dungeons | kenney.nl : "Creative Commons CC0". itch.io : "Creative Commons Zero v1.0 Universal" ; "You're allowed to use these game assets in any project including commercial ones." | Tuiles de 64 x 64 (kenney.nl) ; itch.io : "Over 256 sprites!", tuiles top-down pour donjons plus personnages, armes, objets ; "Tilesheets and separate sprites" ; sources vectorielles incluses ; ZIP de 1,4 MB ; version 1.0 (2022). Formats d'image non indiqués. | Seul pack Kenney vérifié en vue de dessus à 64 px avec sources vectorielles, donc net et redimensionnable. Série "Scribble" : le style dessiné à la main correspond bien à un ton humoristique ; reste à voir sur preview. Props précis (caisses, tonneaux, pics, lave) non listés sur la page. | OUI |
| Tiny Dungeon | Kenney | https://kenney.nl/assets/tiny-dungeon et https://kenney-assets.itch.io/tiny-dungeon | kenney.nl : "Creative Commons CC0". itch.io : "CC0 1.0 Universal" ; "You're allowed to use these game assets in any project including commercial ones." | Tuiles de 16 x 16 ; itch.io : "Over 130 sprites", tuiles de donjon plus armes, objets et personnages ; tilesheets et sprites séparés ; exemple de carte Tiled ; ZIP de 96 kB. | Base pixel propre et très compatible (Tiny Creatures s'y greffe). 16x16 : affichage en agrandissement entier (x3 à x6) en rendu pixel net. Liste précise des props non donnée. | OUI |
| Isometric Miniature Dungeon | Kenney | https://opengameart.org/content/isometric-miniature-dungeon et https://kenney.nl/assets/isometric-miniature-dungeon | OpenGameArt : "CC0" ; "Credit "Kenney.nl" or "www.kenney.nl", this is not mandatory." kenney.nl : "Creative Commons CC0" | OpenGameArt : 72 pièces (kenney.nl indique 70) en vues isométrique et de dessus ; PNG avec alpha ; 256 x 512 par image, hauteur de sol 128, point de vue 30° x 45° ; murs, sols, mobilier, caisse, tonneau, escalier ; exemples Unity et Tiled ; ZIP de 14,2 MB. | Seul pack vérifié où caisse et tonneau sont explicitement listés, en vue 3/4 "arène miniature". Les images sont grandes (256x512) donc lourdes en mémoire ; perspective incompatible avec un décor purement top-down. | OUI |
| 16x16 DungeonTileset II | 0x72 | https://0x72.itch.io/dungeontileset-ii | "Creative Commons Zero v1.0 Universal" ; "You can use this tileset for whatever you like (CC-0)." ; "Credit is not necessary, but if you create something using this tileset I'd be happy to see your work (you can comment with a link)." | Prix libre ; PNG dans un ZIP v1.7 de 406 kB ; tuiles 16x16. Historique de la page : autotiles (v1.7), slugs (v1.6), nains (v1.5), arc et flèche (v1.4), interrupteur et boutons (v1.2), piège à pics (v1.1). Images : torches animées, zombie, salles avec coffres. Nombre de sprites non indiqué. | Confirme sur la page des pics, des coffres, des boutons et des limaces (idée de monstre collant). Palette propre (GrafxKid) : à tester avant mélange avec la famille Kenney Tiny. 16x16. | OUI |
| Dungeon Crawl 32x32 tiles | Chris Hamons (mainteneur), soumis par MedicineStorm | https://opengameart.org/content/dungeon-crawl-32x32-tiles | "CC0" ; "You can use these tilesets in your program freely. No attribution is required." ; "As a courtesy, include a link to the OGA page." | Tuiles de 32 x 32, vue 3/4 orthogonale ; plus de 3 000 tuiles (et plus de 3 000 en supplément) : terrain, murs, décor, monstres, effets de sort, objets, interface, avatars. Fichiers : crawl-tiles Oct-5-2010.zip (2,7 MB), Dungeon Crawl Stone Soup Full.zip (5,7 MB), deux PNG de tileset. | Énorme choix à 32x32 (meilleur compromis lisibilité/finesse en pixel). Style roguelike classique plus sérieux que cartoon, issu de nombreux artistes : hétérogène. Un commentaire de la page signale qu'un autre lot (Denzi) est en CC-BY-SA : ne prendre que les fichiers de cette page. | OUI |
| UndeadEmpire tileset 64x64 (sols, lave, murs, effets) | Big Rook Games (soumis par lukems-br) | https://opengameart.org/content/undeadempire-tileset-64x64-repack-floor-lava-walls-and-effects | "CC-BY 3.0" ; notice : "It would be fair to give credits to Big Rook Games." | Un PNG de 100,4 KB, tuiles de 64 x 64 (colonnes et explosion en 128 px). Contenu listé : torche, sols de donjon (plusieurs extensions), animation de boule de glace, bulle de lave, sol de lave (plus extension), tuiles de lave, colonnes, explosion. | Comble le manque "lave" et "zone dangereuse" en 64x64. CC BY : attribution obligatoire. Style non vérifié visuellement. | OUI |

Recommandation : si la direction est vectorielle, démarrer avec Scribble Dungeons (top-down, 64 px, sources vectorielles) ; si elle est pixel, Tiny Dungeon (16x16) avec 0x72 pour pics, coffres et interrupteurs. UndeadEmpire apporte la lave. Aucune page vérifiée ne confirme explicitement des barricades cassables, des tremplins/ressorts, des flaques ou des fissures en vue de dessus : à dessiner ou à rechercher ailleurs. Isometric Miniature Dungeon n'est à prendre que si l'on choisit une vraie vue 3/4.

---

## 4. Interface (cadres, boutons, icônes)

| Ressource | Auteur | Lien | Licence recopiée de la page | Format et contenu | Adéquation | Vérifié |
|---|---|---|---|---|---|---|
| UI Pack - Adventure | Kenney | https://kenney.nl/assets/ui-pack-adventure | "Creative Commons CC0" | 130 fichiers ; tags boutons, panneaux, curseurs, interface ; version 1.0 publiée en 2024. Format et tailles non indiqués. | Le plus récent et le plus orienté "aventure" des UI Kenney vérifiés. Les tailles des boutons ne sont pas données : à dimensionner pour le tactile côté code. | OUI |
| Fantasy UI Borders | Kenney | https://kenney.nl/assets/fantasy-ui-borders | "Creative Commons CC0" | 140 fichiers ; tags panel, button, interface, decorative, rpg, fantasy ; version 1.0 (2023). Format non indiqué. | Cadres décoratifs fantasy pour menus, fiches et fenêtres. Complète UI Pack - Adventure. Style à confirmer visuellement. | OUI |
| game-icons.net | Lorc, Delapouite et contributeurs (auteur propre à chaque icône) | https://game-icons.net/ et https://game-icons.net/about.html | "CC BY 3.0" ; "They are provided provided under the terms of the Creative Commons 3.0 BY license." ; "It means that you can use them freely as long as you credit the original author in your creation." | "Already 4180 free icons for your games" ; "All the images are downloadable in a vector format" ; archives SVG et PNG, blanc/noir, fond transparent. | Très grande variété d'icônes fantasy (épée, bouclier, potion, crâne...) en silhouettes monochromes teintables. Attribution obligatoire, auteur par icône à suivre. | OUI |

Recommandation : UI Pack - Adventure en premier pour boutons et panneaux, Fantasy UI Borders pour les cadres, game-icons.net pour les icônes (en gardant la liste des icônes utilisées et de leurs auteurs). À compléter : tailles tactiles, polices dans les boutons, icônes de héros/ennemis spécifiques au jeu.

---

## 5. Effets (particules, impacts, fumée)

| Ressource | Auteur | Lien | Licence recopiée de la page | Format et contenu | Adéquation | Vérifié |
|---|---|---|---|---|---|---|
| Particle Pack | Kenney | https://kenney.nl/assets/particle-pack et https://opengameart.org/content/particle-pack-80-sprites | kenney.nl : "Creative Commons CC0". OpenGameArt : "CC0" ; "You may give credit to "Kenney.nl" or "www.kenney.nl", this is not mandatory but nonetheless appreciated." | 80 sprites de particules, light cookies et shaders ; OpenGameArt : PNG séparés (80), tilesheets, fichier vectoriel, exemples Unity (feu, fumée, magie, cœurs, étincelles, électricité) ; ZIP de 9,8 MB ; tuiles de 512 x 512 (kenney.nl). | Étincelles, lueurs et éclats pour impacts et rebonds. Sprites de 512 px : à réduire dans PixiJS. Lisse, donc cohérent avec une direction vectorielle, pas avec du pixel art. | OUI |
| Smoke Particles | Kenney | https://kenney.nl/assets/smoke-particles | "Creative Commons CC0" | 70 fichiers ; tags particle, smoke, explosion, vfx ; version 1.0 (2014). Formats et tailles non indiqués. | Fumée, nuages de poussière et explosions pour impacts lourds, destruction de caisses. | OUI |
| Hit Animation, Frame by frame | Sinestesia | https://opengameart.org/content/hit-animation-frame-by-frame | "CC0" | "hit - yellow.png" (2,2 MB) : PNG avec transparence, 16 images de 1024 x 1024 dans une feuille de 4096 x 4096 (grille 4x4 déduite) ; "Just a single animation of a "hit" vfx." | Effet d'impact en une animation. Feuille 4096x4096 très lourde en mémoire GPU : à redimensionner à 512 px par image. L'auteur "asks for attribution but doesn't require it". | OUI |

Recommandation : Particle Pack en premier (étincelles, éclats), Smoke Particles pour la poussière et la destruction, Hit Animation pour le flash d'impact (après réduction). Manque : fissures au sol, éclats de pierre ou de bois dessinés ; à créer en recolorant/combinant ces sprites.

---

## 6. Sons (impacts, rebonds, squash, interface, notes)

| Ressource | Auteur | Lien | Licence recopiée de la page | Format et contenu | Adéquation | Vérifié |
|---|---|---|---|---|---|---|
| Impact Sounds | Kenney | https://kenney.nl/assets/impact-sounds | "Creative Commons CC0" | 130 fichiers ; tags impact, foley ; version 1.0 (2019). Formats audio non indiqués. | Base de coups sourds, impacts bois/pierre/métal pour collisions. Le contenu exact n'est pas détaillé sur la page. | OUI |
| Interface Sounds | Kenney | https://kenney.nl/assets/interface-sounds | "Creative Commons CC0" | 100 fichiers ; tags interface, click, button ; version 1.0 (2020). Formats non indiqués. | Clics, validations, retours d'interface. | OUI |
| 75 CC0 breaking / falling / hit sfx | rubberduck | https://opengameart.org/content/75-cc0-breaking-falling-hit-sfx | "CC0" | sfx_breaking_and_falling.zip (1,6 MB) ; 75 sons ; tags bois, métal, verre, roche, pierre, RPG, fantasy, destruction. Formats non listés. | Casse de caisses/barricades et chutes de rochers. Complète Impact Sounds. | OUI |
| Bouncy Sound | Jofae (Freesound) | https://freesound.org/s/368175/ | "Creative Commons 0" | MP3, 0,69 s. Tags : boing, ball, bounce, rebound, springy. | Rebond élastique court, bon pour le héros. Page : "membrane-like quality". | OUI |
| Video Game SFX - Springboard / Trampoline / Jump | Breviceps (Freesound) | https://freesound.org/people/Breviceps/sounds/493161/ | "Creative Commons 0." ; "You can copy, modify, distribute and perform the sound, even for commercial purposes" | WAV 44,1 kHz 16 bits stéréo, 1,67 s ; "A cartoony springboard / trampoline effect. Perfect for retro video games." | Direct pour le tremplin. Style cartoon, cohérent avec l'humour. | OUI |
| Slime 7.wav | Archos (Freesound) | https://freesound.org/people/Archos/sounds/433827/ | "Creative Commons 0" ; "You can copy, modify, distribute and perform the sound, even for commercial purposes" | WAV, 2,0 s ; "rubber anti stress ball being squished". Tags : slime, splat, squelch, squish. | Squash réaliste pour l'ennemi collant. Plutôt réaliste que cartoon ; à pitcher/raccourcir. | OUI |
| Toy Glockenspiel | mooncubedesign (Freesound) | https://freesound.org/people/mooncubedesign/sounds/420501/ | "Creative Commons 0" ; "You can copy, modify, distribute and perform the sound, even for commercial purposes" | WAV 44,1 kHz 16 bits stéréo, 32 s, 5,4 MB ; "Sampled a toy Glockenspiel. C Major scale. Each note runs for 2 bars set to 120bpm." | Source pour la gamme montante des combos. Un seul fichier à découper en notes (8 notes si mesure à 4 temps : calcul à vérifier à l'écoute). | OUI |

Recommandation : Impact Sounds et Interface Sounds de Kenney comme base, 75 CC0 breaking sfx pour la casse, puis les sons Freesound pour le boing, le tremplin et le squash. Pour la gamme montante, découper Toy Glockenspiel ou transposer une seule note. Les formats Kenney ne sont pas indiqués sur les pages : prévoir la conversion en OGG/MP3 au build. Manque : un coup sourd "lourd" cartoon et un squash franchement cartoon ; Casino Audio et Music Jingles sont vérifiés mais en réserve (voir plus bas).

---

## 7. Musique (aventure épique avec légèreté, boss)

| Ressource | Auteur | Lien | Licence recopiée de la page | Format et contenu | Adéquation | Vérifié |
|---|---|---|---|---|---|---|
| Three Sheets to the Wind | Scott Buckley | https://www.scottbuckley.com.au/library/three-sheets-to-the-wind/ | "This work is licensed under a Creative Commons Attribution 4.0 International License" | MP3 (Full Mix) uniquement, aucun WAV ; durée et BPM non affichés ; 2023. "high fantasy, western, and Irish jig influences, as if staged within a production of The Pirates of Penzance". | Meilleure piste vérifiée pour "épique avec humour" : orchestre festif façon jig. Pas conçue comme boucle : points de boucle à créer. | OUI |
| Into The Wilds | Scott Buckley | https://www.scottbuckley.com.au/library/into-the-wilds/ | "This work is licensed under a Creative Commons Attribution 4.0 International License" | MP3 (Full Mix) uniquement ; durée non affichée ; 2024. "A heroic, adventurous orchestral track with bold brass and strings, with hints of high fantasy." | Thème d'exploration héroïque, plus sérieux que Three Sheets. | OUI |
| Juggernaut | Scott Buckley | https://www.scottbuckley.com.au/library/juggernaut/ | "This work is licensed under a Creative Commons Attribution 4.0 International License" ; "meaning it's free for use in any project (including commercial) as long as I'm credited." | MP3 (Full Mix) uniquement ; 2022. "Chugging, malevolent strings, brass and percussion, building up into a marauding epic force." | Piste de boss massive, sombre ("Epic, dark, and moody!" d'après un commentaire) : plus menaçant qu'humoristique. | OUI |
| Boss Battle Music (Epic Boss Battle, Seamlessly Looping) | SubspaceAudio (page) ; fichier crédité à Juhani Junkala | https://opengameart.org/content/boss-battle-music | "CC0" | WAV de 21,8 MB ; "Epic boss battle music inspired by God of War game series. Loops seamlessly!" ; tags orchestral, epic, boss battle ; durée non indiquée. | Alternative CC0 pour le boss, boucle déjà prévue. WAV de 21,8 MB : à encoder en OGG/MP3. Ton sérieux, pas humoristique. | OUI |
| Kevin MacLeod (incompetech) : Heroic Age, Adventures in Adventureland, Fluffing a Duck, Volatile Reaction, Black Vortex... | Kevin MacLeod | https://incompetech.com/music/royalty-free/full_list.php et https://incompetech.com/music/royalty-free/faq.html | La FAQ donne le modèle de crédit : "Licensed under Creative Commons: By Attribution 4.0". Les pages de pistes affichent seulement "Loading track..." : aucune licence lisible au niveau de la piste. | Les titres existent dans la liste alphabétique de la page (par exemple Heroic Age, Adventures in Adventureland, Fluffing a Duck, Volatile Reaction, Black Vortex). Genre, durée, BPM non lus. | Je n'ai pas pu confirmer l'ambiance ni la licence de chaque piste. Ne pas recommander tant qu'elle n'est pas lue sur une page de piste. | NON VÉRIFIÉ |

Recommandation : thème principal Three Sheets to the Wind (humour + fantasy), thème d'exploration Into The Wilds, boss Juggernaut (CC BY) ou Boss Battle Music (CC0, sans attribution). Tout Scott Buckley est en MP3 sans version bouclable : prévoir un montage des boucles. Manque : aucune piste de boss "légère" ; Kevin MacLeod à revérifier directement sur une page de piste si le Lead veut plus de choix.

---

## 8. Polices (Google Fonts, OFL)

Vérification par le fichier OFL.txt du manifeste `https://fonts.google.com/download/list?family=<nom>` (les pages specimen ne sont pas lisibles, voir "Méthode et limites").

| Ressource | Auteur | Lien | Licence recopiée de la page | Format et contenu | Adéquation | Vérifié |
|---|---|---|---|---|---|---|
| Cinzel (titre épique) | The Cinzel Project Authors | https://fonts.google.com/specimen/Cinzel (licence lue sur https://fonts.google.com/download/list?family=Cinzel) | "Copyright 2020 The Cinzel Project Authors (https://github.com/NDISCOVER/Cinzel)" ; "SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007" | Statiques Regular, Medium, SemiBold, Bold, ExtraBold, Black plus une variable (wght), TTF. | Titre épique et lisible à grande taille. À éviter en petit corps. Accents à tester. | OUI |
| Lilita One (titre ludique) | Juan Montoreano | https://fonts.google.com/specimen/Lilita+One (licence lue sur https://fonts.google.com/download/list?family=Lilita+One) | "Copyright (c) 2011 Juan Montoreano (juan@remolacha.biz)," ; "SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007" | Un seul style, LilitaOne-Regular.ttf. | Titre arrondi et épais pour le ton humoristique, bonne lisibilité sur petit écran. Accents à tester. | OUI |
| Nunito (texte) | The Nunito Project Authors | https://fonts.google.com/specimen/Nunito (licence lue sur https://fonts.google.com/download/list?family=Nunito) | "Copyright 2014 The Nunito Project Authors (https://github.com/googlefonts/nunito)" ; "SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007" | Statiques de ExtraLight à Black avec italiques, plus deux variables (wght), TTF. | Texte arrondi, très lisible, grande plage de graisses. Accents à tester. | OUI |

Recommandation : Lilita One ou Cinzel pour les titres (Lilita One pour l'humour, Cinzel pour l'épique), Nunito pour le texte. Il faut conserver OFL.txt avec les fichiers si on les embarque. À compléter : test des accents français, choix d'une police de chiffres/score si besoin.

---

## Cohérence visuelle

Je n'ai pas pu voir les images : les deux ensembles ci-dessous sont déduits des tags, dates et auteurs des pages, et doivent être validés en superposant les previews.

### Ensemble A (recommandé) : Kenney vectoriel, net et redimensionnable

- Héros : Shape Characters (vectoriel, traits du visage séparés) avec Emotes Pack pour les bulles.
- Ennemis : Monster Builder Pack (même éditeur, période 2022-2023).
- Décor : Scribble Dungeons (top-down, 64 px, sources vectorielles). UI : UI Pack - Adventure et Fantasy UI Borders. Effets : Particle Pack, Smoke Particles, Hit Animation réduite.
- Sons : Impact Sounds et Interface Sounds, 75 CC0 breaking sfx, Freesound. Musique : Scott Buckley. Polices : Lilita One ou Cinzel plus Nunito.
- Point à valider : le trait de Scribble Dungeons (dessiné à la main) face au style plat de Shape Characters et de Monster Builder Pack.

### Ensemble B : pixel art 16x16, famille Kenney Tiny

- Décor : Tiny Dungeon, avec 0x72 DungeonTileset II pour pics, coffres et interrupteurs (palette propre, à tester).
- Ennemis et héros : Tiny Creatures (compatibilité avec Tiny Dungeon annoncée sur la page, "Made with Kenney's permission") ; le héros rond est à choisir dans les 100 monstres après inspection du ZIP.
- UI : le Roguelike/RPG pack (en réserve, tags boutons et panneaux, 16x16). Effets : à dessiner ou à pixelliser, car les effets Kenney sont lisses. Sons, musique, polices comme l'ensemble A.
- Risque : héros et expressions très limités à 16x16, et affichage en agrandissement entier (x3 à x6).

### Mélanges à éviter

- Pixel art (16, 32 ou 64 px) avec sprites vectoriels ou lisses (Particle Pack, Hit Animation, Shape Characters) dans la même scène.
- Plusieurs densités de pixels à l'écran (16x16 et 32x32 et 64x64).
- Isometric Miniature Dungeon (rendu 256x512, 30° x 45°) avec des décors top-down.
- Dungeon Crawl 32x32 avec la famille Kenney : style roguelike hétérogène, palette différente. À réserver à une direction pixel autonome.
- Mélanger le lot Denzi (CC-BY-SA, signalé sur la page de Dungeon Crawl) avec nos assets : hors licence.

---

## Attributions à prévoir

Ressources CC BY retenues dans les tableaux (attribution obligatoire) :

- Scott Buckley, texte recopié de chaque page :
  - "'Three Sheets To The Wind' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au"
  - "'Into The Wilds' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au"
  - "'Juggernaut' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au" (seulement si cette piste est retenue)
  - Les pages précisent aussi : "For YouTube videos, credits must appear in the video description." (applicable aux vidéos de promotion).
- game-icons.net, format recommandé par la page About : "Icons made by {author;}. Available on https://game-icons.net" avec {author;} remplacé par l'auteur de chaque icône utilisée (Lorc, Delapouite, ou autre). Mentionner aussi "CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/)". La page n'impose pas d'autre texte.
- UndeadEmpire (Big Rook Games, CC BY 3.0) : la page demande seulement "It would be fair to give credits to Big Rook Games." Texte proposé (rédigé par moi, non imposé par la page) : "UndeadEmpire tileset by Big Rook Games, CC BY 3.0, via OpenGameArt (https://opengameart.org/content/undeadempire-tileset-64x64-repack-floor-lava-walls-and-effects)". Seulement si l'asset est retenu.

Ressources CC0 : aucune attribution requise. Mentions de courtoisie suggérées par les pages (non obligatoires) : "Kenney.nl" ou "www.kenney.nl" (Kenney), lien vers la page OpenGameArt (Dungeon Crawl 32x32), "Credit is not necessary" (0x72). La page de Hit Animation dit que l'auteur "asks for attribution but doesn't require it".

Si le Lead retient un jour des éléments en réserve : Fun Adventure (notice "HitCtrl", CC-BY 3.0), PlanetCute ("PlanetCute" art by Daniel Cook (Lostgarden.com), CC-BY 3.0), Bouncing Blue Blob (cactusturtle, "Creative Commons Attribution v4.0 International", la page ne prescrit aucun texte).

Kevin MacLeod (NON VÉRIFIÉ) : modèle de la FAQ à utiliser si une piste est validée : "Title Kevin MacLeod (incompetech.com)" / "Licensed under Creative Commons: By Attribution 4.0" / "https://creativecommons.org/licenses/by/4.0/".

Polices OFL : pas d'attribution à l'écran, mais conserver les fichiers OFL.txt avec les polices embarquées.

---

## Annexe A. Réserve : ressources vérifiées OUI mais non retenues en priorité

| Ressource | Auteur | Lien | Licence recopiée de la page | Pourquoi en réserve |
|---|---|---|---|---|
| Roguelike/RPG pack | Kenney | https://kenney.nl/assets/roguelike-rpg-pack | "Creative Commons CC0" | 1 700 fichiers, 16 x 16 ; tags tuiles, mobilier, boutons, panneaux. Utile si ensemble B ; contenu non détaillé. |
| Tiny Town | Kenney | https://kenney.nl/assets/tiny-town | "Creative Commons CC0" | 130 fichiers, 16 x 16 ; thème village/overworld, hors donjon. |
| Roguelike Caves & Dungeons | Kenney | https://kenney.nl/assets/roguelike-caves-dungeons | "Creative Commons CC0" | "520×" ; tags dungeon, cave, mine, pixel ; taille de tuile non indiquée. |
| UI Pack | Kenney | https://kenney.nl/assets/ui-pack | "Creative Commons CC0" | 430 fichiers, version 2.0 "Completely remade" ; interface générique plutôt que fantasy. |
| UI Pack (RPG Expansion) | Kenney | https://kenney.nl/assets/ui-pack-rpg-expansion | "Creative Commons CC0" | 85 fichiers ; tags rpg, button, panel, slider ; version 2014. |
| Game Icons | Kenney | https://kenney.nl/assets/game-icons | "Creative Commons CC0" | 105 fichiers ; tags gamepad, joystick, prompt : icônes de manette, pas d'icônes fantasy. |
| Casino Audio | Kenney | https://kenney.nl/assets/casino-audio | "Creative Commons CC0" | 50 fichiers ; foley de cartes, dés, jetons : peu utile ici (clics de dés et jetons possibles). |
| Music Jingles | Kenney | https://kenney.nl/assets/music-jingles | "Creative Commons CC0" | 85 fichiers ; contenu non détaillé ; à écouter pour fanfares de victoire. |
| Blob Sprite | Woostar | https://opengameart.org/content/blob-sprite | "CC0" | Quatre PNG (idle, attack, move, death) ; tailles non données ; tag collection "Top down monster game". |
| Slime | TinyWorlds | https://opengameart.org/content/slime-0 | "CC0" | 5 couleurs, source GIMP incluse ; "Cute animated slime sprite for RPGs and Platformers" ; tailles non données. |
| More assorted 32x32 creatures | AndHeGames | https://opengameart.org/content/more-assorted-32x32-creatures | "CC0" ; "No restrictions at all, but do let me know what you make with them." | Un PNG de créatures 32x32 ; nombre non indiqué. |
| Top Down Dungeon Pack | Screaming Brain Studios | https://opengameart.org/content/top-down-dungeon-pack | "CC0" | 64 x 64 ; 2 256 tuiles de murs (7 types) et de sols (7 types) avec autotiles Tiled ; pas de props. |
| Helice Incredible Adventure | Komiku (publié par Loyalty Freak Music) | https://opengameart.org/content/helice-incredible-adventure-fantasy-disco-rpg-battle-music-and-midi-files-pack | "All music written by Komiku under Creative Commons 0 licence." | Album fantasy disco/rock, MP3 (145 MB) et MIDI ; nombre de pistes non confirmé ; ton très particulier. |
| Fun Adventure | Hitctrl | https://opengameart.org/content/fun-adventure | "CC-BY 3.0" ; notice "HitCtrl" | MP3 4,2 MB et OGG 1,1 MB, "loop-able" ; CC BY. |
| 4 Chiptunes (Adventure) | SubspaceAudio ; fichiers crédités à Juhani Junkala | https://opengameart.org/content/4-chiptunes-adventure | "CC0" | Quatre boucles chiptune (OGG et WAV) ; trop rétro pour l'orchestral visé. |
| Crate Break 1.wav | kevinkace | https://freesound.org/people/kevinkace/sounds/66777/ | "Creative Commons 0" | WAV mono 1,2 s, caisse en bois qui casse ; couvert aussi par le pack de 75 sons. |
| impact-stone.wav | kasparsj | https://freesound.org/people/kasparsj/sounds/513693/ | "Creative Commons 0" | WAV mono 1,0 s, pierre sur pierre ; réaliste. |
| Bouncing Ball.wav | JaenKleynhans | https://freesound.org/people/JaenKleynhans/sounds/267882/ | "Creative Commons 0" | WAV stéréo 3,6 s, balle qui rebondit ; trop long, réaliste. |
| Jump - Platformer | colorsCrimsonTears | https://freesound.org/people/colorsCrimsonTears/sounds/580309/ | "Creative Commons 0" | WAV 96 kHz, 0,3 s ; saut rétro. |
| Cartoon jump.wav | Bastianhallo | https://freesound.org/people/Bastianhallo/sounds/462958/ | "Creative Commons 0" | WAV 1,7 s ; l'auteur demande un lien (non obligatoire). |
| MedievalSharp (police) | wmk69 | https://fonts.google.com/download/list?family=MedievalSharp | "Copyright (c) 2011, wmk69 (wmk69@o2.pl)," ; "SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007" | Style médiéval plus marqué que Cinzel ; un seul style. |
| Atkinson Hyperlegible (police) | Braille Institute of America, Inc. | https://fonts.google.com/download/list?family=Atkinson+Hyperlegible | "Copyright 2020 Braille Institute of America, Inc." ; "SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007" | Alternative de texte très lisible à Nunito. |
| PlanetCute: Enemy Bug.png | Daniel Cook (Lostgarden.com), soumis par bart | https://opengameart.org/content/planetcute-enemy-bugpng | "CC-BY 3.0" ; notice : "PlanetCute" art by Daniel Cook (Lostgarden.com) | PNG de 12,6 Kb, dimensions non affichées ; pièces individuelles, style mignon en vue 3/4 ; CC BY. |
| PlanetCute: Wood Block.png | Daniel Cook (Lostgarden.com), soumis par bart | https://opengameart.org/content/planetcute-wood-blockpng | "CC-BY 3.0" ; notice : "PlanetCute" art by Daniel Cook (Lostgarden.com) | PNG de 4,3 KB ; bloc de bois, candidat caisse ; CC BY. |
| Bouncing Blue Blob | cactusturtle | https://cactusturtle.itch.io/bouncing-blue-blob | "Creative Commons Attribution v4.0 International" | ZIP de 5,5 kB ; slime bleu en animation idle et saut ; taille non indiquée ; CC BY 4.0. |
| Sokoban | Kenney | https://kenney.nl/assets/sokoban | "Creative Commons CC0" | 100 fichiers ; tags tile, puzzle, top-down, character ; contenu exact non détaillé (caisses possibles, à confirmer dans le ZIP). |
| Physics Assets | Kenney | https://kenney.nl/assets/physics-assets | "Creative Commons CC0" | 215 fichiers ; tags physics, block, shape ; contenu exact non détaillé. |
| Animal Pack | Kenney | https://kenney.nl/assets/animal-pack | "Creative Commons CC0" | 80 fichiers ; tags puzzle, character ; contenu exact non détaillé. |
| Board Game Icons | Kenney | https://kenney.nl/assets/board-game-icons | "Creative Commons CC0" | 250 fichiers ; tags board, icon, card, interface. |
| UI Audio | Kenney | https://kenney.nl/assets/ui-audio | "Creative Commons CC0" | 50 fichiers ; tags button, switch, click. |
| RPG Audio | Kenney | https://kenney.nl/assets/rpg-audio | "Creative Commons CC0" | 50 fichiers ; tags foley, rpg, footstep, weapon. |
| Digital Audio | Kenney | https://kenney.nl/assets/digital-audio | "Creative Commons CC0" | 60 fichiers ; tags space, laser ; sons électroniques, pas de notes confirmées. |
| Cinzel Decorative (police) | Natanael Gama | https://fonts.google.com/download/list?family=Cinzel+Decorative | "Copyright (c) 2012 Natanael Gama (info@ndiscovered.com), with Reserved Font Name 'Cinzel'" ; "SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007" | Variante ornée de Cinzel (Regular, Bold, Black). |
| Almendra (police) | Ana Sanfelippo | https://fonts.google.com/download/list?family=Almendra | "Copyright (c) 2011-2012, Ana Sanfelippo (anasanfe@gmail.com), with Reserved Font Name 'Almendra'" ; "SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007" | Police calligraphique fantasy, 4 styles. |
| Adventurer and Slime game Sprites | Segel | https://opengameart.org/content/adventurer-and-slime-game-sprites | "CC0" | ZIP de 9,4 MB (PNG) ; un aventurier et un slime animés, vue de côté ; tailles non données. |

## Annexe B. Ressources écartées (licence refusée, contradictoire ou ambiguë)

| Ressource | Lien | Ce que dit la page | Motif du rejet |
|---|---|---|---|
| Goopy - Basic Slime Character Asset (Goopy_Games+) | https://goopy-games-plus.itch.io/goopy | "This work is licensed under CC BY-ND 4.0" ; "Resell or redistribute the assets (even modified versions)" interdit | CC BY-ND non accepté ; en plus payant (2 USD). |
| Cute Slime (zhengxiaoyao0716) | https://zhengxiaoyao0716.itch.io/cute-slime | "Creative Commons Zero v1.0 Universal" et "LICENSE: CC0", mais aussi "You may not redistribute it or resell it." | Contradiction entre CC0 et interdiction de redistribuer : licence ambiguë. |
| Tiny Swords (Pixel Frog) | https://pixelfrog-assets.itch.io/tiny-swords | "You may not redistribute, resell, or repackage the assets, even if the files are modified." (une ancienne version "TS_old version_CC0 Licensed" est listée en téléchargement mais non expliquée) | Licence personnalisée, pas CC0 ni CC BY. |
| Mini Medieval Volcano / Lava tileset (Booom) | https://booomstick.itch.io/mini-medieval-volcano-lava-tileset-topdown-32x32 | Aucune licence nommée ; payant (1 USD) ; "Not allowed to resell this tileset themselve." | Pas de licence CC0/CC BY lisible. |
| Luckiest Guy (Google Fonts) | https://fonts.google.com/download/list?family=Luckiest+Guy | LICENSE.txt : "Apache License" "Version 2.0, January 2004" | Apache 2.0, pas OFL. |
| 32X32 Dungeon Tileset (ThatOneRandomGameDev) | https://opengameart.org/content/32x32-dungeon-tileset-0 | Licence "CC0", mais un commentaire cite "You may not redistribute this tileset." | Contradiction signalée par un commentaire, auteur sans réponse : licence ambiguë. |
