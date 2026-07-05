# Spec — Thème Spicetify « IOS26.EDAWARD »

Date : 2026-07-05
Environnement cible : Spicetify 2.44.0, Spotify 1.2.93, Windows 11.

## Objectif

Un thème Spicetify reproduisant le langage visuel « Liquid Glass » d'iOS 26 :
panneaux de verre translucides et flous, éléments flottants détachés des bords,
coins très arrondis, accent bleu iOS, avec un fond dynamique tiré de la
pochette du morceau en cours.

## Décisions validées

| Sujet | Décision |
|---|---|
| Schémas de couleurs | Deux : `dark` et `light` dans `color.ini` |
| Intensité de l'effet verre | Immersif (blur fort partout, reflets, bordures lumineuses) |
| Couleur d'accent | Bleu iOS — `#0A84FF` (dark) / `#007AFF` (light) |
| Structure | Flottante : barre de lecture en îlot, sidebar détachée, arrondis 20–28 px |
| Approche technique | CSS + JS dynamique (fond = pochette floutée) |
| Assets | Générés (grain, reflets) et inlinés en data-URI dans le CSS |

## Fichiers livrés

```
Themes/IOS26.EDAWARD/
├── color.ini    # schémas dark et light
├── user.css     # langage visuel complet
├── theme.js     # fond dynamique pochette
└── docs/…       # spec + plan
```

### color.ini

Deux sections `[dark]` et `[light]` définissant les clés spicetify standard
(`text`, `subtext`, `main`, `sidebar`, `player`, `card`, `shadow`,
`selected-row`, `button`, `button-active`, `button-disabled`, `tab-active`,
`notification`, `notification-error`, `misc`).

- `dark` : fonds quasi noirs (les surfaces réelles deviennent translucides via
  le CSS), texte blanc, accent `0A84FF`.
- `light` : fonds blancs laiteux, texte noir, accent `007AFF`.

Bascule : `spicetify config color_scheme dark` (ou `light`) puis `spicetify apply`.

### user.css

- **Panneaux flottants** : sidebar gauche, vue principale, panneau Now Playing
  et barre de lecture séparés par des marges (~8 px), coins arrondis 20–28 px.
  La barre de lecture devient un **îlot flottant** centré en bas, façon dock iOS.
- **Matériau verre** : `backdrop-filter: blur(…) saturate(…)` sur chaque
  panneau ; fonds semi-transparents pilotés par les variables `--spice-*` en
  RGBA ; bordure 1 px semi-transparente (reflet spéculaire, plus marquée en
  haut) ; ombre portée douce ; grain léger en data-URI SVG.
- **Détails iOS** : boutons/champs en pilules, typographie `system-ui`
  (rendu SF Pro sous Windows via Segoe UI Variable), scrollbars fines
  masquées au repos, cartes arrondies avec survol « lift », menus contextuels
  et popovers en verre.
- Les couleurs viennent exclusivement de `--spice-*`/`--spice-rgb-*` pour que
  les deux schémas fonctionnent sans dupliquer le CSS.

### theme.js

- Attend la disponibilité de l'API `Spicetify` (poll `Spicetify.Player`).
- Injecte un calque fixe plein écran derrière `.Root__top-container`.
- À chaque `songchange`, lit la pochette (`Spicetify.Player.data`), l'affiche
  fortement floutée + assombrie (dark) ou éclaircie (light), avec fondu ~0,8 s.
- Repli : si aucune pochette, dégradé statique bleu nuit (dark) / bleu clair
  (light).

## Hors périmètre

- Pas de dossier d'assets fichiers (tout est en data-URI).
- Pas de snippets Marketplace séparés.
- Pas de refonte des custom apps (Marketplace garde son UI, seuls les
  conteneurs héritent du verre).

## Risques

- Les classes CSS de Spotify changent au fil des versions : cibler en priorité
  les classes stables (`.Root__*`, `.main-*`) et les variables `--spice-*`.
- `backdrop-filter` est supporté par le CEF de Spotify ; prévoir un fond
  RGBA plus opaque en secours si le blur ne s'applique pas.

## Validation

1. `spicetify config current_theme IOS26.EDAWARD color_scheme dark`
2. `spicetify apply`
3. Vérification visuelle : panneaux en verre, îlot de lecture flottant,
   fond pochette dynamique au changement de morceau, bascule `light` OK.
