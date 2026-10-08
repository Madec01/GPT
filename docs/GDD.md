# FRONDE, document de conception

Version 0.2, 8 octobre 2026. Le propriétaire du projet est le seul valideur du game design, du lore et de la direction artistique. Le 8 octobre 2026, il a validé l'univers de Rondeval et le héros Dodu, la direction artistique vectorielle de l'ensemble A de l'inventaire des assets, et tous les points marqués [VALIDÉ]. Les variantes B et C du héros sont conservées pour mémoire et ne sont pas retenues.

## 1. Vision

**Pitch.** Tu es le projectile. Une petite créature ronde se catapulte d'arène en arène. Chaque lancer attaque, esquive et prépare le coup suivant. Les ennemis percutés s'entrechoquent comme des boules de billard. Les zones de frappe sont annoncées, à toi de finir le tour hors de danger.

**Ton.** Aventure épique fantasy traitée avec humour. Les enjeux sont grands, le héros est minuscule, et tout le monde le remarque.

**Public.** Joueurs mobiles de tous niveaux, à partir de 10 ans. Une seule main suffit.

**Session.** Trois à dix minutes. Une salle dure moins de deux minutes, la tranche verticale une dizaine.

**Plateforme.** Web mobile en portrait, hébergement statique, tactile. Jouable à la souris avec le même geste.

## 2. Univers et quête [VALIDÉ]

### Le monde : le royaume de Rondeval

Un royaume de montagne en terrasses et forteresses miniatures. Chevaliers pompeux, hérauts bavards, dragons endormis. Son blason est le griffon ; l'Aire royale, au sommet du Pic-Tonnerre, abrite les œufs de la lignée. L'art de la Fronde y est une discipline ancienne : tendre son corps comme une lanière, puis se relâcher d'un coup. Épique dans les mots, comique dans les faits. Décors simples : dalles, herbe rase, rondins, lisibles en vue de dessus ou 3/4.

### La quête

L'ogre Goulafre, roi des cols, a volé les douze œufs de l'Aire royale pour une omelette de banquet. Les griffons adultes, attirés par une fausse alerte, sont loin. Reste un poussin éclos la veille, trop rond pour voler, qui découvre que se faire lancer vaut presque un vol. La tranche verticale couvre le premier avant-poste, jusqu'au troll qui en garde la porte.

### Proposition principale : Dodu, griffonneau de la Garde

Une boule de plumes dorées, un bec, deux ailes trop courtes pour servir, une queue de lion qui trahit ses émotions. Dodu se prend pour un chevalier de la Garde et commente chaque exploit avec un sérieux absolu. Son sprite est un cercle avec un visage : écrasement, étirement et une dizaine d'expressions suffisent.

Les ennemis sont les troupes de Goulafre. Gonflable : un **crapaud bouffi**, sentinelle gonflée d'air, joues brillantes. Collant : une **gelée de garde-manger**, échappée des cuisines de l'ogre, luisante et dégoulinante. Lourd : un **rocailleux**, boule de pierre moussue à la tête grognon. Barricades en palissades de rondins, caisses en tonneaux de banquet, tremplins en boucliers bombés perdus par la Garde. Objets poussables : les œufs de griffon et, chez le boss, des boulets de pierre.

### Variante B, non retenue : Sire Pelote, écuyer hérisson

Un hérisson écuyer de la Forêt des Serments, qui se roule en boule faute de pouvoir tenir une épée, contre les moisissures d'un sorcier. Gonflable : une **vesse-de-loup** à visage. Collant : une **limace de tourbe**. Lourd : un **gland de fer** bougon. Barricades en ronces, caisses en ruches et paniers, tremplins en champignons plats. Objet poussable : un gland géant à ramener au trou de plantation.

### Variante C, non retenue : Braise, dragonnet rouleur

Un bébé dragon des Cendrées, royaume volcanique, qui ne sait ni voler ni cracher le feu, mais sait se mettre en boule, contre les salamandres d'un seigneur rival. Gonflable : une **salamandre-outre** gonflée de vapeur. Collant : un **goudron éveillé**. Lourd : un **scarabée d'obsidienne**. Barricades en basalte, caisses en coffres au trésor, tremplins en dalles runiques. Objet poussable : une perle de dragon.

## 3. Contrôles et lisibilité

**Le geste.** On pose le doigt n'importe où dans l'arène ; le geste est relatif au point de contact, pas au personnage. On tire en arrière : direction opposée au glissement, puissance selon sa longueur, plafonnée au rayon maximal. Dodu s'étire vers l'arrière comme une lanière de fronde. On relâche, il part. Aucun chrono pendant la visée.

**Zone morte et annulation.** Un petit disque autour du point de contact initial n'arme rien. Si le doigt y revient, le geste est annulé et rien n'est dépensé.

**Aide à la visée.** Le segment exact jusqu'au premier contact, mur, caisse, ennemi ou bord de tremplin, rien au-delà. Un marqueur d'arrêt exact si le trajet ne touche aucun corps mobile, sinon un halo "incertain" centré sur l'estimation. Vert hors de toute zone de frappe, orange si le halo chevauche une zone, rouge si l'arrêt est dans une zone. [VALIDÉ] Il change aussi de forme (plein, hachuré, barré) pour rester lisible sans la couleur.

**Trace fantôme.** Après le lancer, le trajet réel reste dessiné en pointillé jusqu'au lancer suivant. Le joueur compare prévu et réel : c'est l'outil d'apprentissage principal.

**Frein.** Un bouton dédié en zone de pouce, une utilisation par salle. Pressé pendant le mouvement, il immobilise Dodu sur place, puis se grise jusqu'à la salle suivante.

**Accélération et ralenti.** Si Dodu roule sans contact utile, le temps accélère par paliers ; un tap n'importe où saute à l'immobilisation, sans changer le résultat. Un ralenti très court souligne le coup sur le dernier ennemi.

## 4. Le tour de jeu

L'ordre est fixe.

1. **Intentions.** Chaque ennemi affiche au sol sa zone de frappe : forme semi-transparente, contour à sa couleur, trait le reliant à sa zone. Les gouffres restent visibles en permanence.
2. **Visée et lancer.** Le joueur vise et relâche. Rien ne bouge avant.
3. **Traversée.** Dodu parcourt la salle, percute, rebondit, s'immobilise ; le frein peut servir une fois. Les zones annoncées ne bougent jamais.
4. **Résolution.** Les dégâts d'impact sont comptés au fil du mouvement, avec le combo sonore. À l'immobilisation, tout est arrêté : morts, décor brisé, jauge de charge, objet poussable, états sonnés.
5. **Attaques.** Chaque ennemi vivant et non sonné frappe dans sa zone. Dodu perd un point de vie par zone qui le contient.
6. **Nouvelles intentions.** Chaque ennemi choisit sa prochaine attaque parmi ses motifs, depuis sa position actuelle. C'est le seul aléatoire du tour, affiché aussitôt.

**Règle du sonné.** Un ennemi déplacé, entre le début du tour et son arrêt, au-delà du seuil de déplacement perd son attaque du tour. Sa zone reste affichée mais se grise, des étoiles tournent au-dessus de lui. Le seuil est le même pour tous : un lourd est difficile à sonner, un gonflable très facile. On ne survit pas en fuyant, on survit en bousculant.

[VALIDÉ] Dans la tranche verticale, les ennemis ne se déplacent jamais d'eux-mêmes. Seules les collisions les font bouger.

## 5. Entités

Tout ce qui bouge est un cercle, tout ce qui est statique est rectangulaire. Les motifs d'attaque sont validés comme point de départ.

**Dodu.** Masse de référence, trois points de vie. Il blesse un ennemi en le touchant au-dessus d'une vitesse minimale ; en dessous, il le pousse seulement. Il ne subit que les zones de frappe et les gouffres.

**Crapaud bouffi (gonflable).** Léger, très rebondissant : Dodu rebondit dessus à pleine vitesse, et lui-même file loin. Deux points de vie, mais il éclate d'un coup contre un mur ou un ennemi au-dessus d'une vitesse seuil. Attaque : un large disque autour de lui. Fantasme : s'en servir de bumper pour atteindre l'inaccessible, puis l'éclater contre un mur.

**Gelée de garde-manger (collant).** La toucher arrête Dodu sur place, quelle que soit sa vitesse ; il repart normalement au lancer suivant. Deux points de vie. Attaque : un petit disque autour d'elle. Touchée doucement, elle garde Dodu dans sa zone ; percutée au-delà du seuil, elle est sonnée et devient un ancrage sûr. Fantasme : viser la gelée exprès pour s'arrêter pile au bon endroit.

**Rocailleux (lourd).** Masse triple, rebond faible : Dodu rebondit dessus sans presque le déplacer, sauf en forme forte. Trois points de vie. Obstacle, bande de billard, et surtout boulet : projeté au-dessus d'une vitesse seuil, il inflige des dégâts doubles et brise les barricades. Attaque : un disque étroit devant lui. Fantasme : le transformer en boulet de canon contre ses copains.

**Objets poussables.** Œufs et boulets de pierre, cercles sans point de vie. L'objectif "pousser" est rempli quand l'objet est entièrement dans la zone cible en fin de résolution. Tombé dans un gouffre, il réapparaît à sa position de départ.

**Caisses et tonneaux.** Statiques, brisés au premier impact au-dessus d'une vitesse seuil. [VALIDÉ] Une caisse sur trois environ libère un cœur de soin, seul butin de la tranche, tiré au hasard.

**Barricades.** Solides. Seuls la forme forte de Dodu ou un rocailleux projeté les brisent, en un coup, en débris plats.

**Tremplins.** Dalles statiques fléchées : tout cercle qui les traverse reçoit une impulsion dans le sens de la flèche. L'aperçu de visée s'arrête à leur bord.

**Zones dangereuses fixes.** Dans la tranche, seulement le gouffre. Un ennemi qui y tombe meurt. [VALIDÉ] Dodu qui y tombe perd un point de vie et réapparaît à son point de lancer. Deux zones fixes au plus par salle, hors zones de frappe.

## 6. Le pouvoir de la tranche verticale [VALIDÉ]

**Forme retenue : la forme lourde, nommée "Pierre".** Trois raisons. Elle se lit au premier regard : Dodu devient gris et dense, donc il pousse plus fort. Elle amplifie le billard, cœur du jeu, sans ajouter de saut ni d'accroche à rendre lisibles. Elle est la clé naturelle du boss à grande masse, qui se bat par l'environnement.

**Version faible, toujours active une fois équipée.** Masse de Dodu multipliée par 1,5, rebond légèrement réduit. Les ennemis percutés partent plus loin, les rocailleux bougent un peu, Dodu s'arrête plus tôt.

**Version forte, alimentée par la charge.** La jauge compte les rebonds sur les murs, trois segments ; les rebonds sur les ennemis ne comptent pas. Jauge pleine, le prochain lancer est un "Boulet de siège" : masse triple, la première barricade ou caisse touchée se brise sans ralentir Dodu, et tout rocailleux percuté part à la vitesse de Dodu. La jauge se vide au lancer. [VALIDÉ] Le déclenchement est automatique dès que la jauge est pleine, et la charge se conserve d'un tour et d'une salle à l'autre.

Sans le pouvoir, la tranche reste finissable en projetant des rocailleux.

## 7. Les six salles de la tranche verticale

Carte linéaire, un seul embranchement après la salle 3. [VALIDÉ] Trois ennemis au plus par salle, et les noms de salles.

### Salle 1 : La Cour basse

Éliminer. Un crapaud, trois caisses, pas de gouffre. Enseigne le geste, la zone morte, le segment de visée et la trace fantôme. Le crapaud est près d'un mur : un tir direct le blesse, un tir qui l'y projette l'éclate. Coup audacieux : viser le mur d'abord et éclater le crapaud sur le rebond. Position : départ.

### Salle 2 : Le Chemin de ronde

Éliminer. Un crapaud, un rocailleux, un gouffre le long du bord droit. Enseigne le sonné et la masse : le crapaud s'envole, le rocailleux ne bouge pas. Coup audacieux : rebondir sur le crapaud pour pousser le rocailleux vers le gouffre. Position : deuxième.

### Salle 3 : La Nurserie volée

Pousser un œuf jusqu'au nid dessiné au sol. Une gelée, un crapaud, un tremplin pointé vers le nid, pas de gouffre. Enseigne le collant comme fin de course et l'objet poussable : la gelée est pile où il faut s'arrêter pour pousser l'œuf dans l'axe. Coup audacieux : sonner la gelée d'un coup fort, puis envoyer l'œuf sur le tremplin en un seul lancer. Position : troisième, l'embranchement s'ouvre à sa sortie.

### Salle 4A : La Forge du rempart, salle risquée

Éliminer. Deux rocailleux, une gelée, un gouffre central, deux barricades coupant la salle en trois couloirs. Enseigne le rocailleux comme boulet : il faut en projeter un à travers une barricade pour atteindre la gelée. Coup audacieux : envoyer un rocailleux à travers la barricade pousser l'autre dans le gouffre. Récompense : le pouvoir Pierre. Position : branche haute.

### Salle 4B : La Citerne, salle de récupération

Pousser un œuf jusqu'au nid. Un crapaud, deux caisses, pas de gouffre. Entrer soigne deux points de vie. Enseigne peu, rassure beaucoup. Coup audacieux : pousser l'œuf en une seule traversée en rebondissant sur le crapaud. Position : branche basse ; les deux branches rejoignent la salle 5.

### Salle 5 : La Herse

Éliminer. Un crapaud, une gelée, un rocailleux, un gouffre dans un angle, une barricade en travers, un tremplin. Enseigne la combinaison complète. Avec Pierre, Dodu traverse la barricade en forme forte ; sans, il contourne par le tremplin ou projette le rocailleux. Coup audacieux : charger la jauge sur les murs, puis un Boulet de siège qui traverse la barricade, percute le rocailleux, qui écrase la gelée contre le crapaud. Position : cinquième.

### Salle 6 : Le Portier [VALIDÉ]

Éliminer le boss. Gueule-de-Pierre, troll de rempart à masse énorme, est adossé à la grande porte entre deux colonnes fissurées. Deux boulets de pierre et un tremplin orienté vers lui occupent l'arène. Aucun autre ennemi. Les deux zones dangereuses sont les zones d'éboulement des colonnes, dessinées au sol dès le début.

Le frapper de face ne fait rien : Dodu rebondit, le troll ricane. En forme forte, un coup direct inflige un point. Les vrais dégâts viennent de l'environnement : un boulet projeté sur lui inflige deux points et reste utilisable ; une colonne frappée par un boulet, ou par Dodu en forme forte, s'effondre et inflige deux points au troll si sa zone le couvre.

Attaques annoncées en cycle fixe : Balayage, un large cône sur une moitié de l'arène ; Pilonnage, trois petits disques alignés vers Dodu ; Souffle, une longue bande droite ; Essoufflé, aucune zone, l'ouverture pour se placer derrière un boulet. Le défi est de placement : finir chaque tour aligné avec un boulet et le troll, hors des zones. Vaincu, il libère la porte et le premier œuf.

## 8. Feedback et personnage

Dodu s'écrase à chaque impact puis reprend sa forme en une courte oscillation. Ses expressions suivent l'état du jeu : yeux plissés et langue sortie pendant la visée, yeux ronds pendant le vol, joues gonflées à l'impact, sourire fier à un arrêt vert, goutte de sueur à un arrêt rouge, étoiles quand il prend un coup. Les ennemis ont trois expressions : normal, sonné, touché.

Chaque impact d'un même lancer joue une note plus haute que la précédente, sur une gamme pentatonique ; le combo repart au lancer suivant. Un arrêt image très bref souligne chaque mort et chaque barricade effondrée. Éclats lumineux courts et petits, dessinés sous les corps mobiles ; débris du décor en sprites plats posés au sol.

Règle absolue : rien ne masque la trajectoire. Particules sous Dodu, chiffres de dégâts hors de son axe, interface jamais sur l'arène, trace fantôme visible par-dessus tout. Aucune vibration haptique. [VALIDÉ] Aucune secousse de caméra non plus.

## 9. Interface portrait

L'arène, plus haute que large, occupe le centre de l'écran ; le geste de visée est reconnu sur toute sa surface.

**Haut de l'écran.** Les trois cœurs de Dodu, le numéro et le nom de la salle, l'icône d'objectif et son compteur, le bouton pause.

**Bas de l'écran.** Deux zones de pouce : le frein dans le coin choisi dans les options, le pouvoir équipé et sa jauge en trois segments dans l'autre. Le tap qui passe l'accélération se fait n'importe où ; aucun autre bouton.

**Écrans.** Accueil dans le thème : Jouer, Options, Crédits. Options : volumes, main dominante, mode test (choix de salle, invincibilité, trajectoire complète, graine de génération). Crédits avec la licence de chaque asset. Pause : reprendre, recommencer, options, quitter. Carte : la ligne de salles, crâne et icône de pouvoir sur la branche risquée, cœur sur l'autre. Fin de salle : tours utilisés, dégâts pris, combo maximal. Choix de pouvoir : une carte Pierre, ses deux versions, un bouton Équiper, prête pour plusieurs cartes. Défaite : recommencer la salle. Sauvegarde automatique à l'entrée de chaque salle.

## 10. Valeurs initiales, à ajuster par le solveur et les tests

Hypothèses de départ, rien n'est mesuré. Longueur en diamètres de Dodu, vitesse en unités par seconde.

| Paramètre | Valeur de départ |
|---|---|
| Taille de l'arène | 9 x 14 unités |
| Masse : Dodu, crapaud, gelée, rocailleux, boulet, œuf | 1 / 0,6 / 1 / 3 / 1,2 / 1,2 |
| Rebond : Dodu, crapaud, gelée, rocailleux, murs | 0,7 / 0,95 / 0 / 0,3 / 0,7 |
| Points de vie : Dodu, crapaud, gelée, rocailleux, boss | 3 / 2 / 2 / 3 / 6 |
| Vitesse de lancer maximale, décélération de roulement | 14 / 6 par seconde carrée |
| Vitesse minimale pour blesser, pour briser une caisse | 3 / 4 |
| Vitesse d'éclatement du crapaud, de boulet pour un rocailleux | 6 / 4 |
| Dégâts d'impact : Dodu, rocailleux boulet | 1 / 2 |
| Seuil de déplacement pour sonner | 1 unité |
| Rebonds de mur pour remplir la charge | 3, chacun à plus de 2 |
| Masse en forme faible, en forme forte | 1,5 / 3 |
| Impulsion d'un tremplin | +6 |
| Rayon des zones : crapaud, gelée, rocailleux | 2 / 1,5 / 1,2 devant lui |
| Boss : masse, dégâts boulet, colonne, coup fort direct | 12 / 2 / 2 / 1 |
| Zone morte, rayon maximal du geste | 24 px / 140 px |
| Accélération automatique | x2 après 1 s sans contact, x3 après 2 s |
| Ralenti du dernier ennemi | 0,4 s à 25 % |
| Arrêt image, écrasement | 40 ms / 80 ms |

## 11. Après la tranche verticale

**Autres formes.** Rebondissante : rebond élevé et un saut court qui franchit un obstacle bas ; en version forte, une rangée entière. Gluante : Dodu s'ancre au premier mur touché et repart de là ; en version forte, il s'accroche aussi aux ennemis. Électricité : les dégâts d'un impact se propagent aux ennemis proches ; en version forte, la chaîne saute d'ennemi en ennemi.

**Options validées pour plus tard, issues de RICOCHET.** Boucliers orientés. Ressorts et explosifs comme décor actif. Coups préparatoires limités à un état visible "fissuré". Rôles d'ennemis, guérisseur, artificier, bâtisseur, deux par salle au maximum. Synergies affichées à l'écran de choix de pouvoir. Parois à usure progressive. Contrats secondaires par salle.

**Reste du concept.** Objectif "rejoindre une sortie", carte à embranchements complète, choix entre plusieurs pouvoirs, nouveaux personnages sans rendre les anciens inutiles, autres boss.

**Rejetés définitivement.** Portails, surfaces glissantes pour l'instant, tirs limités avec ligne à protéger, déplacement libre du décor, duplication du héros.

## 12. Propositions hors cadre

Non validées, non intégrées au reste.

- Les zones de frappe blessent aussi les ennemis projetés dedans.
- La gelée retient aussi les ennemis qui la percutent.
- Un tap sur la jauge pleine conserve la charge pour plus tard.
- L'œuf se fissure s'il est projeté trop vite.
- Les ennemis avancent d'une unité par tour, case d'arrivée affichée.
- Rejouer la trace fantôme au ralenti depuis la pause.

## 13. Notes de relecture du Lead Architect

Relecture du 8 octobre 2026. Ces notes ne changent pas le design, elles préviennent trois malentendus d'implémentation.

- **Le crapaud est un bumper, pas seulement un corps léger.** Avec une masse de 0,6 et un rebond de 0,95, un choc classique fait filer le crapaud mais ne renvoie pas Dodu à pleine vitesse. Le fantasme "s'en servir de bumper" sera porté par une règle de contact dédiée, comme pour la gelée : Dodu repart avec sa vitesse d'arrivée réfléchie, le crapaud est projeté. Les personnalités physiques sont donc des règles de contact nommées, bumper, collant, lourd, et pas uniquement des masses.
- **L'aléatoire des intentions est seedé par salle.** Le choix du motif d'attaque à l'étape 6 est le seul aléatoire du tour. Il sera tiré d'un générateur seedé par salle et par tour, pour que les rejeux dorés et le solveur restent déterministes.
- **Le frein fait partie des entrées enregistrées.** Son instant est mémorisé en numéro de pas de simulation, pas en millisecondes, pour qu'un rejeu avec frein donne le même résultat.
- **Zones de frappe du boss orientées vers Dodu.** Pilonnage et Souffle sont calculés à l'étape 6 depuis la position de Dodu à cet instant, puis figés au sol comme toutes les zones.

## 14. Phase 5, contenu [VALIDÉ par défaut, sauf objection du propriétaire]

Rédigé le 8 octobre 2026 par le Lead avec la casquette Game Designer, à partir des options validées en section 11. Chaque livraison est jouable et passe le solveur.

### 14.1 Pouvoirs : trois formes et un élément

Dodu tient une forme et un élément. La jauge de charge, remplie par trois rebonds de mur, déclenche la version forte de tout ce qui est équipé lors du lancer suivant.

- **Pierre, forme lourde.** Inchangée : masse 1,5, rebond 0,6. Boulet de siège : masse triple, le premier obstacle cède sans ralentir, tout rocailleux percuté part à la vitesse de Dodu.
- **Rebond, forme rebondissante.** Rebond 0,95. Lancé à au moins 4 unités par seconde, Dodu passe par-dessus les caisses sans les toucher. Version forte : il franchit aussi barricades et colonnes. Le fantasme : viser des angles impossibles.
- **Glu, forme gluante.** Dodu s'ancre au premier mur ou boîte touché et s'y arrête net, une fois par lancer. Version forte : il s'accroche aussi au premier ennemi touché, après l'avoir frappé. Le fantasme : finir exactement où on veut, à l'abri derrière un angle.
- **Électricité, élément.** Quand Dodu blesse un ennemi, les autres ennemis à moins de 1,8 unité de l'impact perdent un point. Version forte : la chaîne saute d'ennemi en ennemi, deux sauts au plus, chaque ennemi n'étant frappé qu'une fois.

**Synergies, affichées à l'écran de choix.** Avec Pierre, les arcs du Boulet de siège infligent deux points. Avec Rebond, le rayon des arcs passe à 2,4. Avec Glu, ancré sur un ennemi en version forte, l'arc frappe tout ennemi à moins de 3 unités.

**Où on les trouve.** La Forge du rempart offre le choix d'une forme parmi les trois. La Herse offre l'Électricité. Un joueur passé par la Citerne arrive sans forme ; il peut encore prendre l'Électricité. Les salles 5 et 6 restent finissables avec chaque combinaison, et sans rien, preuve par le solveur.

### 14.2 Décor actif et usure

- **Ressort.** Boîte statique à rebond 1,3 : ce qui la touche repart plus vite qu'il n'est arrivé. Lisible à sa couleur et à ses spires.
- **Explosif.** Caisse marquée qui éclate au premier impact à 4 unités par seconde ou plus : deux points aux ennemis à moins de 2 unités, boss compris, un point à Dodu, poussée vers l'extérieur identique pour tous les corps quelle que soit leur masse, les cassables voisins cèdent. Il déclenche les explosifs voisins en chaîne.
- **Usure et état fissuré.** Barricades et colonnes ont trois points de solidité ; tout impact à 3 unités par seconde ou plus en retire un et laisse une fissure visible. Le projectile et le Boulet de siège les brisent toujours d'un coup. Les caisses cassent toujours au premier coup.

### 14.3 Boucliers et rôles

- **Bouclier orienté.** Un ennemi blindé tourne son bouclier vers Dodu au début du tour, en même temps que son intention. Un impact par l'avant, à moins de 90 degrés du bouclier, ne blesse pas et renvoie Dodu, sans le coller ni déclencher d'arc ; par l'arrière, dégâts normaux. Les projectiles, les explosions et le sonné par déplacement ignorent le bouclier. Le bouclier est dessiné sur le corps.
- **Guérisseur.** À la fin de chaque tour, s'il n'est pas sonné, rend un point à chaque autre ennemi blessé. Sa zone est un petit disque de rayon 1, sans dégâts.
- **Artificier.** Sa zone, un disque de rayon 0,9 devant lui vers Dodu, ne frappe pas : en fin de tour, s'il n'est pas sonné, il y pose un explosif si la place est libre. L'explosif reste jusqu'à ce qu'on le fasse sauter, et l'artificier est lui-même à sa portée : le faire sauter le blesse aussi.
- **Bâtisseur.** Même zone ; en fin de tour, s'il n'est pas sonné, il y pose une caisse si la place est libre.
- Les zones des rôles sont annoncées en ambre, pas en rouge, et l'aide à la visée ne les compte pas comme un danger. Trois poses au plus par genre et par salle, quelles que soient les boîtes déjà présentes ou brisées. Deux rôles au plus par salle. Les rôles se posent sur un crapaud, une gelée ou un rocailleux et gardent sa personnalité physique ; le boss ne porte ni bouclier ni rôle.

### 14.4 Contrats et salles

- **Contrat secondaire.** Chaque salle peut proposer un contrat optionnel affiché sous l'objectif : finir sans dégât, finir en N tours, briser N cassables, sonner N ennemis en un lancer. Réussi, il rend un cœur ou remplit la jauge.
- **Salles supplémentaires.** Un second avant-poste, Les Terrasses, prolonge la campagne après le Portier avec les nouveaux éléments, un embranchement et un second boss. Chaque salle passe le solveur avec les combinaisons de pouvoirs possibles à son entrée.

## 15. Les Terrasses, second avant-poste

Proposée par le Codeur principal et relue par le Lead Architect le 8 octobre 2026. Lore et noms, dont celui du second gardien, à valider par le propriétaire ; livrée en 0.5.3 en attendant. Après le Portier, la route de Goulafre monte vers le Belvédère par des terrasses en gradins : jardins suspendus, ateliers, poudrière du banquet. Sept salles, un embranchement après la troisième, un second boss au bout. Chaque salle apporte ou combine un élément de la section 14 et porte un contrat secondaire, un par salle. Les quatre types de contrat servent, et deux salles consécutives, sur l'une ou l'autre branche, n'en partagent jamais le même.

**Entrée.** Dodu arrive toujours avec l'Électricité, prise à la Herse, et avec une forme parmi aucune, Pierre, Rebond ou Glu, selon la branche du premier embranchement et la forme alors choisie. Le solveur résout donc chaque salle quatre fois, une par entrée, et refuse toute salle que le solveur juge triviale. Les solutions trouvées demandent de deux à cinq tours. Chaque contrat a aussi été cherché à part, par une recherche plus large que celle du solveur : il est atteignable avec les quatre entrées.

### Terrasse 1 : Le Perron

Éliminer. Une gelée et un crapaud sur une corniche de pierre qui part du mur de droite et s'arrête au tiers de la largeur, un rocailleux à gauche, au pied de la corniche, deux ressorts plaqués contre le mur de gauche, pas de gouffre. Enseigne le ressort : ce qui le touche repart plus vite qu'il n'est arrivé, et c'est ce rebond qui donne à Dodu l'élan de contourner la corniche par la gauche et d'atteindre ceux qui s'y abritent. Sans les ressorts, Électricité seule perd un tour et Rebond en perd deux. Contrat : finir en quatre tours au plus, la jauge remplie. Le ressort fait gagner des tours, et la charge récompense celui qui l'a compris. Position : première des Terrasses.

### Terrasse 2 : Le Mur d'écus

Éliminer. Un rocailleux et une gelée à bouclier, un crapaud, deux caisses, pas de gouffre. Enseigne le bouclier orienté : tourné vers Dodu au début du tour, il renvoie tout impact de face, donc on le prend de dos, par un ricochet ou par la bande, ou l'on se sert de ce qui l'ignore, le crapaud projeté et le sonné par déplacement. Sans les boucliers, la salle se joue en trois tours au lieu de quatre, quelle que soit la forme. Contrat : sonner deux ennemis d'un seul lancer, la jauge remplie. Le sonné ignore le bouclier, c'est la leçon complémentaire, et la charge gagnée aide aussitôt. Position : deuxième.

### Terrasse 3 : La Poudrière

Éliminer. Deux rocailleux et un crapaud, chacun à portée d'un tonneau de poudre, trois tonneaux alignés en chaîne au milieu de la salle, une barricade devant eux, pas de gouffre. Les tonneaux sont à moins de deux unités les uns des autres : un seul éclate, les trois partent, et tout ennemi à moins de deux unités d'un tonneau perd deux points. Enseigne l'explosif et la chaîne, et leur prix : celui qui amorce la chaîne au contact y laisse un point de vie. Sans explosifs, Électricité seule et Pierre perdent deux tours, Rebond un. Coup audacieux : amorcer la chaîne d'un seul lancer, ce qui emporte le crapaud et un rocailleux et laisse l'autre à un point. Contrat : briser trois cassables, un cœur rendu. La chaîne le remplit d'un coup, et le cœur rend le point que son amorce a coûté. Position : troisième, l'embranchement s'ouvre à sa sortie.

### Terrasse 4A : L'Infirmerie, salle risquée

Éliminer. Deux rocailleux, une gelée guérisseuse, une barricade qui couvre plus de la moitié de la largeur, un gouffre sur le flanc gauche. Enseigne le guérisseur et l'usure : tant que la guérisseuse n'est ni morte ni sonnée, elle rend un point à chaque blessé en fin de tour, donc un rocailleux entamé se refait ; la barricade se fissure à chaque impact franc et cède au troisième, ou d'un coup sous un rocailleux projeté. Le gouffre sert à Dodu autant qu'aux rocailleux, et il coûte un point à qui s'y trompe. Récompense : le choix d'une forme, comme à la Forge du rempart. Contrat : finir sans dégât, un cœur rendu. Deux zones de rocailleux et un gouffre rendent le contrat exigeant, ce qui convient à la branche risquée. Position : branche haute.

### Terrasse 4B : Le Verger suspendu, salle de récupération

Éliminer. Une gelée bâtisseuse tapie derrière deux pans de barricade qui ne laissent qu'une brèche au milieu, un crapaud, pas de gouffre. Entrer soigne deux points de vie. Enseigne le bâtisseur : chaque tour où elle n'est pas sonnée, la gelée pose une caisse juste derrière la brèche, sur la ligne de tir, donc il faut la sonner ou l'achever vite, sinon le passage se comble. Sans elle, la salle se joue en un tour de moins pour deux entrées sur quatre. Contrat : finir sans dégât, la jauge remplie. Les cœurs sont déjà rendus à l'entrée, alors la récompense va à la charge. Position : branche basse ; les deux branches rejoignent la terrasse 5.

### Terrasse 5 : L'Atelier du Boutefeu

Éliminer. Un rocailleux à bouclier, une gelée artificière, un crapaud, une caisse, pas de gouffre. Enseigne la combinaison du bouclier et du rôle : l'artificière pose un tonneau de poudre qui tombe à portée du rocailleux aussi, et l'explosion ignore le bouclier. Mieux vaut la faire sauter sans la toucher soi-même, par un crapaud projeté par exemple, car l'artificière se trouve elle aussi dans la portée de sa propre poudre. Sans l'artificière, la salle demande un à trois tours de plus ; sans le bouclier, un de moins. Contrat : finir en trois tours au plus, un cœur rendu. Chaque tour perdu peut laisser un tonneau de plus, donc la lenteur encombre la salle. Position : cinquième.

### Terrasse 6 : Le Belvédère

Éliminer le boss. Mâche-Bastion, sénéchal des Terrasses, est adossé à sa balustrade, un tonneau de poudre collé à son flanc droit. Un second tonneau est posé contre la colonne de gauche, un ressort occupe le flanc droit de la salle, un boulet de pierre attend au pied. Aucun autre ennemi, aucun gouffre. Même archétype que Gueule-de-Pierre et mêmes règles : le frapper de face ne fait rien, seuls le Boulet de siège, un boulet ou un rocher projeté, une colonne effondrée ou une explosion le blessent, et l'Électricité l'ignore.

Trois façons de le blesser, de deux points chacune. L'explosion du tonneau voisin, qui souffle tout ce qui est à moins de deux unités. L'éboulement de la colonne, qu'un tonneau voisin brise en explosant, et dont la zone d'éboulement couvre le flanc du troll. Le boulet, que le ressort renvoie plus vite qu'il n'est arrivé et qui peut atteindre le troll ou faire sauter le tonneau à sa place. Un tonneau amorcé au contact coûte un point à Dodu, un boulet non. Sans le ressort, le solveur ne trouve plus de solution avec Électricité seule, Rebond ni Glu ; sans éboulement, Glu perd la salle et les autres gagnent un tour de plus. Contrat : finir sans dégât, un cœur rendu. Les zones du troll et les tonneaux amorcés à la main coûtent un point : le boulet doit faire le travail et Dodu doit finir chaque tour à l'écart. Position : dernière des Terrasses.

**Mâche-Bastion.** Troll de balustrade en armure de marmites et de couvercles volés aux cuisines de Goulafre, sénéchal des Terrasses et gardien de la poudre du banquet, il mâche les remparts pour passer le temps et commente chaque bouchée. Il garde le Belvédère, la dernière terrasse avant les pentes du Pic-Tonnerre, comme Gueule-de-Pierre gardait la grande porte. Il suit le même cycle d'attaques annoncées, Balayage, Pilonnage, Souffle, Essoufflé, et la même lecture du placement : c'est l'arène qui change, avec des armes qu'il a lui-même installées et qui se retournent contre lui. Vaincu, il rend le deuxième œuf.

## 16. Roguelite [VALIDÉ : « Ok go », défaite définitive, trois actes, charmes]

Décision du propriétaire du 8 octobre 2026 : le jeu devient un roguelite. La campagne fixe disparaît au profit d'un run tiré au sort, de choix entre les salles et d'une construction de personnage par charmes. Le cœur de tour est revu pour le rythme. L'habillage est refait en heroic fantasy, voir `docs/ART_DIRECTION.md`.

### 16.1 Le run

- **Départ.** Dodu part nu : trois cœurs, aucune forme, aucun élément, aucun charme, zéro plume d'or. Une graine par run ; tout le run en découle, carte, salles, offres, événements.
- **Trois actes.** La Porte de Goulafre, les Terrasses, l'Aire. Chaque acte est une carte à embranchements de sept étages ; chaque étage offre un à trois nœuds, reliés à ceux de l'étage suivant par des chemins. On entre par n'importe quel nœud du premier étage et l'on ne revient jamais en arrière.
- **Nœuds.** Combat, élite, événement, marchand, repos, trésor, boss. Étage 1 : combat. Étage 6 : repos. Étage 7 : boss. Étages 2 à 5 : tirage pondéré, combat 45, élite 12, événement 18, marchand 10, repos 8, trésor 7, avec au plus un marchand par acte, jamais deux repos voisins, pas d'élite à l'étage 2.
- **Salles.** Les combats, élites et boss tirent une salle dans le vivier de l'acte, sans répétition dans le run. Le vivier est fait de variantes validées par le solveur des salles dessinées à la main, miroirs et échanges d'ennemis, puis, en 0.6.1, d'arènes générées. Une élite joue la salle avec un point de vie de plus par ennemi.
- **Défaite définitive.** À zéro cœur, le run s'arrête : résumé, retour à l'accueil, sauvegarde effacée. Le charme Œuf de secours annule une mort par run.
- **Victoire.** Après le boss du troisième acte : résumé, œufs rendus, retour à l'accueil.

### 16.2 Charmes

Reliques passives, six au plus, trouvées aux élites, aux trésors, chez le marchand, dans certains événements et après les boss. Chaque charme change une règle de la simulation, donc l'aide à la visée et le solveur en tiennent compte.

| Charme | Rareté | Effet |
| --- | --- | --- |
| Bille de verre | commun | Le rebond de Dodu vaut 0,95, quelle que soit sa forme. |
| Plume de plomb | rare | Masse doublée ; les caisses cèdent dès 3 unités par seconde. |
| Grelot | commun | Un ennemi est sonné dès un demi-pas de déplacement. |
| Corde double | rare | Deux lancers par tour ; les ennemis ne frappent qu'après le second. |
| Ricochet d'or | commun | Chaque rebond de mur ajoute un point de dégât au prochain impact. |
| Œuf de secours | rare | Une mort annulée par run : Dodu se relève avec un cœur. |
| Mors de fer | commun | Le premier impact de chaque lancer inflige un point de plus. |
| Bouclier de plumes | commun | Le premier coup reçu dans chaque salle est annulé. |
| Aimant à plumes | commun | Plumes d'or gagnées augmentées de moitié. |
| Pierre à aiguiser | commun | Projectiles, rocailleux et rochers, un point de plus. |
| Tambour de guerre | rare | La jauge se remplit en deux rebonds au lieu de trois. |
| Lanterne | commun | L'aide à la visée montre le trajet complet. |

### 16.3 Plumes d'or, marchand, repos, trésor, événements

- **Plumes.** Vingt par combat plus cinq par ennemi, trente par élite en plus, dix par contrat rempli, parfois dans les caisses.
- **Marchand.** Trois charmes à prix fixe, cinquante pour un commun, quatre-vingts pour un rare ; un soin d'un cœur pour trente ; une relance de l'offre pour vingt, une fois.
- **Repos.** Soigner deux cœurs, ou Veiller : un cœur maximum de plus, jusqu'à six.
- **Trésor.** Un charme au choix parmi trois.
- **Événements.** Huit scènes courtes à deux choix, issues déterminées par la graine : l'Autel du griffon, la Fontaine, le Piège à plumes, la Forge abandonnée, le Dragon endormi, le Vieux chevalier, le Héraut bavard, le Marchand ambulant. Un événement ne revient pas dans le même run.
- **Formes et élément.** Le boss du premier acte offre une forme au choix, celui du second l'Électricité ; la Forge abandonnée permet de changer de forme.

### 16.4 Cœur de tour revu

- **Une élimination fait rejouer.** Si un ennemi meurt pendant un lancer, les ennemis ne frappent pas et Dodu relance aussitôt, zones inchangées. Une série s'affiche.
- **Les ennemis bougent.** Au début de chaque tour sauf le premier, chaque ennemi non sonné avance vers Dodu : crapaud 1,5, gelée 0,6, rocailleux 0,3, boss immobile. Le pas s'arrête devant un mur, une boîte, un corps ou un gouffre. L'intention est calculée après le pas.
- **Tempo.** Accélération automatique dès une demi-seconde sans contact ; arrêt anticipé quand Dodu roule à moins d'une unité par seconde loin de tout.
- **Punch.** Secousse de caméra sur les gros impacts, flash sur les explosions, compteur de série, étoiles de salle.

### 16.5 Méta-progression, prévue en 0.6.2

Carnet des runs, meilleur acte atteint, run quotidien à graine partagée, déblocages par œufs rendus : charmes, formes de départ, ennemis, mutateurs.
