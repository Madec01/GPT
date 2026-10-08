**Direction 3 retenue le 8 octobre 2026, intégrée en 0.6.1.**

# FRONDE : direction artistique, trois pistes comparées

Date : 8 octobre 2026
Auteur : sous-agent Assets, pour le Lead Architect
Statut : historique de la comparaison. La direction 3 a été retenue par le propriétaire (voir la première ligne) ; les fichiers livrés et leurs sources sont dans `docs/CREDITS.md`.

Ce document propose une alternative à la direction vectorielle Kenney retenue dans `docs/ASSETS_SURVEY.md`, que le propriétaire juge trop peu héroïque. Il repose sur des archives réellement téléchargées et ouvertes, pas sur des pages de présentation. Les maquettes sont composées par script Pillow à partir des vrais fichiers.

Les mentions de licence sont recopiées de la page ou du fichier de licence de chaque pack, sans leurs parenthèses, conformément à la consigne de forme.

## 1. En un coup d'œil

| | Direction 1 : Tiny Rondeval | Direction 2 : Donjon animé | Direction 3 : Rondeval classique |
|---|---|---|---|
| Maquette | `mockups/direction-1.png` | `mockups/direction-2.png` | `mockups/direction-3.png` |
| Planche de tous les besoins | `mockups/direction-1-planche.png` | `mockups/direction-2-planche.png` | `mockups/direction-3-planche.png` |
| Cœur de la direction | Kenney Tiny Dungeon, Tiny Town, plus Tiny Creatures | 0x72 DungeonTileset II | Dungeon Crawl Stone Soup, tuiles 32 px |
| Style | pixel art 16 px, contour épais, palette Kenney | pixel art 16 px, contour fin, palette sombre | pixel art 32 px ombré, bestiaire de roguelike classique |
| Affichage | ×3, soit 48 px, voisin le plus proche | ×3, ×2 pour les 32 px | environ ×1,4, soit 45 px, lissage léger |
| Griffon | oui, trapu, Tiny Creatures 105 | non, à emprunter à la direction 1 | oui, adulte et fier, griffon.png |
| Animations | aucune sur les créatures | repos, course, coup sur tous les personnages | aucune |
| Licences | 100 % CC0 | 100 % CC0 | CC0, plus CC BY pour sept icônes de nœuds |
| Poids utile mesuré | 35 Ko pour 91 fichiers | 33 Ko pour 94 fichiers | 76 Ko pour 70 fichiers |
| Manques | hérisson, ressort | chauve-souris, crapaud, hérisson, tonneau, ressort, œuf, actes 2 et 3 | hérisson, tonneau, tonneau de poudre, ressort, éclats de bois |
| Verdict | sûre, cohérente, comique | réserve d'animations | recommandée, la plus héroïque |

Aucun des trois ne fournit de visage à yeux et bouche superposables pour Dodu. Le plan B est détaillé en section 6.

## 2. Méthode et limites

- Toutes les archives retenues ont été téléchargées dans des dossiers séparés du scratchpad, extraites sans exécuter quoi que ce soit, puis lues en Pillow. Aucun fichier n'a été écrit dans `src/`, `public/`, `tests/` ni `scripts/`.
- Les téléchargements itch.io ont fonctionné sans compte, par le point d'accès public `download_url` puis `file/identifiant` de chaque page. Les liens directs restent inexistants, mais les archives sont accessibles. Aucune maquette ne repose sur un simple aperçu.
- Géométrie de la maquette, lue dans `src/render/camera.ts` : écran 390 × 844, marges haut 72, bas 120, côtés 12, ce qui donne 40,67 px par unité d'arène et une arène de 366 × 569 px. Les murs sont dessinés autour de l'arène sur 0,35 unité, soit 14 px, d'après `pixiRenderer.ts`.
- Tailles à l'écran qui en découlent : Dodu, crapaud et gelée de rayon 0,5 font 40,7 px de diamètre, le rocailleux de rayon 0,6 fait 48,8 px, le boss de rayon 1,2 fait 97,6 px.
- Disposition identique dans les trois maquettes pour comparer à armes égales : crapaud, gelée, rocailleux, deux caisses, une barricade de trois unités, un gouffre de 2,2 unités, un cœur de soin, l'aide à la visée en pointillé vert, un panneau haut avec trois cœurs et la jauge de trois segments, deux boutons dont un pressé, puis une bande basse avec sept icônes de nœuds et six charmes.
- Éléments assemblés ou teintés mécaniquement, signalés en orange dans les planches : gouffre, teintes élites, bouclier posé sur un corps, bulles d'émote. Rien n'est dessiné à la main, rien n'est généré par IA.
- Je n'ai pas lancé de build ni de test. Les polices ont été vérifiées avec fontTools : toutes couvrent é è ê à â ç ù û î ô œ É À Ç Œ ’ « » … et le tiret demi-cadratin.

## 3. Direction 1 : Tiny Rondeval

### Packs retenus

| Pack | URL | Licence exacte | Archive |
|---|---|---|---|
| Kenney Tiny Dungeon 1.0 | https://kenney.nl/assets/tiny-dungeon | License.txt : Creative Commons Zero, CC0. This content is free to use in personal, educational and commercial projects. | 98 Ko |
| Kenney Tiny Town | https://kenney.nl/assets/tiny-town | License.txt : Creative Commons Zero, CC0. | 182 Ko |
| Tiny Creatures 1.0, Clint Bellanger | https://opengameart.org/content/tiny-creatures | Page : License: CC0 1.0 Universal. License.txt : Creative Commons Zero, CC0. Attribution not required but appreciated. | 180 Ko |
| Kenney UI Pack Pixel Adventure | https://kenney.nl/assets/ui-pack-pixel-adventure | License.txt : Creative Commons Zero, CC0. | 317 Ko |
| Kenney Emotes Pack | https://kenney.nl/assets/emotes-pack | License.txt : License Creative Commons Zero, CC0. You may use these assets in personal and commercial projects. | 380 Ko |
| Ninja Adventure, pixel-boy et AAA, pour les icônes d'objets, 16 charmes, débris et fumée | https://pixel-boy.itch.io/ninja-adventure-asset-pack | LICENSE.txt : CC0 1.0 Universal. README : They are released under the Creative Commons Zero, CC0, license. Page : Asset license Creative Commons Zero v1.0 Universal. | 94 Mo, 40 Ko utilisés |
| OpenGameArt Egg Item Sprite, pour l'œuf | https://opengameart.org/content/egg-item-sprite | Page : CC0 | 3 Ko |
| Polices Pixelify Sans pour le titre et Nunito pour le texte | https://fonts.google.com/specimen/Pixelify+Sans | OFL.txt : SIL OPEN FONT LICENSE Version 1.1, 26 February 2007 | 51 Ko et 132 Ko |

### Couverture

- Couvert tel quel : griffon, crapaud, gelée, rocailleux, boss troll, chauve-souris, ogre Goulafre, caisse, tonneau, barricade en clôture de bois, tremplin en bouclier rond, cœur de soin, boulet, débris de bois et de pierre, fumée, étincelle, pièce d'or, panneau, boutons, jauge, sept icônes de nœuds, seize charmes, sols et murs des trois actes.
- Couvert par assemblage ou teinte : variantes élites par rotation de teinte, bouclier posé sur le corps par superposition d'un bouclier de Tiny Dungeon, tonneau de poudre par superposition d'une bombe sur un tonneau, œuf par teinte crème de la tuile 66 de Tiny Dungeon ou par le sprite d'œuf OpenGameArt, gouffre composé d'aplats sombres avec liseré, colonne approchée par le piédestal de pierre de la tuile 64 de Tiny Dungeon, second gardien par le golem de fer en attendant un troll en marmites.
- Manque : hérisson, ressort à spires. Silhouettes de secours CC BY 3.0 chez game-icons.net : caro-asercion hedgehog et delapouite spring.
- Sept expressions : aucune variante de visage, voir section 6.

### Style, tailles, animations

Pixel art 16 × 16, contour brun épais, une palette unique pour Tiny Dungeon, Tiny Town et Tiny Creatures. Les tuiles sont fournies une par une, avec une feuille. Ninja Adventure ajoute des feuilles de 16 px à quatre directions pour ses monstres, mais pas pour les créatures retenues. Les créatures de Tiny Creatures sont immobiles : le jeu animera par écrasement et étirement, ce que le GDD prévoit déjà.

### Risques

- Les tuiles de Tiny Creatures ont un fond noir opaque et non transparent. Il faut le détourer à l'import, par remplissage depuis les bords, ce que fait la maquette.
- Quatre packs de trois auteurs : la palette de Ninja Adventure est un peu plus claire que celle de Kenney, à contrôler pour les charmes.
- Pas de variante de visage. Le griffon Tiny Creatures est adulte et trapu, pas un poussin.
- Un affichage ×3 donne 48 px de sprite pour une unité de 40,7 px : le sprite déborde de 3 px de chaque côté du corps physique, sans conséquence en jeu.

## 4. Direction 2 : Donjon animé

### Packs retenus

| Pack | URL | Licence exacte | Archive |
|---|---|---|---|
| 0x72 DungeonTileset II 1.7 | https://0x72.itch.io/dungeontileset-ii | Page : You can use this tileset for whatever you like, CC-0. Credit is not necessary. Asset license Creative Commons Zero v1.0 Universal. | 416 Ko |
| Kenney UI Pack Pixel Adventure | https://kenney.nl/assets/ui-pack-pixel-adventure | License.txt : Creative Commons Zero, CC0. | 317 Ko |
| Kenney Tiny Town, pour la clôture empruntée | https://kenney.nl/assets/tiny-town | License.txt : Creative Commons Zero, CC0. | 182 Ko |
| Griffon emprunté à Tiny Creatures | https://opengameart.org/content/tiny-creatures | CC0 1.0 Universal | 180 Ko |
| Police Jersey 10 pour le titre | https://fonts.google.com/specimen/Jersey+10 | SIL OPEN FONT LICENSE Version 1.1 | 77 Ko |

### Couverture

- Couvert tel quel : gelée avec swampy et muddy, rocailleux avec big_zombie, boss avec big_zombie ou ogre, caisse, colonne, gouffre en bouche dentée, pièges à pointes, coffre, porte, cœur plein et vide, pièce d'or animée sur quatre images, flacons, bombe, icônes de nœuds.
- Couvert par emprunt : griffon, barricade, bouclier.
- Manque : griffon, crapaud bouffi, chauve-souris, hérisson, tonneau, tonneau de poudre, ressort, œuf, boulet, éclats de bois et de pierre, sols et murs des actes 2 et 3, charmes autres que potions et armes.
- Plan B de héros propre au pack : le chevalier plumé knight_m, à faire valider, car il change l'univers validé.

### Style, tailles, animations

Pixel art 16 × 16, personnages de 16 × 28 et gros monstres de 32 × 36, contour sombre fin, palette brun et vert sourde. Le pack fournit des images idle sur quatre frames, run sur quatre frames et hit sur une frame pour chaque personnage, plus des objets animés : pièces, fontaines, flammes, pièges. C'est le seul pack du lot qui donne repos, course et coup sans rien assembler.

### Risques

- Trop de manques pour porter seul le jeu : sans crapaud, sans chauve-souris, sans décor extérieur.
- Le griffon vient d'un autre pack : contour et palette voisins mais pas identiques.
- Les gros monstres de 32 px et les petits de 16 px se mélangent mal à ×3 : prévoir ×2 pour les gros, comme dans la maquette.

## 5. Direction 3 : Rondeval classique

### Packs retenus

| Pack | URL | Licence exacte | Archive |
|---|---|---|---|
| Dungeon Crawl 32x32 tiles, archive Dungeon Crawl Stone Soup Full, maintenue par Chris Hamons | https://opengameart.org/content/dungeon-crawl-32x32-tiles | Page : CC0. README : The wonderful developers/artists who work on Crawl Stone Soup have signed off their copyrights on the tiles enclosed in here, returning them back to a state similar to public domain, CC Zero, see LICENSE.TXT. They are free to use for any purpose. LICENSE.txt : CC0 1.0 Universal. | 5,7 Mo, 6 031 fichiers, 76 Ko utilisés |
| Kenney UI Pack Adventure | https://kenney.nl/assets/ui-pack-adventure | License.txt : Creative Commons Zero, CC0. Déjà dans le projet. | 577 Ko |
| Kenney Emotes Pack, versions vectorielles | https://kenney.nl/assets/emotes-pack | License.txt : License Creative Commons Zero, CC0. | 380 Ko |
| game-icons.net, sept icônes de nœuds | https://game-icons.net/about.html | Page : They are provided under the terms of the Creative Commons 3.0 BY license. It means that you can use them freely as long as you credit the original author in your creation. | 47 Ko pour 27 SVG |
| OpenGameArt Egg Item Sprite | https://opengameart.org/content/egg-item-sprite | Page : CC0 | 3 Ko |
| Polices Cinzel pour le titre et Nunito pour le texte | https://fonts.google.com/specimen/Cinzel | OFL.txt : SIL OPEN FONT LICENSE Version 1.1, 26 February 2007 | 77 Ko et 132 Ko |

Attribution obligatoire pour les icônes game-icons.net, à ajouter à `docs/CREDITS.md` et à l'écran Crédits : Icons made by Lorc, Delapouite, Skoll and Caro Asercion. Available on https://game-icons.net, licence CC BY 3.0, https://creativecommons.org/licenses/by/3.0/. Les auteurs exacts de chaque icône sont dans le tableau de la section 8.

### Couverture

- Couvert tel quel : griffon, crapaud avec giant_toad, gelée avec azure_jelly_new, rocailleux avec stone_golem, boss troll avec troll, second gardien avec iron_troll, ogre Goulafre, chauve-souris, boucliers, caisse, barricade en herse de bois, colonne avec trois états de fissure, tremplin en bouclier, boulet, œuf, fumée, étincelle, poussière de pierre, pièces d'or, vingt-neuf amulettes pour les charmes, sols et murs des trois actes.
- Variantes élites naturelles, donc sans teinte : grenouille épineuse, gelée rouge, golem de fer.
- Couvert par assemblage ou emprunt : gouffre, cœur de soin repris du Kenney déjà dans le projet, icônes de nœuds en game-icons.net.
- Manque : hérisson, tonneau, tonneau de poudre, ressort à spires, éclats de bois. Secours : silhouettes game-icons.net delapouite barrel, delapouite spring et caro-asercion hedgehog, teintées, ou éclats de bois de Ninja Adventure FX Particle Bamboo.png, en CC0.
- Sept expressions : aucune variante de visage, voir section 6.

### Style, tailles, animations

Pixel art 32 × 32 ombré, avec ombre portée intégrée sous les monstres. Ce format reste plus rare que le 16 px dans les packs libres. Aucune animation : chaque créature est une image fixe, certaines en variante old et new. Les sols et murs sont nombreux : des dizaines de familles de sol et de mur, bords compris. À environ 45 px d'écran, le griffon, le crapaud et la gelée gardent leurs détails, ce que le 16 px ne permet pas.

### Risques

- Hétérogénéité : le pack agrège des dizaines d'artistes. Les monstres sont cohérents entre eux, les sols et murs un peu moins. Règle : une seule famille de mur par acte, toujours la variante new.
- Ton plus sombre et plus sérieux que le comique recherché. Les bulles d'émote, l'écrasement et le ton des textes compensent.
- Le griffon est adulte, élancé et fier, pas un poussin rond.
- Interface vectorielle Kenney contre sprites en pixel art : coexistence habituelle, mais à surveiller à l'écran.
- Affichage non entier à ×1,4 : voir les notes d'intégration en section 9.
- Aucune animation de personnage.

## 6. Héros Dodu : plan B précis, à faire valider

Aucun pack libre ne contient un poussin de griffon rond aux yeux et bouches superposables. Je ne tranche pas, voici les options chiffrées.

1. Expressions par bulles d'émote, option par défaut. Le griffon garde un seul sprite et porte au-dessus de la tête une bulle du Kenney Emotes Pack, CC0, 16 px en pixel ou 32 × 38 en vectoriel. Correspondance visée circle, vol exclamation, impact alert, fier star, inquiet drop, sonné swirl, touché stars. Les planches montrent les sept cas. Coût : zéro dessin, une couche de sprite en plus. Perte : le visage ne change pas, ce que l'écrasement et un flash de teinte compensent.
2. Héros plus rond, direction 1 ou 2 : le poulet blanc de Ninja Adventure, fichier Actor/Animal/Chicken/SpriteSheetWhite.png, première image de 16 × 16, teinté or par multiplication 255, 205, 70. Rond, trapu, bec et crête, deux images fournies. C'est un poussin doré, pas un griffon : il faut valider le changement de lore auprès du propriétaire. Visible dans les trois planches.
3. Héros alternatif chevalier rond : le Warrior de la version CC0 de Tiny Swords, corps en œuf, panache, bouclier, frames de 192 px, mais licence à clarifier, voir section 7. Change complètement le héros validé, donc à ne proposer que si le propriétaire renonce au griffon.
4. Option non retenue : garder les yeux et bouches Shape Characters de Kenney déjà dans le dépôt sur un corps pixel. Cohérence visuelle nulle, je l'écarte.

Pour la direction 3, le griffon DCSS est le meilleur substitut disponible. Si le propriétaire tient au poussin, l'option 2 s'affichera en 16 px à ×3 à côté de monstres en 32 px, une densité de pixels différente. Je la déconseille dans ce cas.

## 7. Candidats évalués et écartés, avec raison de licence

| Candidat | Constat sur page ou fichier | Décision |
|---|---|---|
| Pixel Frog Tiny Swords, version actuelle, Free Pack | https://pixelfrog-assets.itch.io/tiny-swords. Licence maison : Feel free to use this asset pack in both personal and commercial projects, modifying the assets as needed. Crediting is not required, but it helps and is always welcome. You may not redistribute, resell, or repackage the assets, even if the files are modified. Pas de bestiaire dans le Free Pack. | Écarté : ce n'est pas du CC0, et l'interdiction de redistribuer vise précisément un dépôt qui embarque les fichiers. |
| Tiny Swords, Enemy Pack | Même page, 22 ennemis dont une chauve-souris géante et un Boompuff d'après le journal de développement. Payant à partir de 15 USD, même licence maison. | Écarté : payant, hors règle. |
| Tiny Swords, upload nommé TS_old version_CC0 Licensed | Téléchargé et ouvert. Update 010 du 3 janvier 2024, 2,6 Mo, 64 px de grille. Contient chevaliers, gobelins torche, TNT et tonneau, mouton, décors, bannières, boutons et explosions. Aucun fichier de licence dans l'archive, seul le nom de l'upload porte la mention CC0. | Non retenu : preuve de licence trop mince et aucun crapaud, gelée, rocailleux ni troll. À utiliser seulement après confirmation écrite de Pixel Frog. |
| Anokolisa Pixel Crawler Free Pack 2.11 | https://anokolisa.itch.io/free-pixel-art-asset-pack-topdown-tileset-rpg-16x16-sprites. Terms.txt : These arts cannot be sold as a final product, only the author can sell the assets. Autre clause : You can use these assets in creating commercial products. | Écarté : les deux clauses se contredisent pour un jeu, et le pack n'a que squelettes et orcs. |
| Kenmi Cute Fantasy RPG | https://kenmi-art.itch.io/cute-fantasy-rpg. Free Version License : This asset pack can be used in any non-commerical project. | Écarté : version gratuite non commerciale. |
| Shikashi Fantasy Icons Pack | https://shikashipx.itch.io/shikashis-fantasy-icons-pack. Licence maison avec crédit imposé à deux noms, et dérivés de game-icons.net que la page dit en CC BY 4.0 alors que le site dit CC BY 3.0. | Écarté : on prend game-icons.net directement. |
| Wesnoth Frankenpack | https://opengameart.org/content/wesnoth-frankenpack. Licence GPL 2.0, avec griffons. | Écarté : licence virale. |
| Gryphon and Egg Statue, Dragon's Egg | OpenGameArt, CC BY SA 4.0. | Écarté : CC BY SA. |
| Collections LPC | CC BY SA. Aucun griffon trouvé en recherche. | Direction de secours seulement, jamais ouverte. |
| Enemy Eagle, Baby dragon sprites | OpenGameArt, CC BY 3.0. | Acceptable techniquement, non retenu : un seul sprite, style isolé. |
| Kenney Roguelike Characters et Roguelike RPG Pack | Téléchargés. CC0. Personnages 16 px assemblables, décor de ville. | Utiles plus tard pour hérauts et chevaliers PNJ, hors périmètre. |
| Kenney Fantasy UI Borders | Téléchargé. CC0. Cadres blancs au trait, à teinter. | Option de cadre ornemental pour la direction 3. |

## 8. Recommandation

1. Je recommande la direction 3, Rondeval classique, pour l'habillage de la tranche verticale et de la campagne.
2. C'est la seule piste qui livre d'un seul pack, en CC0 pur, griffon, crapaud, gelée, golem, troll, ogre, chauve-souris, boucliers, colonne fissurable, boulet, amulettes et pièces d'or.
3. Ses variantes élites existent déjà sous forme de créatures distinctes, et le second gardien Mâche-Bastion trouve un vrai troll en armure de fer, sans teinte ni bricolage.
4. À 45 px d'écran, le 32 px garde l'ombrage, les yeux et les armures : c'est ce détail qui fait sortir du cheap reproché aux formes Kenney.
5. Le coût est faible : 70 fichiers, 76 Ko, aucune attribution obligatoire hors les sept icônes de nœuds en CC BY 3.0.
6. À valider avec le propriétaire : le héros devient un griffon adulte et non un poussin, et les sept expressions passent par des bulles d'émote, pas par le visage.
7. Limites : aucune animation, ce que l'écrasement du GDD compense, et quatre manques, le hérisson, les tonneaux, le ressort et les éclats de bois, avec secours chiffrés.
8. Si le propriétaire préfère la tendresse comique à l'épique, la direction 1 est la valeur sûre : cohérente, légère, griffon trapu, presque tout couvert. Seul le fond noir de Tiny Creatures demande un détourage.
9. La direction 2 reste une réserve d'animations, pas une base : trop de trous pour le bestiaire et le décor extérieur.
10. Prochaine étape : le propriétaire regarde les trois maquettes sur téléphone, puis on intègre Dodu seul en premier, pour juger l'échelle avant de convertir le reste.

## 9. Notes d'intégration

- Densité à l'écran, dans `manifest.json` : pixelsPerUnit égale pixels source divisés par taille affichée en unités. Direction 3 : un sprite de 32 px affiché à 44,8 px fait 1,10 unité, donc pixelsPerUnit proche de 29. Rocailleux à ×1,55, 49,6 px, 1,22 unité, proche de 26. Boss à ×3, 96 px, 2,36 unités, proche de 13,6. Direction 1 : 16 px affichés à 48 px, 1,18 unité, pixelsPerUnit proche de 13,6.
- Pixel art net : filtrage nearest sur les textures, pas d'antialiasing, arrondi des positions. Pour la direction 3, préférer une échelle entière en pixels d'appareil, soit ×4 à 3 de densité, ce qui donne 42,7 px CSS, et ×3 à 2 de densité, ce qui donne 48 px CSS. Calculer l'échelle comme round de la cible en pixels d'appareil, divisé par la densité.
- Sol et murs : ne pas aligner les tuiles sur l'unité physique de 40,67 px, utiliser un TilingSprite à l'échelle entière du pack, masqué par le rectangle d'arène. Le mur de 14 px est un bandeau, pas une tuile entière : découper la face supérieure de la tuile.
- Sol de la direction 3 : les limestone sont trop contrastés pour lire les corps. Appliquer contraste 0,55, luminosité 0,62 et saturation 0,7, comme dans la maquette.
- Le schéma actuel corps plus yeux plus bouche superposés n'a plus d'objet : un sprite par entité, plus bulles d'émote. Les clés `*-eyes-*` et `*-mouth-*` du manifeste disparaissent, ce qui touche `characterView.ts` et les tests d'actifs. À décider par le Lead.
- Les tuiles Tiny Creatures exigent le détourage du fond noir à l'import.

## 10. Correspondance besoin vers fichier source, direction 3

Racine DCSS : dossier `Dungeon Crawl Stone Soup Full/` de l'archive `Dungeon Crawl Stone Soup Full_0.zip`, téléchargeable à https://opengameart.org/sites/default/files/Dungeon%20Crawl%20Stone%20Soup%20Full_0.zip. Tous les chemins DCSS ci-dessous sont relatifs à cette racine et ont été vérifiés dans l'archive. Racine Kenney UI : `PNG/Double/` de https://kenney.nl/assets/ui-pack-adventure. Racine Emotes : `PNG/Vector/Style 1/` de https://kenney.nl/assets/emotes-pack.

| Besoin | Clé du manifeste | Fichier source | Traitement |
|---|---|---|---|
| Dodu, corps | `dodu-body` | `monster/griffon.png` | affichage 44 à 46 px, une seule image |
| Dodu, visée | remplace `dodu-eyes-aim` | Emotes `emote_circle.png` | bulle au-dessus de la tête |
| Dodu, vol | remplace `dodu-eyes-flight` | Emotes `emote_exclamation.png` | idem |
| Dodu, impact | remplace `dodu-eyes-impact` | Emotes `emote_alert.png` | idem |
| Dodu, fier | remplace `dodu-eyes-happy` | Emotes `emote_star.png` | idem |
| Dodu, inquiet | remplace `dodu-eyes-worried` | Emotes `emote_drop.png` | idem |
| Dodu, sonné | sans équivalent actuel | Emotes `emote_swirl.png` | idem |
| Dodu, touché | remplace `dodu-eyes-hit` | Emotes `emote_stars.png` | idem |
| Crapaud bouffi | `crapaud-body` | `monster/animals/giant_toad.png` | ×1,4 |
| Crapaud élite | variante de `crapaud-body` | `monster/animals/spiny_frog.png` | ×1,4 |
| Gelée de garde-manger | `gelee-body` | `monster/amorphous/azure_jelly_new.png` | ×1,4 |
| Gelée élite | variante de `gelee-body` | `monster/amorphous/jelly.png` | ×1,4 |
| Rocailleux | `rocailleux-body` | `monster/nonliving/stone_golem.png` | ×1,55, rayon 0,6 |
| Rocailleux élite | variante de `rocailleux-body` | `monster/nonliving/iron_golem.png` | ×1,55 |
| Boss Gueule-de-Pierre | `boss-body` | `monster/troll.png`, alternatives `monster/rock_troll.png` et `monster/stone_giant_new.png` | ×3, rayon 1,2 |
| Second gardien Mâche-Bastion | nouvelle clé | `monster/iron_troll.png` | ×3 |
| Ogre Goulafre | nouvelle clé | `monster/ogre_new.png` | ×3 |
| Chauve-souris | nouvelle clé | `monster/animals/giant_bat.png`, plus petite `monster/animals/bat.png` | ×1,4 |
| Hérisson | nouvelle clé | manque. Secours : game-icons.net `caro-asercion/hedgehog.svg`, CC BY 3.0 | rendu 256 px, teinte brune |
| Bouclier sur le corps | nouvelle clé | `item/armor/shields/shield_3_round.png` | posé côté Dodu, à tourner avec l'intention |
| Sol, acte 1 | `prop-floor` | `dungeon/floor/limestone_0.png` à `limestone_7.png` | contraste 0,55, luminosité 0,62, saturation 0,7 |
| Sol, acte 2 | variante de `prop-floor` | `dungeon/floor/grass/grass_0_new.png` et `grass_1_new.png` | idem à ajuster |
| Sol, acte 3 | variante de `prop-floor` | `dungeon/floor/floor_sand_rock_1.png` et `dungeon/floor/grey_dirt_0_new.png` | idem |
| Mur, acte 1 | `prop-wall` | `dungeon/wall/brick_gray_0.png` à `brick_gray_3.png` | bandeau de 14 px |
| Mur, acte 2 | variante de `prop-wall` | `dungeon/wall/marble_wall_1.png` | idem |
| Mur, acte 3 | variante de `prop-wall` | `dungeon/wall/stone_gray_0.png` et `stone_2_gray0.png` | idem |
| Caisse | `prop-crate` | `dungeon/large_box.png` | ×1,3 |
| Tonneau | nouvelle clé | manque. Secours : game-icons.net `delapouite/barrel.svg` | teinte bois |
| Tonneau de poudre | nouvelle clé | manque. Secours : même icône, teinte rouge sombre | idem |
| Barricade | `prop-barricade` | `dungeon/doors/gate_closed_left.png`, `gate_closed_middle.png`, `gate_closed_right.png` | trois tuiles bout à bout, 3 unités |
| Colonne | `prop-column` | `dungeon/statues/crumbled_column.png` | ×1,3 |
| Colonne fissurée puis brisée | nouvelles clés | `dungeon/statues/crumbled_column_3.png` puis `crumbled_column_6.png` | états d'usure |
| Ressort | `prop-spring` | manque. Secours : game-icons.net `delapouite/bouncing-spring.svg` | teinte or |
| Tremplin en bouclier bombé | nouvelle clé | `item/armor/shields/large_shield_1_new.png` | orienté selon la flèche |
| Gouffre | `prop-pit` | `dungeon/traps/trap_shaft.png` | assombri avec liseré, ou aplat arrondi comme la maquette |
| Cible de poussée | `prop-goal` | `dungeon/floor/sigil_circle.png` | à ajuster |
| Cœur de soin | `prop-heart` | inchangé : `public/assets/ui/heart-full.png`, Kenney Platformer Art Deluxe | aucun |
| Œuf de griffon | `prop-egg` | OpenGameArt `egg.png`, 32 × 32 | sans traitement |
| Boulet de pierre | `prop-boulder` | `dungeon/boulder.png` | ×1,3 |
| Débris de pierre | `fx-debris-stone` | `effect/cloud_calc_dust_0.png` à `cloud_calc_dust_3.png` | particules |
| Débris de bois | `fx-debris-wood` | manque. Secours CC0 : Ninja Adventure `FX/Particle/Bamboo.png` | recadrer une image de 16 px |
| Fumée | `fx-smoke` | `effect/cloud_grey_smoke.png` | blanc teinté |
| Étincelle | `fx-spark` | `effect/cloud_magic_trail_0.png` à `cloud_magic_trail_3.png` | teinte or |
| Étoile | `fx-star` | Emotes `emote_stars.png` ou existant | aucun |
| Lueur | `fx-glow` | inchangé | aucun |
| Panneau | `ui-panel` | Kenney UI `panel_brown.png`, découpe 9 parties, bord 24 px | échelle 0,8 |
| Bouton | `ui-button` | Kenney UI `button_brown.png` | aucun |
| Bouton pressé | `ui-button-pressed` | Kenney UI `button_grey.png` | ou brun assombri comme aujourd'hui |
| Cœurs plein et vide | `ui-heart-full`, `ui-heart-empty` | inchangés | aucun |
| Jauge de charge | `ui-charge-on`, `ui-charge-off` | inchangés | aucun |
| Icône frein et pouvoir | `ui-icon-brake`, `ui-icon-power` | inchangés | aucun |
| Nœud combat | nouvelle clé | game-icons.net `lorc/crossed-swords.svg` | rendu 256 px, teinte blanche |
| Nœud élite | nouvelle clé | `lorc/crowned-skull.svg` | teinte corail |
| Nœud événement | nouvelle clé | `lorc/uncertainty.svg` | teinte bleu clair |
| Nœud marchand | nouvelle clé | `delapouite/coins.svg` | teinte or |
| Nœud repos | nouvelle clé | `lorc/campfire.svg` | teinte orange |
| Nœud trésor | nouvelle clé | `skoll/open-treasure-chest.svg` | teinte or clair |
| Nœud boss | nouvelle clé | `delapouite/ogre.svg` | teinte rouge |
| Charmes 1 à 8 | nouvelles clés | `item/amulet/crystal_green.png`, `celtic_yellow.png`, `eye_cyan.png`, `penta_orange.png`, `cameo_blue.png`, `face_1_gold.png`, `stone_2_blue.png`, `ring_cyan.png` | ×1,5 |
| Charmes 9 à 16 | nouvelles clés | `item/amulet/crystal_red.png`, `celtic_red.png`, `eye_magenta.png`, `penta_green.png`, `stone_1_pink.png`, `crystal_white.png`, `stone_3_green.png`, `cameo_orange.png` | ×1,5 |
| Plume d'or | nouvelle clé | `item/gold/gold_pile_10.png`, variante `gold_pile_25.png` | ×1,5 |
| Police de titre | `fonts.title` | Cinzel Bold, `static/Cinzel-Bold.ttf` | OFL, joindre OFL.txt |
| Police de texte | `fonts.text` | Nunito, déjà dans le projet | aucun |

Auteurs des icônes game-icons.net : Lorc pour crossed-swords, crowned-skull, uncertainty, campfire ; Delapouite pour coins, ogre, barrel, spring, bouncing-spring ; Skoll pour open-treasure-chest ; Caro Asercion pour hedgehog.

## 11. Annexe : correspondance de la direction 1, en cas de repli

Archives : Tiny Creatures `Tiles/tile_NNNN.png`, Tiny Dungeon `Tiles/tile_NNNN.png`, Tiny Town `Tiles/tile_NNNN.png`, UI Pixel `Tiles/Large tiles/Thick outline/tile_NNNN.png`. Tout est en 16 × 16, à ×3 sauf les boss à ×6.

| Besoin | Fichier |
|---|---|
| Dodu | Tiny Creatures `tile_0105.png`, fond noir à détourer |
| Poussin plan B | Ninja Adventure `Actor/Animal/Chicken/SpriteSheetWhite.png`, première image, teinte or |
| Crapaud | Tiny Creatures `tile_0148.png` |
| Gelée | Tiny Creatures `tile_0082.png` |
| Rocailleux | Tiny Creatures `tile_0128.png` |
| Boss Gueule-de-Pierre | Tiny Creatures `tile_0043.png` à ×6 |
| Second gardien | Tiny Creatures `tile_0129.png` à ×6, proche seulement |
| Ogre Goulafre | Tiny Creatures `tile_0015.png` à ×6 |
| Chauve-souris | Tiny Creatures `tile_0139.png` |
| Hérisson et ressort | manquent, secours game-icons.net |
| Caisse | Tiny Dungeon `tile_0063.png` et `tile_0075.png` |
| Tonneau | Tiny Town `tile_0130.png` |
| Barricade | Tiny Town `tile_0080.png`, `tile_0081.png`, `tile_0082.png` |
| Colonne | Tiny Dungeon `tile_0064.png` |
| Tremplin et bouclier | Tiny Dungeon `tile_0101.png` |
| Sol acte 1, 2, 3 | Tiny Town `tile_0109.png`, `tile_0001.png`, `tile_0043.png` |
| Mur acte 1, 2, 3 | Tiny Dungeon `tile_0040.png`, Tiny Town `tile_0048.png`, `tile_0072.png` |
| Boulet | Ninja Adventure `Items/Resource/Rock.png` |
| Cœur de soin | Ninja Adventure `Items/Potion/Heart.png` |
| Panneau, boutons, jauge | UI Pixel `tile_0014.png`, `tile_0000.png`, `tile_0001.png`, petites tuiles 0073 et 0069 |
| Cœurs | Ninja Adventure `Ui/Receptacle/Heart.png`, images 4 et 0 |
| Nœuds | Tiny Dungeon 106 et 89, Tiny Creatures 97, 56 et 43, Emotes pixel `emote_question.png`, Ninja Adventure `Items/Object/MoneyBag.png` |
| Seize charmes | Ninja Adventure `Items/` : feather, Hourglass, Dice 6, 8 et 20, quatre gemmes, Anvil, MoneyBag, Gourd, ScrollThunder, Bomb, GoldKey, LifePot |
| Polices | Pixelify Sans Bold et Nunito |
