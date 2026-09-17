# ABYSSE — document de conception

Version de production du 17 septembre 2026. Auteur : sous-agent conception, sous la direction de l’agent principal. Les paramètres exécutables font foi dans `js/abysse/levels.js` ; ce document expose leurs intentions sans présenter un temps de jeu estimé comme un résultat mesuré.

## Vision

Un petit sous-marin de récupération suit un signal humain émis par une station disparue depuis vingt ans. Sous la rouille, un organisme lumineux communique avec les chercheurs restés sur place. Le joueur apprend à transporter, écouter et intervenir sans détruire ce qu’il découvre.

Public : amateurs d’exploration et de pilotage accessible avec de vraies contraintes de trajectoire. Sensation recherchée : curiosité, maîtrise d’un engin lourd, tension lisible, puis émerveillement. La difficulté doit venir de décisions spatiales et du bruit produit, avec des reprises rapides ; elle ne repose pas sur une longue traversée vide ni sur un compte à rebours arbitraire.

## Personnages et cohérence

- Le pilote du **Bathys**, interprété par le joueur : professionnel de la récupération, capable d’intervenir là où les navires de surface ne passent plus.
- **ORSA**, opératrice du navire : voix pratique, chaleureuse, qui explique les outils et sécurise les retours.
- **Docteure Sorel**, chercheuse de Nacre : elle a choisi de rester avec huit collègues pour protéger un réseau biologique que l’exploitation minière aurait détruit.
- **Nacre** : à la fois la station et, par extension, l’organisme qui la soutient. Ses pulsations sont une communication. Les prédateurs font partie de cet écosystème et ne sont pas des ennemis à exterminer.

La première boîte noire indique les coordonnées de Sorel ; les relais rendent possible une conversation ; la réserve d’oxygène permet aux humains de survivre ; l’extraction finale délivre l’organisme d’une machine. Chaque action sert donc la révélation suivante.

## Boucle de jeu et mécaniques

Observer un passage → préparer sa trajectoire → approcher un objet ou un relais → intervenir → absorber les conséquences de l’action → rejoindre un abri ou le sas.

1. **Pilotage et remorquage.** Inertie, freinage et cargaison modifient la trajectoire. Un seul objet à la fois ; le câble peut rompre si l’écart devient trop grand. On peut lâcher et reprendre une charge. Le retour chargé change réellement un passage déjà connu.
2. **Découpe et positionnement.** Certaines pièces restent solidaires de leur support. Maintenir la découpe impose de rester proche malgré les courants. Elle crée une fenêtre de vulnérabilité près des chasseurs.
3. **Sonar, lumière et faune.** Le sonar révèle et peut activer un relais proche, mais signale la présence du sous-marin. Le projecteur facilite la lecture tout en exposant davantage. Réduire le bruit, couper la lumière et exploiter les refuges permet d’éviter les poursuivants.
4. **Relais ordonnés.** Des stations intermédiaires doivent être rétablies dans l’ordre. Cela impose une trajectoire et donne un sens spatial à l’écoute du récif.

Pas de tir ni d’arbre de statistiques. Les outils sont introduits par les secteurs. Les cargos optionnels récompensent l’exploration, sans remplacer les pièces indispensables à la mission. Les informations nécessaires au jeu restent lisibles ; la pénombre sert l’atmosphère, elle ne doit pas masquer les commandes.

## Campagne

| Secteur | Objectif principal | Introduction / complication | Révélation |
|---|---|---|---|
| La lisière | Rapporter la boîte noire | Inertie, câble, premiers détours | Une chercheuse est encore en vie |
| La fracture | Découper puis rapporter le régulateur | Découpe, masse, courants | Le récif communique et le bruit compte |
| La chorale | Activer trois relais ordonnés et revenir | Sonar, projecteur, premier chasseur, refuges | La station est liée à un immense organisme |
| Le refuge | Deux relais et une réserve d’oxygène | Objectifs combinés, deux chasseurs | Les neuf chercheurs ont choisi de rester |
| Le cœur de Nacre | Un relais puis extraction du collecteur | Tous les outils, plus grosse cargaison | Le joueur décide du devenir du secret |

Les cinq cartes sont conçues à la main. Leur tracé alterne des obstacles suspendus et des reliefs montant du fond ; les caches sont proches des zones exposées. Aucun niveau ne dépend de couloirs aléatoires. Le secteur 3 évite explicitement la répétition « ramasser un autre objet ».

## Victoire, défaite, progression et rejouabilité

Une mission est terminée lorsque ses cargos requis ont été livrés, ses relais rétablis et que le joueur est revenu au sas. Une coque détruite provoque une défaite et permet de recommencer le secteur. La sauvegarde locale conserve la progression ; le mode test doit autoriser l’accès aux secteurs sans fausser les résultats normaux.

Les objets facultatifs invitent à refaire un secteur et à prendre une trajectoire plus risquée. Une progression utile consiste à transporter plus proprement et à éviter les rencontres, sans obliger à répéter pour acheter des améliorations. L’économie est volontairement absente : les pièces récupérées ont une fonction narrative et matérielle plutôt qu’une valeur de monnaie artificielle.

Deux épilogues sont proposés après l’extraction finale :

- **Ouvrir le réseau** : annoncer Nacre au monde, les scientifiques restent, leur isolement cesse.
- **Protéger le refuge** : effacer les coordonnées publiques et maintenir une liaison privée pour ravitailler les neuf.

Il n’existe pas de choix présenté comme mauvais : les deux respectent les vies sauvées et le consentement des chercheurs.

## Direction et exigences de présentation

Vue latérale avec reliefs et éclairage 3D, gameplay limité à un plan pour conserver un pilotage immédiatement compréhensible. Eau bleu pétrole, halos cyan, touches ambre du Bathys et des installations ; progression vers un cœur violet et or. Le sous-marin doit occuper assez d’écran pour que son orientation, son câble et sa cargaison soient lisibles.

Musique réellement présente pendant les plongées, avec une composition enregistrée distincte de l’ambiance aquatique. Événements accompagnés de sons courts lisibles. Aucun oscillateur musical basique. Les banques, auteurs et licences sont documentés par la production des assets dans les crédits de la version livrée ; cette intention de design ne vaut pas vérification de licence.

Menu d’accueil : sous-marin et monde sous-marin visibles, jouer/continuer, sélection des plongées, options dont volumes séparés et mode test, commandes, crédits. Pause accessible, reprise explicite, redémarrage du secteur, retour accueil. Les tutoriels sont courts et introduits avec les outils concernés.

## Architecture des données

`levels.js` exporte `LEVELS` (également export par défaut) et `ENDINGS`.

Coordonnées en mètres, x positif vers la droite et y positif vers le bas. `bounds` définit le rectangle de navigation ; les obstacles rectangulaires utilisent leur coin supérieur gauche. Les données séparent le gameplay (`objects`, `creatures`, `currents`, `refuges`, `objectives`) et la présentation (`briefing`, `tutorial`, `radio`, `debrief`, `palette`). Les dialogues radio utilisent les événements `start`, `cargoAttached`, `cargoUnlocked`, `beaconActivated`, `complete`.

## Décisions et alternatives écartées

- 17/09/2026 : campagne finie plutôt qu’exploration procédurale. Permet une histoire cohérente et des rencontres composées.
- 17/09/2026 : pilotage planaire plutôt que six degrés de liberté. Permet de maîtriser l’engin sans apprendre une simulation lourde.
- 17/09/2026 : tension acoustique plutôt que combat sous-marin. Renforce l’écoute et évite de contredire la protection de l’écosystème.
- 17/09/2026 : aucun stock d’oxygène permanent à gérer. Le défi vient du transport, des obstacles et de la faune ; les allers-retours imposés par une jauge auraient ajouté une corvée.
- 17/09/2026 : secrets facultatifs plutôt qu’obligation de tout collecter. L’exploration devient un choix.
- 17/09/2026 : deux épilogues plutôt qu’une fin punitive fondée sur des points cachés. Le choix final découle directement de l’histoire.

## Points de contrôle QA

Vérifier la connectivité des passages avec une charge, l’absence d’objets dans les obstacles, l’ordre des relais, le comptage des seuls cargos requis et le déclenchement de la victoire au retour. Vérifier aussi que les refuges interrompent effectivement la poursuite, que le premier niveau ne réclame aucun outil futur et que les fins ne sont montrées qu’après la cinquième mission.

Le plaisir, la beauté et la difficulté ne sont pas démontrés par un test unitaire : ils doivent faire l’objet d’une inspection visuelle et d’un parcours de jeu réel.
