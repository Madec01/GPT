# MINUIT AU MUSÉE

Un jeu d'infiltration en français, en HTML/CSS/JavaScript. Récupérez les œuvres confisquées par Vesper et échappez aux patrouilles pour les restituer à leurs propriétaires.

## Lancer le jeu

Téléchargez le dépôt (Code → Download ZIP), décompressez-le, puis ouvrez un terminal dans ce dossier :

```sh
python -m http.server 8000
```

Sous Windows, `py -m http.server 8000` convient également. Ouvrez ensuite **http://localhost:8000** dans votre navigateur.

Il faut un serveur statique : l'ouverture directe de `index.html` en `file://` ne permet pas de charger les modules JavaScript. Aucun npm install, aucune compilation, aucun compte ni accès Internet pendant la partie. Toutes les ressources sont incluses.

## Jouer

- **Flèches / ZQSD / WASD** : bouger. Le jeu utilise la position physique des touches.
- **Clic au sol** : suivre un chemin jusqu'à un point. Ce chemin évite les murs, pas les dangers.
- **Maj** : marcher lentement ; la portée de détection des gardes diminue.
- **A en AZERTY / Q en QWERTY / 1 / clic droit** : leurre sonore vers le pointeur, portée limitée. Les gardes proches enquêtent cinq secondes.
- **E / 2** : impulsion EMP ; tous les lasers restent éteints six secondes.
- **Échap / P** : pause. **R** : recommencer la mission.

Approchez les œuvres pour les récupérer. La sortie s'ouvre quand toutes sont récupérées. Les cônes indiquent la vision des gardes ; les murs la bloquent. Une exposition prolongée remplit l'alerte et termine la tentative. Les lasers alternent trois secondes actifs et deux secondes éteints. Les gadgets se renouvellent à chaque mission.

Les neuf missions introduisent progressivement les mécaniques et se terminent par un épilogue. Une réussite suffit à déverrouiller la suite. Les étoiles récompensent : réussite, temps cible, aucune alerte. Il n'y a pas de limite de temps éliminatoire.

## Menus et options

Accueil, continuer, choix des missions, règles, crédits, musique/bruitages séparés, mute et réduction des animations. Sauvegarde automatique locale des meilleures étoiles, temps et options. Elle dépend du navigateur et de l'adresse de lancement.

**Mode test** dans Options : accès aux neuf missions, sans enregistrement de résultats ni déverrouillage de campagne. Le diagnostic facultatif affiche les trajets des gardes, la position du joueur et les images par seconde. Changer de mode ferme la mission en cours.

## Développement et tests

Node.js 20 ou ultérieur suffit pour les tests, sans dépendance externe :

```sh
npm test
```

Les tests couvrent le moteur et les neuf missions complètes avec des replays de commandes normales. Le solveur de validation est dans `scripts/solve-campaign.mjs` ; les preuves sont dans `docs/solutions.json`.

- `js/engine.js` : simulation indépendante du navigateur.
- `js/levels.js` : plans, ressources et narration.
- `js/renderer.js` : rendu Canvas et effets.
- `js/app.js` : menus et orchestration.
- `js/storage.js` : progression et options.
- `js/audio.js` : lectures des enregistrements locaux.
- `docs/design.md` : GDD et validation des parcours.
- `JOURNAL_DE_BORD.md` : décisions, contributions, historique et limites de vérification.

Cible principale : ordinateur, navigateurs modernes Chrome, Firefox et Edge. La disposition s'adapte aux petits écrans et le clic/toucher permet de jouer ; le confort desktop reste prioritaire. Voir le journal pour les navigateurs effectivement vérifiés.

## Ressources et licences

Graphiques Game-icons.net (CC BY 3.0), musiques OpenGameArt (CC0), bruitages Kenney (CC0), polices Google Fonts (OFL). Attribution complète dans [CREDITS.md](CREDITS.md), sources et empreintes dans [assets/manifest.json](assets/manifest.json). Les ressources ont leurs propres licences et restent attribuées à leurs auteurs.

## Déploiement

Le dossier du dépôt est directement compatible avec tout hébergement statique. Pour GitHub Pages, sélectionner la branche `main` et le dossier racine dans **Settings → Pages**, si cette fonctionnalité est activée sur votre compte. Aucun secret, backend ni base de données ne sont nécessaires.
