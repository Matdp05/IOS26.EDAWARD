# IOS26.EDAWARD v2 — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter au thème l'accent personnalisable (9 couleurs iOS), le schéma AMOLED, l'option flou désactivé, la transition douce entre schémas, l'overlay adaptatif par luminance de pochette, puis enrichir le README et publier la release v1.0.0.

**Architecture:** Tout le comportement vit dans `theme.js` (IIFE unique, réglages persistés dans `localStorage` sous `ios26:settings`, application des palettes via variables `--spice-*` sur `:root`). `user.css` consomme ces variables plus des classes d'état posées sur `body` (`ios26-light`, `ios26-amoled`, `ios26-no-blur`, `ios26-no-art`, `ios26-theming`). Pas de build, pas de framework de test : chaque tâche est vérifiée par `node --check theme.js` (syntaxe) puis `spicetify apply` + contrôle visuel dans Spotify.

**Tech Stack:** JavaScript vanilla (API Spicetify : `Spicetify.Player`, `Spicetify.PopupModal`, `Spicetify.Topbar.Button`), CSS, `color.ini` Spicetify.

## Global Constraints

- Spec de référence : `docs/superpowers/specs/2026-07-06-v2-personnalisation-design.md`.
- Aucune mention de Claude dans les commits, PR ou fichiers (préférence utilisateur).
- Messages de commit en français, style existant (`feat:`, `fix:`, `docs:`).
- Clé localStorage inchangée : `ios26:settings`. Les anciens réglages sauvegardés doivent rester valides (valeurs inconnues → défauts).
- Libellés UI du panneau en français : « Schéma », « Accent », « Fond pochette », « Flou », options « Sombre / Clair / Auto / AMOLED » et « Désactivé / Subtil / Normal / Fort ».
- `Auto` ne résout que vers sombre/clair, jamais AMOLED.
- Chemins : tout est relatif à `C:\Users\HP\AppData\Roaming\spicetify\Themes\IOS26.EDAWARD`.

---

### Task 1 : Accent personnalisable (9 couleurs iOS)

**Files:**
- Modify: `theme.js` (constantes en tête d'IIFE, `render()`, `openSettings()`)
- Modify: `user.css` (section panneau de configuration, lignes ~64-129)

**Interfaces:**
- Produces: `const ACCENTS` (map nom → `{dark, light}` hex sans `#`), `settings.accent` (string, défaut `"blue"`), fonction `pickAccent(name)`. Task 2 (AMOLED) utilise la variante `dark` des accents ; Task 4 remplacera les appels `render()` des handlers par `smoothRender()`.

- [ ] **Step 1 : Ajouter la palette d'accents et la validation du réglage**

Dans `theme.js`, juste après la constante `BLUR` (ligne 55), ajouter :

```js
  const ACCENTS = {
    red: { dark: "FF453A", light: "FF3B30" },
    orange: { dark: "FF9F0A", light: "FF9500" },
    yellow: { dark: "FFD60A", light: "FFCC00" },
    green: { dark: "30D158", light: "34C759" },
    teal: { dark: "64D2FF", light: "5AC8FA" },
    blue: { dark: "0A84FF", light: "007AFF" },
    indigo: { dark: "5E5CE6", light: "5856D6" },
    purple: { dark: "BF5AF2", light: "AF52DE" },
    pink: { dark: "FF375F", light: "FF2D55" },
  };
```

Modifier la ligne des défauts (`const settings = ...`) pour inclure l'accent :

```js
  const settings = { scheme: "dark", artwork: true, blur: "normal", accent: "blue" };
```

Après la validation existante de `settings.blur` (ligne 62), ajouter :

```js
  if (!ACCENTS[settings.accent]) settings.accent = "blue";
```

- [ ] **Step 2 : Appliquer l'accent dans `render()`**

Dans `render()`, remplacer :

```js
    const name = resolvedScheme();
    const palette = SCHEMES[name];
```

par :

```js
    const name = resolvedScheme();
    const palette = Object.assign({}, SCHEMES[name]);
    const accent = ACCENTS[settings.accent][name === "light" ? "light" : "dark"];
    palette.button = accent;
    palette["button-active"] = accent;
    palette.notification = accent;
```

(La copie via `Object.assign` évite de muter `SCHEMES`.)

- [ ] **Step 3 : Ajouter le handler et la rangée de pastilles**

Dans `theme.js`, à côté de `pickScheme`/`pickBlur` (après la ligne 149), ajouter :

```js
  function pickAccent(name) {
    settings.accent = name;
    save();
    render();
  }
```

Après la fonction `switchRow` (après la ligne 195), ajouter :

```js
  function accentRow() {
    const row = document.createElement("div");
    row.className = "ios26-row";
    const label = document.createElement("span");
    label.className = "ios26-label";
    label.textContent = "Accent";
    const dots = document.createElement("div");
    dots.className = "ios26-accents";
    for (const name of Object.keys(ACCENTS)) {
      const dot = document.createElement("button");
      dot.className = "ios26-dot" + (name === settings.accent ? " active" : "");
      dot.style.setProperty("--dot", "#" + ACCENTS[name].dark);
      dot.setAttribute("aria-label", "Accent " + name);
      dot.onclick = () => {
        pickAccent(name);
        for (const other of dots.querySelectorAll("button")) {
          other.classList.remove("active");
        }
        dot.classList.add("active");
      };
      dots.appendChild(dot);
    }
    row.append(label, dots);
    return row;
  }
```

Dans `openSettings()`, après le `ui.appendChild(segRow("Schéma", ...))`, insérer :

```js
    ui.appendChild(accentRow());
```

- [ ] **Step 4 : Styles CSS des pastilles**

Dans `user.css`, après le bloc `.ios26-switch.on::after` (ligne 129), ajouter :

```css
#ios26-settings .ios26-accents {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
#ios26-settings .ios26-dot {
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  cursor: pointer;
  border-radius: 50% !important;
  background: var(--dot);
  transition: transform 0.15s ease;
}
#ios26-settings .ios26-dot:hover {
  transform: scale(1.15);
}
#ios26-settings .ios26-dot.active {
  box-shadow: 0 0 0 2px var(--spice-card), 0 0 0 4px var(--dot);
}
```

- [ ] **Step 5 : Vérifier la syntaxe**

Run : `node --check theme.js`
Expected : aucune sortie (exit 0). Si `node` est indisponible, vérifier via `Get-Command node` et signaler.

- [ ] **Step 6 : Appliquer et vérifier visuellement**

Run : `spicetify apply`
Vérifier dans Spotify : le panneau IOS26 montre la rangée « Accent » de 9 pastilles ; cliquer une pastille change immédiatement la couleur des boutons/barre de progression ; l'anneau suit la pastille active ; le choix survit à un redémarrage de Spotify.

- [ ] **Step 7 : Commit**

```bash
git add theme.js user.css
git commit -m "feat: couleur d'accent personnalisable (palette iOS)"
```

---

### Task 2 : Schéma AMOLED

**Files:**
- Modify: `theme.js` (`SCHEMES`, validation, `render()`, `openSettings()`)
- Modify: `user.css` (overrides `body.ios26-amoled`)
- Modify: `color.ini` (section `[amoled]` pour parité CLI)

**Interfaces:**
- Consumes: `ACCENTS` (Task 1) — AMOLED utilise la variante `dark` (déjà couvert par `name === "light" ? "light" : "dark"` dans `render()`).
- Produces: `SCHEMES.amoled`, classe `body.ios26-amoled`. Task 5 (overlay) relèvera le plancher d'opacité en AMOLED.

- [ ] **Step 1 : Palette `amoled` dans `SCHEMES`**

Dans `theme.js`, après la palette `light` (dans l'objet `SCHEMES`), ajouter :

```js
    amoled: {
      text: "FFFFFF",
      subtext: "A8A8B0",
      main: "000000",
      sidebar: "000000",
      player: "000000",
      card: "0A0A0A",
      shadow: "000000",
      "selected-row": "FFFFFF",
      button: "0A84FF",
      "button-active": "0A84FF",
      "button-disabled": "2A2A30",
      "tab-active": "1A1A1F",
      notification: "0A84FF",
      "notification-error": "FF453A",
      misc: "8E8E93",
    },
```

La validation existante `if (!SCHEMES[settings.scheme] && settings.scheme !== "auto")` accepte automatiquement `"amoled"` — aucun changement nécessaire.

- [ ] **Step 2 : Classe body et option du sélecteur**

Dans `render()`, après la ligne `document.body.classList.toggle("ios26-light", ...)`, ajouter :

```js
    document.body.classList.toggle("ios26-amoled", name === "amoled");
```

Dans `openSettings()`, ajouter l'option au segRow « Schéma » :

```js
          { label: "AMOLED", value: "amoled" },
```

(après `{ label: "Auto", value: "auto" }`).

`resolvedScheme()` ne change pas : `auto` continue de résoudre vers `light`/`dark` uniquement.

- [ ] **Step 3 : Overrides CSS AMOLED**

Dans `user.css`, après le bloc `body.ios26-light #ios26-backdrop::after` (ligne 26), ajouter :

```css
/* Schéma AMOLED : noir profond, verre plus dense */
body.ios26-amoled {
  --glass-bg: rgba(0, 0, 0, 0.62);
  --glass-bg-strong: rgba(10, 10, 10, 0.76);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-highlight: rgba(255, 255, 255, 0.12);
}
body.ios26-amoled #ios26-backdrop::after {
  background: rgba(0, 0, 0, var(--backdrop-dim, 0.6));
}
```

(`--backdrop-dim` n'existe pas encore — le fallback `0.6` s'applique jusqu'à la Task 5.)

- [ ] **Step 4 : Section `[amoled]` dans `color.ini`**

À la fin de `color.ini`, ajouter :

```ini

[amoled]
text               = FFFFFF
subtext            = A8A8B0
main               = 000000
sidebar            = 000000
player             = 000000
card               = 0A0A0A
shadow             = 000000
selected-row       = FFFFFF
button             = 0A84FF
button-active      = 0A84FF
button-disabled    = 2A2A30
tab-active         = 1A1A1F
notification       = 0A84FF
notification-error = FF453A
misc               = 8E8E93
```

- [ ] **Step 5 : Vérifier**

Run : `node --check theme.js` → exit 0, puis `spicetify apply`.
Vérifier dans Spotify : le sélecteur affiche « Sombre / Clair / Auto / AMOLED » ; en AMOLED, le fond derrière la pochette est noir pur (visible en désactivant « Fond pochette ») ; les panneaux sont nettement plus sombres ; l'accent choisi en Task 1 reste appliqué.

- [ ] **Step 6 : Commit**

```bash
git add theme.js user.css color.ini
git commit -m "feat: schema AMOLED (noir pur)"
```

---

### Task 3 : Flou « Désactivé » (basses perfs)

**Files:**
- Modify: `theme.js` (`BLUR`, `render()`, `openSettings()`)
- Modify: `user.css` (règles `body.ios26-no-blur`)

**Interfaces:**
- Produces: valeur `settings.blur === "off"`, classe `body.ios26-no-blur`.

- [ ] **Step 1 : Valeur `off` dans `BLUR` et classe body**

Dans `theme.js`, modifier la constante `BLUR` :

```js
  const BLUR = { off: "0px", subtil: "24px", normal: "42px", fort: "64px" };
```

(La validation existante `if (!BLUR[settings.blur])` accepte automatiquement `"off"`.)

Dans `render()`, après la ligne `document.body.classList.toggle("ios26-amoled", ...)` :

```js
    document.body.classList.toggle("ios26-no-blur", settings.blur === "off");
```

Dans `openSettings()`, ajouter l'option en tête du segRow « Flou » :

```js
          { label: "Désactivé", value: "off" },
```

(avant `{ label: "Subtil", value: "subtil" }`).

- [ ] **Step 2 : CSS — supprimer le backdrop-filter et opacifier**

Dans `user.css`, après le bloc `body.ios26-amoled #ios26-backdrop::after` (ajouté en Task 2), ajouter :

```css
/* Flou désactivé (basses perfs) : plus aucun backdrop-filter, panneaux
   opacifiés pour rester lisibles. Le flou de la pochette de fond est
   conservé (rendu une seule fois par image, coût négligeable). */
body.ios26-no-blur * {
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
}
body.ios26-no-blur {
  --glass-bg: rgba(var(--spice-rgb-sidebar), 0.92);
  --glass-bg-strong: rgba(var(--spice-rgb-card), 0.95);
}
body.ios26-no-blur #context-menu,
body.ios26-no-blur .main-contextMenu-menu,
body.ios26-no-blur .main-popover,
body.ios26-no-blur .popup,
body.ios26-no-blur .main-dropdown-menu,
body.ios26-no-blur .main-contextMenu-tippy,
body.ios26-no-blur .GenericModal > div {
  background: rgba(var(--spice-rgb-card), 0.96) !important;
}
body.ios26-no-blur .marketplace-header,
body.ios26-no-blur .main-trackList-trackListHeader,
body.ios26-no-blur .main-topBar-container {
  background: rgba(var(--spice-rgb-sidebar), 0.96) !important;
}
body.ios26-no-blur input,
body.ios26-no-blur .x-filterBox-filterInput,
body.ios26-no-blur .main-globalNav-searchInput {
  background: rgba(var(--spice-rgb-card), 0.9) !important;
}
```

- [ ] **Step 3 : Vérifier**

Run : `node --check theme.js` → exit 0, puis `spicetify apply`.
Vérifier dans Spotify : option « Désactivé » présente ; une fois choisie, les panneaux n'ont plus de flou (le fond pochette reste flouté), le texte reste lisible sur les 4 schémas ; menus contextuels et barres sticky quasi opaques.

- [ ] **Step 4 : Commit**

```bash
git add theme.js user.css
git commit -m "feat: option flou desactive pour les basses perfs"
```

---

### Task 4 : Transition douce entre schémas

**Files:**
- Modify: `theme.js` (`smoothRender()`, handlers `pickScheme`/`pickBlur`/`pickAccent`/`toggleArtwork`, listener `media`)
- Modify: `user.css` (règle `body.ios26-theming`)

**Interfaces:**
- Consumes: `pickAccent` (Task 1).
- Produces: `smoothRender()` — tous les changements de réglage passent par elle ; le premier `render()` du démarrage reste direct (pas de fondu à l'ouverture).

- [ ] **Step 1 : `smoothRender()` et bascule des handlers**

Dans `theme.js`, juste après la définition de `render()`, ajouter :

```js
  let themingTimer = 0;
  function smoothRender() {
    document.body.classList.add("ios26-theming");
    render();
    clearTimeout(themingTimer);
    themingTimer = setTimeout(function () {
      document.body.classList.remove("ios26-theming");
    }, 350);
  }
```

Remplacer l'appel `render()` par `smoothRender()` dans : `pickScheme`, `pickBlur`, `pickAccent`, `toggleArtwork`, et dans le listener `media.addEventListener("change", ...)`. L'appel `render()` final du démarrage (avant-dernière ligne de l'IIFE) reste inchangé.

- [ ] **Step 2 : Règle CSS de transition**

Dans `user.css`, après le bloc `body.ios26-no-blur input, ...` (Task 3), ajouter :

```css
/* Transition douce lors d'un changement de schéma/accent : la classe est
   posée ~350ms par theme.js puis retirée (aucun coût permanent). */
body.ios26-theming,
body.ios26-theming * {
  transition: background-color 0.25s ease, background 0.25s ease,
    color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease !important;
}
```

- [ ] **Step 3 : Vérifier**

Run : `node --check theme.js` → exit 0, puis `spicetify apply`.
Vérifier dans Spotify : basculer Sombre ↔ Clair produit un fondu d'environ 250 ms (plus de changement sec) ; changer d'accent fond aussi ; cliquer rapidement plusieurs schémas ne laisse pas la classe collée (vérifier dans DevTools que `ios26-theming` disparaît de `body`).

- [ ] **Step 4 : Commit**

```bash
git add theme.js user.css
git commit -m "feat: transition douce entre schemas et accents"
```

---

### Task 5 : Overlay adaptatif par luminance de pochette

**Files:**
- Modify: `theme.js` (`measureLuminance()`, `backdropDim()`, `update()`, `render()`)
- Modify: `user.css` (`#ios26-backdrop::after` en variable, suppression de l'override light devenu inutile)

**Interfaces:**
- Consumes: classes `ios26-light`/`ios26-amoled` via `resolvedScheme()` ; le bloc AMOLED de Task 2 lit déjà `var(--backdrop-dim, 0.6)`.
- Produces: variable CSS `--backdrop-dim` posée sur `:root` par `render()` et au chargement de chaque pochette.

- [ ] **Step 1 : Fonctions de mesure et de calcul**

Dans `theme.js`, après la définition de `artworkUrl()`, ajouter :

```js
  let artLuminance = null; // 0..1 ; null = inconnue (pas de pochette / échec)

  function measureLuminance(img) {
    try {
      const size = 16;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      }
      return sum / (data.length / 4) / 255;
    } catch (_) {
      return null; // canvas tainted ou indisponible : on garde le défaut
    }
  }

  function backdropDim() {
    const name = resolvedScheme();
    if (artLuminance === null) {
      return name === "light" ? "0.66" : name === "amoled" ? "0.60" : "0.52";
    }
    let dim;
    if (name === "light") {
      // pochette sombre → overlay clair plus opaque
      dim = 0.58 + (1 - artLuminance) * 0.16; // 0,58 → 0,74
    } else if (name === "amoled") {
      dim = 0.55 + artLuminance * 0.23; // 0,55 → 0,78
    } else {
      // pochette claire → overlay sombre plus opaque
      dim = 0.45 + artLuminance * 0.25; // 0,45 → 0,70
    }
    return dim.toFixed(2);
  }
```

- [ ] **Step 2 : Brancher dans `render()` et `update()`**

Dans `render()`, après `root.style.setProperty("--glass-blur", ...)`, ajouter :

```js
    root.style.setProperty("--backdrop-dim", backdropDim());
```

Dans `update()`, modifier le chargement de l'image :

```js
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      artLuminance = measureLuminance(img);
      document.documentElement.style.setProperty("--backdrop-dim", backdropDim());
      layers[next].style.backgroundImage = 'url("' + url + '")';
      layers[next].classList.add("visible");
      layers[active].classList.remove("visible");
      active = next;
    };
    img.onerror = () => {
      artLuminance = null;
      document.documentElement.style.setProperty("--backdrop-dim", backdropDim());
    };
    img.src = url;
```

- [ ] **Step 3 : CSS — overlay piloté par la variable**

Dans `user.css`, remplacer le bloc (ligne 191) :

```css
#ios26-backdrop::after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(var(--spice-rgb-main), 0.52);
}
```

par :

```css
#ios26-backdrop::after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(var(--spice-rgb-main), var(--backdrop-dim, 0.52));
  transition: background 0.8s ease;
}
```

Supprimer le bloc devenu redondant (lignes 24-26, theme.js pose désormais la bonne valeur par schéma) :

```css
body.ios26-light #ios26-backdrop::after {
  background: rgba(var(--spice-rgb-main), 0.66);
}
```

Le bloc AMOLED de Task 2 (`rgba(0, 0, 0, var(--backdrop-dim, 0.6))`) reste tel quel.

- [ ] **Step 4 : Vérifier**

Run : `node --check theme.js` → exit 0, puis `spicetify apply`.
Vérifier dans Spotify (DevTools : `getComputedStyle(document.documentElement).getPropertyValue("--backdrop-dim")`) :
- morceau à pochette claire en schéma sombre → valeur proche de 0,65-0,70, texte lisible ;
- morceau à pochette sombre en schéma sombre → valeur proche de 0,45-0,50, pochette bien visible ;
- schéma clair : logique inversée ;
- morceau sans pochette / erreur réseau → retombe sur 0,52 (ou 0,66/0,60 selon schéma).

- [ ] **Step 5 : Commit**

```bash
git add theme.js user.css
git commit -m "feat: overlay adaptatif selon la luminosite de la pochette"
```

---

### Task 6 : README enrichi

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: l'état final des réglages (Tasks 1-5) pour documenter le panneau.
- Produces: README complet ; les images `docs/assets/screenshot-light.png` et `docs/assets/config-panel.gif` sont référencées mais fournies par l'utilisateur (Task 7).

- [ ] **Step 1 : Relever la version Spicetify**

Run : `spicetify -v` — noter la version exacte pour la section Compatibilité.

- [ ] **Step 2 : Réécrire le README**

Remplacer intégralement `README.md` par (ajuster `X.Y.Z` avec la version relevée) :

````markdown
# IOS26.EDAWARD

Thème Spicetify inspiré du design « Liquid Glass » d'iOS 26 : panneaux de
verre translucides et flottants, îlot de lecture, fond dynamique tiré de la
pochette du morceau en cours et panneau de réglages intégré.

![Aperçu du thème (schéma sombre)](docs/assets/screenshot-dark.png)
![Aperçu du thème (schéma clair)](docs/assets/screenshot-light.png)

## Installation

Le dossier doit se trouver dans `%APPDATA%\spicetify\Themes\IOS26.EDAWARD`.

```
spicetify config current_theme IOS26.EDAWARD
spicetify config color_scheme dark
spicetify apply
```

## Menu de configuration

Clique sur le bouton **IOS26** (icône réglages, près des flèches de
navigation en haut) pour ouvrir le panneau :

![Panneau de configuration](docs/assets/config-panel.gif)

- **Schéma** : Sombre / Clair / Auto (suit Windows) / AMOLED (noir pur,
  pensé pour les écrans OLED) — bascule instantanée avec fondu, sans
  `spicetify apply`
- **Accent** : 9 couleurs système iOS (rouge, orange, jaune, vert,
  sarcelle, bleu, indigo, violet, rose)
- **Fond pochette** : active/désactive le fond dynamique tiré de la
  pochette ; son assombrissement s'adapte automatiquement à la
  luminosité de chaque pochette pour garder le texte lisible
- **Flou** : Désactivé / Subtil / Normal / Fort — « Désactivé » supprime
  tous les effets de verre coûteux (recommandé sur les machines modestes)

Les réglages sont mémorisés entre les sessions.

## Compatibilité

- Spicetify X.Y.Z (version testée), Windows 11
- Mac/Linux : non testés — le thème n'utilise que des API Spicetify
  standard, les retours sont bienvenus

## Schémas (via CLI, optionnel)

- `dark` — verre fumé (défaut)
- `light` — verre givré : `spicetify config color_scheme light && spicetify apply`
- `amoled` — noir pur : `spicetify config color_scheme amoled && spicetify apply`

## Troubleshooting

- **Le thème ne s'applique pas** : vérifier `spicetify config current_theme`
  (doit valoir `IOS26.EDAWARD`), puis relancer `spicetify apply`.
- **Après une mise à jour de Spotify** : Spotify écrase les
  modifications ; relancer `spicetify backup apply`.
- **Le panneau IOS26 n'apparaît pas** : le bouton se charge une fois
  Spotify prêt (2-3 s). Vérifier que `extensions` n'a pas été vidé et que
  `theme.js` est bien présent dans le dossier du thème.
- **Couleurs incohérentes avec une extension** : les extensions qui
  remappent les variables `--spice-*` peuvent entrer en conflit ; tester
  en les désactivant une à une.

## Fichiers

- `color.ini` — palettes (dark / light / amoled)
- `user.css` — matériau verre, disposition flottante, composants
- `theme.js` — fond dynamique, panneau de réglages, overlay adaptatif
````

- [ ] **Step 3 : Commit**

```bash
git add README.md
git commit -m "docs: README v2 (reglages, compatibilite, troubleshooting)"
```

---

### Task 7 : Release v1.0.0 (checkpoint utilisateur pour les captures)

**Files:**
- Create: `docs/assets/screenshot-light.png` (fourni par l'utilisateur)
- Create: `docs/assets/config-panel.gif` (fourni par l'utilisateur)
- Create: zip de release dans le scratchpad (hors dépôt)

**Interfaces:**
- Consumes: état final du dépôt (Tasks 1-6).
- Produces: tag `v1.0.0` + release GitHub avec `IOS26.EDAWARD-v1.0.0.zip` (contenu : `color.ini`, `user.css`, `theme.js`, `README.md`, `manifest.json`, `docs/assets/*`).

- [ ] **Step 1 : CHECKPOINT — demander les captures à l'utilisateur**

Demander : une capture du schéma clair (`docs/assets/screenshot-light.png`) et un GIF du panneau de config (`docs/assets/config-panel.gif`). Attendre qu'il dépose les fichiers dans `docs/assets/`. S'il préfère publier sans, retirer les deux références d'images du README (garder le reste) avant de continuer.

- [ ] **Step 2 : Committer les captures (si fournies)**

```bash
git add docs/assets/screenshot-light.png docs/assets/config-panel.gif
git commit -m "docs: capture du mode clair et demo du panneau"
```

- [ ] **Step 3 : Pousser, taguer**

```bash
git push origin master
git tag v1.0.0
git push origin v1.0.0
```

- [ ] **Step 4 : Construire le zip**

PowerShell (le zip va dans le scratchpad, pas dans le dépôt) :

```powershell
$dest = "$env:LOCALAPPDATA\Temp\claude\IOS26.EDAWARD-v1.0.0"
New-Item -ItemType Directory -Force "$dest\IOS26.EDAWARD\docs\assets"
Copy-Item color.ini,user.css,theme.js,README.md,manifest.json "$dest\IOS26.EDAWARD"
Copy-Item docs\assets\* "$dest\IOS26.EDAWARD\docs\assets"
Compress-Archive -Path "$dest\IOS26.EDAWARD" -DestinationPath "$dest\IOS26.EDAWARD-v1.0.0.zip" -Force
```

- [ ] **Step 5 : Créer la release GitHub**

```bash
gh release create v1.0.0 "<scratchpad>/IOS26.EDAWARD-v1.0.0.zip" \
  --title "IOS26.EDAWARD v1.0.0" \
  --notes "Premier release : theme Liquid Glass iOS 26 pour Spicetify.

- 4 schemas : Sombre, Clair, Auto, AMOLED (noir pur)
- 9 couleurs d'accent iOS
- Fond dynamique avec assombrissement adaptatif selon la pochette
- Option flou desactive pour les basses performances
- Transitions douces entre schemas

Installation : dezipper dans %APPDATA%\\spicetify\\Themes puis
spicetify config current_theme IOS26.EDAWARD && spicetify apply"
```

Expected : URL de la release affichée. Vérifier avec `gh release view v1.0.0`.

- [ ] **Step 6 : Noter l'étape suivante**

Rappeler à l'utilisateur (hors périmètre) : soumission au repo officiel `spicetify/spicetify-themes` via fork + PR depuis son compte.
