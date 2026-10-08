# Journal des modifications

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/). Versionnage sémantique.

## [0.0.0] — 2026-10-08 — Réinitialisation

### Supprimé

- Le jeu ABYSSE dans son intégralité : pages HTML, feuilles de style, modules JavaScript, simulation, rendu three.js, niveaux, audio, sauvegarde, page d'évaluation.
- Les ressources d'ABYSSE : 17 modèles GLB, 15 fichiers audio OGG, polices, icônes SVG, manifestes et fichiers de licence associés.
- La bibliothèque three.js vendorisée et ses utilitaires.
- Les tests, scripts de vérification de campagne, scripts de parcours navigateur et le workflow d'intégration continue.
- Les résidus du jeu antérieur MINUIT AU MUSÉE, qui n'étaient plus chargés par aucune page.
- La documentation de conception, de moteur, d'assets, d'audio et d'assurance qualité d'ABYSSE, ainsi que le journal de bord et les crédits.
- Le `package.json` d'ABYSSE et le marqueur `.nojekyll`. Le site GitHub Pages associé ne sert plus rien.

### Conservé

- L'historique git complet. Le dernier commit contenant ABYSSE est `8f47d94`.
- Les trois concepts de jeu en réserve, les retours utilisateur et les contraintes héritées, déplacés dans [BACKLOG.md](BACKLOG.md).

### Ajouté

- README de réinitialisation décrivant la gouvernance et la stack cible.
- Les quatre documents de suivi : feuille de route, journal des modifications, registre des bugs, boîte à idées.
- Un `.gitignore` adapté à un projet Vite et TypeScript.
