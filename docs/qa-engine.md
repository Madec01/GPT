# Vérification du moteur — 17 septembre 2026

Agent responsable : moteur et simulation.

## Résultat

12 tests unitaires réussis avec Node 24 via `node --test js/engine.test.mjs`.
Ils vérifient : collision des murs, ramassage et mission complète, visibilité bloquée par les murs, capture par observation prolongée, durée/charges EMP, navigation des gardiens attirés par un leurre, gel des états terminaux, récupération de la suspicion à couvert, déclenchement des lasers, portée maximale des leurres, capture en restant sur un laser et publication du rayon de vision accroupi.

## Corrections de la revue

- Un leurre visé est limité à 180 pixels depuis le joueur ; une position non finie est ignorée au profit de la direction de déplacement. Les murs empêchent de lancer à travers eux. Les charges sont consommées une fois par appel réussi.
- La suspicion ne baisse plus quand le joueur est au contact d'un faisceau actif. Les impulsions de 0,6 espacées d'une seconde finissent donc par entraîner une capture si le joueur reste dessus. Quitter le faisceau ou couper son alimentation rétablit la récupération normale.
- `GAMEPLAY` exporte les constantes de portée : leurre 180, vision normale 170, vision accroupie 125, demi-angle 32,5°. `sim.decoyRange`, `sim.guardVisionRange` et `guard.visionRange` sont accessibles au rendu. `player.sneaking` reflète l'entrée courante.

## Contrat de rendu

Le cône dessiné doit utiliser `guard.visionRange ?? sim.guardVisionRange`, un demi-angle de `GAMEPLAY.visionHalfAngle` et être masqué par les mêmes murs que `sim.lineOfSight`. Le fichier de rendu n'était pas encore présent lors de cette revue : le contrat est transmis à la direction pour intégration et vérification visuelle.

## Limites des vérifications

Ces tests ciblent la simulation pure sans DOM. Ils ne prouvent pas à eux seuls la compatibilité navigateur, la lisibilité graphique ou l'équilibrage final des neuf missions, qui relèvent de l'intégration et des parcours QA.
