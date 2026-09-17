# Rapport de livraison — 17 septembre 2026

## Version vérifiée

- Jeu : MINUIT AU MUSÉE, version 1.0.0.
- Commit du jeu testé : `42c36209ecbe6022eba58121bfd90b636fcccca5`.
- [Exécution GitHub Actions réussie](https://github.com/Madec01/GPT/actions/runs/35220583330).
- [Jeu en ligne vérifié](https://madec01.github.io/GPT/).

## Résultats

| Vérification | Résultat |
|---|---|
| Moteur : collision, BFS, vision, capture, leurres, EMP, lasers, victoire | 12 tests réussis |
| Campagne : couverture et résolution des 9 missions sans triche | 10 tests réussis |
| Interface, options, sauvegarde corrompue et audio | 8 tests réussis |
| Chrome, canal officiel installé par Playwright | Parcours navigateur réussi |
| Firefox, version Playwright | Parcours navigateur réussi |
| Microsoft Edge, canal officiel msedge | Parcours navigateur réussi |
| 33 ressources de banque | Licences, empreintes et présence contrôlées |
| 8 fichiers binaires envoyés dans GitHub | Empreintes Git identiques aux fichiers locaux |
| Taille maximale d'un fichier distribué | 754 406 octets |

Chaque navigateur a réellement gagné la première mission par clics, mis le jeu en pause puis repris, déverrouillé la seconde mission, rechargé la sauvegarde, activé le mode test, gagné de nouveau sans modifier les records et utilisé les gadgets de la dernière mission. Aucune erreur JavaScript, réponse HTTP en erreur ou ressource manquante détectée sur ces parcours.

Les neuf missions sont également résolues dans la simulation par les replays conservés dans `docs/solutions.json`. Ceux-ci utilisent uniquement déplacement, attente et gadgets autorisés. Aucun personnage n'est téléporté ; les gardes et lasers restent actifs.

## Rendu et cadence

Inspection visuelle humaine assistée dans Chrome cloud : accueil, briefing, première galerie, dernière galerie avec cônes et lasers, pause, options, mode test et crédits. Correction d'une étiquette coupée par le panneau arrondi du menu.

Les scénarios CI produisent des captures 1366×900 et un accueil mobile 390×844, des traces et un rapport JSON, disponibles dans les artefacts de l'exécution pendant 14 jours.

Échantillon informatif de 60 intervalles requestAnimationFrame pendant la première galerie :

| Navigateur CI | Intervalle médian | Cadence correspondante |
|---|---:|---:|
| Chrome | 16,70 ms | 59,9 fps |
| Firefox | 17,08 ms | 58,5 fps |
| Edge | 16,70 ms | 59,9 fps |

Il s'agit d'un échantillon sur les machines CI, pas d'une garantie de cadence sur tous les ordinateurs, dans chaque galerie ou avec tous les onglets et extensions possibles. La simulation est bornée et indépendante des variations ordinaires de rendu.

## Limites précises

- Les tests navigateur complets jouent la première mission et vérifient les gadgets dans la dernière ; la couverture exhaustive des neuf missions est effectuée sur le moteur par replays.
- Les essais CI tournent sous Linux. Aucun essai manuel sur ordinateur Windows physique ni téléphone physique n'a été effectué.
- Mobile : disposition adaptative et déplacement tactile disponibles ; la cible principale reste l'ordinateur.
- La qualité subjective, la tension et la rejouabilité ont guidé la conception, mais n'ont pas été évaluées par un panel de joueurs externes.
- La sauvegarde reste propre au navigateur et à l'origine de lancement. L'indisponibilité du stockage laisse le jeu fonctionner pour la session.

## Reprise du projet

Commencer par `JOURNAL_DE_BORD.md` et `docs/design.md`. Lancer `npm test` avant toute évolution du moteur ou des niveaux. Le workflow navigateur s'exécute lors des changements de code ; les modifications Markdown seules ne le relancent pas. Les assets gardent leurs licences propres dans `CREDITS.md` et `assets/manifest.json`.
