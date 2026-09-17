# ABYSSE — Le silence répond

Une expédition sous-marine en cinq plongées. À bord du Bathys, explorez les vestiges de Nacre, remorquez des pièces, réveillez ses relais et apprenez à traverser une mer qui écoute. Une histoire complète avec deux épilogues, un rendu 3D et une bande-son enregistrée.

**[Jouer](https://madec01.github.io/GPT/)** · **[Donner un avis](https://madec01.github.io/GPT/evaluation.html)**

## Lancer en local

Téléchargez le dépôt, puis depuis son dossier :

```sh
python3 -m http.server 8000
```

Ouvrez `http://localhost:8000`. Aucun compte, compilation, CDN ou service de jeu nécessaire. Un navigateur récent avec WebGL2 et un clavier sont nécessaires. Le double-clic sur index.html ne convient pas aux modules et aux modèles 3D.

## Commandes

| Action | Commande |
|---|---|
| Piloter | ZQSD / WASD, selon clavier physique, ou flèches |
| Poussée | Maj maintenue |
| Accrocher / détacher / activer | E |
| Découper | F maintenue près du support |
| Sonar | Espace |
| Phare | L |
| Pause | Échap |

Les outils sont introduits au fil des plongées. Le sas répare la coque et recharge les instruments. Le câble transporte une seule charge ; une accélération brusque ou un obstacle peut le décrocher. La découpe conserve son avancement pendant une esquive.

Le sonar révèle les objets et attire la faune. Les chasseurs annoncent leur charge : changez de trajectoire, coupez votre phare ou utilisez un refuge végétal. Une fois les objectifs accomplis, revenez au sas.

## Menus et progression

Accueil, carnet des cinq secteurs, briefings, pause, reprise, redémarrage, bilan, choix final et crédits. Options : musique, bruitages, qualité graphique, réduction des mouvements et mode test. Le mode test ouvre tous les secteurs et rend la coque invincible, sans enregistrer de record.

Progression et options sont locales à ce navigateur. Les secteurs terminés sont rejouables. Quitter une plongée reprend le secteur depuis son début, pas depuis une position intermédiaire. L’ancien jeu possède une sauvegarde distincte.

## Ressources et crédits

- Modèles : Quaternius et Kenney, CC0 ; Poly by Google et M Smith Jonn, CC BY 3.0.
- « Undertow » et « The Long Dark » — Scott Buckley, CC BY 4.0, [www.scottbuckley.com.au](https://www.scottbuckley.com.au/library/). Transcodage OGG ; The Long Dark utilisé en montage bouclé de 285 secondes.
- Effets : Kenney, CC0.
- Manrope et Cormorant Garamond : SIL OFL 1.1.
- Three.js r160 : MIT, copie locale avec licence.

Les attributions par fichier, liens sources, adaptations et preuves de licence sont dans [docs/ABYSSE_ASSETS.md](docs/ABYSSE_ASSETS.md), [docs/ABYSSE_AUDIO.md](docs/ABYSSE_AUDIO.md) et les manifestes `assets/abysse/`. Aucune musique synthétisée par oscillateurs.

## Développement et vérification

```sh
npm test
node scripts/abysse/verify-campaign.mjs
```

La CI exécute aussi les parcours navigateur via Playwright sur Chrome, Firefox et Edge. Les captures, traces et rapports sont conservés dans les artefacts GitHub Actions. Le rapport [docs/ABYSSE_QA.md](docs/ABYSSE_QA.md) précise les résultats effectivement observés et leurs limites.

Code principal : `js/abysse/`, rendu `renderer.js`, règles `simulation.js`, secteurs `levels.js`. [JOURNAL_DE_BORD.md](JOURNAL_DE_BORD.md) conserve les décisions, contributions et problèmes résolus. [CONCEPTS_DE_JEUX.md](CONCEPTS_DE_JEUX.md) garde COLOSSAL, RICOCHET et CONTRETEMPS pour de futures sessions.
