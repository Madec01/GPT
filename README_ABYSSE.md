# ABYSSE

Explorez les vestiges de Nacre à bord du Bathys, un sous-marin de récupération. Vingt ans après sa disparition, la station émet un signal. Cinq plongées vous conduisent d’une boîte noire échouée à un refuge humain entretenu par un organisme lumineux.

## Lancement

Le projet est conçu pour un serveur statique. Depuis sa racine :

```sh
python3 -m http.server 8000
```

Ouvrez ensuite `http://localhost:8000`. Utilisez le menu Commandes du jeu pour les raccourcis exacts de la version installée. Le pilotage accepte les flèches ainsi que ZQSD et WASD.

## Comment jouer

- Approchez les charges pour accrocher un câble, puis rapportez-les au sas. Anticipez les virages : leur poids modifie votre trajectoire.
- Découpez les supports des pièces verrouillées en maintenant l’outil à proximité.
- Activez les relais par interaction ou avec une impulsion sonar proche. Certains doivent être rétablis dans l’ordre.
- Le bruit et le projecteur attirent l’attention de la faune. Les refuges vous aident à interrompre une poursuite.
- Les missions expliquent chaque outil au moment où il devient utile. Les trouvailles facultatives ne remplacent pas l’objectif principal.

L’objectif de chaque plongée est affiché dans le jeu. Une fois les interventions terminées, revenez au sas. La dernière plongée conduit à deux épilogues au choix.

## Documentation

La conception détaillée figure dans [docs/ABYSSE_DESIGN.md](docs/ABYSSE_DESIGN.md). Le journal de reprise, les décisions globales, les sources d’assets et les résultats de validation sont consignés dans [JOURNAL_DE_BORD.md](JOURNAL_DE_BORD.md) et les crédits du projet.

La sauvegarde est locale au navigateur. Le mode test est destiné à explorer les secteurs ; il ne doit pas être confondu avec une progression normale.
