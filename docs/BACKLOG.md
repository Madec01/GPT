# Boîte à idées

Dernière mise à jour : 8 octobre 2026. Tout ce qui figure ici attend la validation du propriétaire du projet. Rien n'est engagé.

## FRONDE — après la tranche verticale

Validé dans le principe, à détailler et à planifier au moment venu. Voir la feuille de route, phase 5.

- Boucliers orientés : invulnérables de face, à toucher par un rebond. Livrés en 0.5.2.
- Décor actif : ressorts et explosifs, livrés en 0.5.1. Portails rejetés, surfaces glissantes reportées.
- Coups préparatoires limités à un état visible "fissuré", livrés en 0.5.1.
- Rôles d'ennemis : guérisseur, artificier, bâtisseur, deux par salle maximum. Livrés en 0.5.2.
- Synergies affichées à l'écran de choix de pouvoir.
- Parois à usure progressive, livrées en 0.5.1.
- Contrats secondaires par salle.
- Formes lourde, rebondissante et gluante, puis électricité avec propagation, livrées en 0.5.0.
- Personnages supplémentaires.

## FRONDE — observations du solveur à vérifier en test joueur

Relevées le 8 octobre 2026 par le sous-agent Codeur principal en construisant les six salles. Ce sont des hypothèses, pas des bugs.

- Salle 4A : si un rocailleux meurt avant d'avoir brisé sa barricade, il ne reste plus de projectile et la salle devient une impasse ; seul "recommencer" en sort. Un détecteur d'impasse pourrait réutiliser le solveur.
- Le boss ne bouge pas, donc n'est jamais sonné, et ses zones s'esquivent sans mal : dans les solutions du solveur, Dodu n'est jamais touché. À équilibrer après un vrai test.
- Le crapaud éclate en un seul tir direct à partir d'environ 0,85 de puissance près d'un mur : la nuance "direct blesse, projeté éclate" ne tient qu'à faible puissance.
- Les salles 3 et 4B ont aussi une solution qui n'emploie pas l'élément enseigné ; seul le coup audacieux l'utilise.
- Salle 4A avec la gelée guérisseuse : la solution passe de quatre à six tours, car le rocailleux du milieu se refait soigner. À surveiller en test joueur ; la retirer ou avancer la gelée si la salle paraît longue.
- Le ratio de victoire au premier tour discrimine peu : presque toujours nul. Le nombre de tours et d'évaluations renseigne mieux sur la difficulté.

## FRONDE — observations du sous-agent Assets, à traiter en polish

- Dodu est une boule jaune à visage, sans bec, ailes ni queue de griffonneau : à compléter si un pack libre fournit ces traits, sinon à assumer.
- Les musiques ne bouclent pas proprement : points de boucle ou fondu croisé à prévoir.
- Les 22 sons ont été choisis par nom et analyse spectrale, pas à l'oreille : bumper, tremplin, collant et éclatement du crapaud sont les plus incertains.
- Le gouffre est une tuile sombre étirée sur sa zone : un vrai dessin de trou serait plus lisible.
- Cœurs d'interface en 53 x 45 px, nets jusqu'à 30 px ; une version plus grande existe dans Particle Pack.

## FRONDE — idées non validées

- Défis quotidiens seedés et partage de rejeux, rendus possibles par la physique déterministe.
- Mode entraînement avec rejeu illimité d'une salle.
- Statistiques de fin de run : combos, rebonds, salles sans dégât.

## Concepts de jeu en réserve

Conservés à la demande du propriétaire lors de la session du 17 septembre 2026. Aucun développement engagé. Un jeu de course a été explicitement refusé et ne doit pas être proposé. RICOCHET a été absorbé par FRONDE comme source d'inspiration et ne figure plus ici.

### COLOSSAL

**Histoire.** Une créature géante découvre qu'une ville tire son énergie d'un autre organisme emprisonné sous ses fondations. Elle doit briser les dispositifs d'extraction pour le libérer.

**Gameplay.** Détruire avec intention : saisir et projeter véhicules et éléments du décor, provoquer des effondrements utiles, ouvrir des accès. Alterner puissance, gestion de l'énergie et exposition aux défenses. Varier les situations : intercepter un convoi, rompre des ancrages, déjouer un siège.

**Identité et point de vigilance.** Ville miniature en 3D, sensation de masse, destruction spectaculaire et lisible. Risque technique et artistique élevé : détruire un seul bâtiment doit être satisfaisant avant de produire une campagne.

### CONTRETEMPS

**Histoire.** Une technicienne tente de réparer une ville prisonnière de boucles d'accidents. Ses actions passées deviennent des échos avec lesquels elle doit coopérer pour remettre les quartiers en mouvement.

**Gameplay.** Revenir de quelques secondes en arrière et conserver un écho de ses actions. Coordonner leviers, contrepoids, passages et transmission d'objets. Modifier le décor peut perturber une action précédemment enregistrée. Introduire progressivement les règles temporelles ; final autour d'un mécanisme collectif.

**Identité et point de vigilance.** Dioramas 3D, plaisir de compréhension et coopération avec soi-même. Nombre d'échos et durée limités ; pause, lecture ralentie, suppression d'une boucle et repères temporels pour garantir lisibilité et essais rapides.

## Enseignements des projets précédents

- MINUIT AU MUSÉE a reçu une note de 2,3 sur 10 : ennui, missions répétitives, graphismes jugés plats et laids, absence perçue de vraie musique en jeu, difficulté insuffisante, histoire et rejouabilité sans intérêt. Les commandes ont obtenu 8 sur 10.
- La validation technique ne démontre ni le plaisir ni la qualité artistique. Ne jamais présenter un jeu comme publiable sur la seule base de tests automatisés.
- Les anciens concepts rejetés ne doivent pas être recyclés par défaut.

## Contraintes héritées, reconduites pour FRONDE

- Jeu web jouable depuis un hébergement statique.
- Assets de banques libres aux licences vérifiées et crédits complets.
- Musique enregistrée, pas de synthèse basique.
- Au moins trois mécaniques liées, une progression et une fin.
- Accueil soigné dans le thème, options avec mode test, crédits, pause, redémarrage et sauvegarde.
- Journal de projet tenu en français.
