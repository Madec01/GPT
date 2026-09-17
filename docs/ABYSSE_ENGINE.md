# Moteur ABYSSE

Contribution du sous-agent moteur, 17 septembre 2026. `js/abysse/simulation.js` ne dépend ni du navigateur ni du moteur graphique. `tests/abysse-simulation.test.mjs` vérifie les risques de gameplay et les états de fin.

## Contrat

`new Simulation(level, {testMode:false})`, `update(dt,input)` en secondes, `drainEvents()` renvoie puis retire les événements. Coordonnées en mètres, origine en haut à gauche. Temps simulé plafonné à 100 ms par appel puis divisé en pas de 1/60 s maximum pour éviter les traversées de parois après suspension d’un onglet. L’application gère pause, sauvegarde, changement de niveau et choix narratif final.

Entrées : `x`, `y` entre -1 et 1 ; `boost` et `cut` maintenus ; `sonar` et `interact` sur front montant ; `light` booléen persistant. `level.tools` limite les outils disponibles. La lumière devrait être manipulée par bascule dans l’interface.

État public : `player` (position, vitesse, coque/énergie sur 100, ids de cargos livrés, `tether` id ou null, projecteur), `entities` (objets), `creatures`, `sonarPulse`, `status` (`playing`, `won`, `lost`), `time`, `delivered`, `requiredDelivered`, `stats`. Getters `tether` (objet), `inRefuge`, `objectivesComplete`.

Événements : `sonar`, `attached`, `detached`, `cutComplete`, `delivered`, `beaconActivated`, `warning`, `charge`, `damage`, `tetherBroken`, `unavailable` (raison `range`, `locked`, `sequence`, `sonar`), `won`, `lost`.

## Règles et arbitrages

- Inertie amortie et diagonales normalisées ; boost énergivore. Masse remorquée réduit la poussée, câble ressort de longueur de repos 3,6 m qui rompt à 14 m. Un cargo ne traverse pas les rochers et ne se téléporte pas au sous-marin.
- Interagir à moins de 7 m accroche/libère une charge ou active une balise. Découpe maintenue près d’une charge verrouillée. Balises aussi activées par sonar à moins de 12 m, dépendances `requires` respectées.
- Sonar : révèle sur 65 m, attire la faune sur 75 m, coût 18, recharge 3,5 s. Énergie récupérée lentement en mer et rapidement au sas ; pas d’impasse définitive par batterie vide.
- Prédateur : patrouille, investigation du dernier bruit, préparation visible de 0,95 s, charge de 1,05 s vers une direction fixée, repos de 2,5 s. Projecteur, boost et découpe augmentent la détection ; végétation masque le joueur. Les créatures respectent les obstacles.
- Collision rapide : dégâts limités ; petites touches sans dégâts. Charge : 24 points. Invulnérabilité de 1,2 s après un impact pour éviter les dégâts répétés dans une même collision. Sas protégé, répare coque et énergie.
- Victoire uniquement après les cargos **requis**, les balises demandées et le retour au sas. Les souvenirs facultatifs n’abrègent pas la mission. Mode test invincible, progression persistante gérée séparément par l’application.

## Vérification

Commande : `node --test tests/abysse-simulation.test.mjs`. Quatorze scénarios indépendants : inertie/frein/diagonales, sonar, découpe, extraction complète, câble rompu, ordre des relais, collisions, esquive d’une charge, refuge/sonar, défaite/test, courant/pause longue, cargo facultatif, introduction des outils, occultation du joueur par les rochers.

Ces tests établissent le fonctionnement des règles ; ils ne certifient ni la qualité visuelle, ni le plaisir, ni l’équilibrage ressenti. Ceux-ci doivent être vérifiés en jouant à la version rendue.

### Campagne réelle

`node scripts/abysse/verify-campaign.mjs` : le navigateur de test de l’agent design a été complété par le moteur avec une esquive perpendiculaire aux charges annoncées et des interruptions de découpe. Les cinq secteurs sont gagnés sans invincibilité, téléportation ou restauration de coque : 61, 113, 82, 160 et 176 secondes simulées, zéro rupture de câble. Le dernier secteur occasionne environ 12 points de collision ; aucune charge animale ne touche cette trajectoire déterministe. Ce pilote connaît la carte et l’état des menaces : ces durées ne sont pas une estimation de première partie.

Correction issue de cette validation : les parois bloquent aussi la détection visuelle des créatures, pour éviter une poursuite injuste à travers une roche. Difficulté et points de dégâts ont été conservés.
