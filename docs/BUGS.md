# Registre des bugs

Dernière mise à jour : 8 octobre 2026, version 0.4.0.

| Id | Statut | Sévérité | Description | Reproduction | Résolution |
|---|---|---|---|---|---|
| B-002 | résolu | majeur | Aucun son sur le téléphone du propriétaire, Android, alors que Chromium en test joue tout. | v0.3.0, premier lancer sur téléphone. | v0.3.1 et v0.3.2 : déverrouillage synchrone dans le geste, à l'appui et au relâché, session de lecture déclarée, reprise du contexte à chaque geste. Constaté réglé par le propriétaire ; cause exacte non isolée, diagnostic `?diag=1` ajouté pour la prochaine fois. |
| B-001 | résolu | cosmétique | Le halo d'incertitude du marqueur d'arrêt déborde hors de l'arène quand l'arrêt prévu est contre un mur. | v0.1.0, viser vers un mur avec un contact mobile sur le trajet. | v0.3.0 : masque rectangulaire de l'arène sur les couches d'aperçu, de zones et de particules. |

## Conventions

- **Statut :** ouvert, reproduit, en cours, résolu, non reproductible, refusé.
- **Sévérité :** bloquant, majeur, mineur, cosmétique.
- Chaque bug résolu renvoie vers le commit ou la version du journal des modifications qui le corrige.
