# FRONDE

Jeu tactique mobile en portrait où le héros est le projectile. Dodu, un poussin de griffon trop rond pour voler, se catapulte d'arène en arène ; chaque lancer attaque, esquive et prépare le tour suivant. Les ennemis percutés s'entrechoquent comme des boules de billard.

Version 0.1.0 : socle technique et prototype gris. Un lancer prévisible, identique à chaque rejeu, dans une arène grise.

## Lancer en local

```sh
npm install
npm run dev
```

Vite affiche une adresse locale et une adresse réseau. Ouvrez l'adresse réseau sur un téléphone connecté au même réseau. Le jeu se joue aussi à la souris.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement avec rechargement |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Sert le build de production |
| `npm test` | Tests unitaires Vitest en Node |
| `npm run test:e2e` | Test de fumée Playwright sur viewport mobile |
| `npm run lint` | ESLint, règles de déterminisme comprises |
| `npm run typecheck` | TypeScript strict |
| `npm run check` | Lint, typage et tests |
| `npm run golden:update` | Régénère les rejeux dorés après un changement voulu de la physique |

Pour le test de fumée avec un Chromium déjà installé : `PW_CHROMIUM_PATH=/chemin/vers/chrome npm run test:e2e`.

## Déploiement

Le workflow CI déploie `dist/` sur GitHub Pages à chaque push sur `main`. Le dépôt doit avoir Pages configuré sur la source "GitHub Actions".

## Gouvernance

- **Game design et direction artistique :** le propriétaire du projet est le seul valideur.
- **Architecture et code :** le Lead Game Architect dispose des pleins pouvoirs techniques.
- **Assets :** uniquement des ressources libres de droits aux licences vérifiées, avec crédits complets.
- **Propreté :** tout code mort, fichier obsolète ou asset inutilisé est supprimé immédiatement.

## Documents

| Document | Rôle |
|---|---|
| [docs/GDD.md](docs/GDD.md) | Document de conception validé |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture technique de ce qui existe |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Jalons, phases, critères de sortie |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Historique versionné |
| [docs/BUGS.md](docs/BUGS.md) | Registre des anomalies |
| [docs/BACKLOG.md](docs/BACKLOG.md) | Boîte à idées et concepts en réserve |
| [docs/ASSETS_SURVEY.md](docs/ASSETS_SURVEY.md) | Inventaire des ressources libres vérifiées |
