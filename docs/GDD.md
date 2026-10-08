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
