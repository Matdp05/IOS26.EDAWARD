// IOS26.EDAWARD — fond dynamique + menu de configuration.
(function IOS26() {
  if (
    !(
      window.Spicetify &&
      Spicetify.Player &&
      Spicetify.Player.data !== undefined &&
      Spicetify.Menu &&
      document.body
    )
  ) {
    setTimeout(IOS26, 300);
    return;
  }

  /* ── Palettes (miroir de color.ini) ─────────────────────────────── */
  const SCHEMES = {
    dark: {
      text: "FFFFFF",
      subtext: "B8B8C2",
      main: "0A0A0F",
      sidebar: "15151E",
      player: "15151E",
      card: "1E1E28",
      shadow: "000000",
      "selected-row": "FFFFFF",
      button: "0A84FF",
      "button-active": "0A84FF",
      "button-disabled": "3A3A45",
      "tab-active": "2A2A36",
      notification: "0A84FF",
      "notification-error": "FF453A",
      misc: "8E8E93",
    },
    light: {
      text: "1C1C1E",
      subtext: "6E6E73",
      main: "EDEDF4",
      sidebar: "FBFBFD",
      player: "FBFBFD",
      card: "FFFFFF",
      shadow: "9A9AA5",
      "selected-row": "1C1C1E",
      button: "007AFF",
      "button-active": "007AFF",
      "button-disabled": "C7C7CC",
      "tab-active": "E3E3EA",
      notification: "007AFF",
      "notification-error": "FF3B30",
      misc: "AEAEB2",
    },
  };

  const STORAGE_KEY = "ios26:settings";
  const BLUR = { subtil: "24px", normal: "42px", fort: "64px" };

  const settings = { scheme: "dark", artwork: true, blur: "normal" };
  try {
    Object.assign(settings, JSON.parse(localStorage.getItem(STORAGE_KEY)) || {});
  } catch (_) {}
  if (!SCHEMES[settings.scheme] && settings.scheme !== "auto") settings.scheme = "dark";
  if (!BLUR[settings.blur]) settings.blur = "normal";

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  function hexToRgb(hex) {
    return [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)]
      .map((p) => parseInt(p, 16))
      .join(",");
  }

  const media = window.matchMedia("(prefers-color-scheme: light)");

  function resolvedScheme() {
    if (settings.scheme === "auto") return media.matches ? "light" : "dark";
    return settings.scheme;
  }

  function render() {
    const name = resolvedScheme();
    const palette = SCHEMES[name];
    const root = document.documentElement;
    for (const key of Object.keys(palette)) {
      root.style.setProperty("--spice-" + key, "#" + palette[key]);
      root.style.setProperty("--spice-rgb-" + key, hexToRgb(palette[key]));
    }
    root.style.setProperty("--glass-blur", BLUR[settings.blur]);
    document.body.classList.toggle("ios26-light", name === "light");
    document.body.classList.toggle("ios26-no-art", !settings.artwork);
  }

  media.addEventListener("change", () => {
    if (settings.scheme === "auto") render();
  });

  /* ── Fond dynamique : pochette du morceau en cours, floutée ─────── */
  const backdrop = document.createElement("div");
  backdrop.id = "ios26-backdrop";
  const layers = [document.createElement("div"), document.createElement("div")];
  for (const layer of layers) {
    layer.className = "layer";
    backdrop.appendChild(layer);
  }
  document.body.prepend(backdrop);

  let active = 0;
  let currentUrl = "";

  function artworkUrl() {
    const meta =
      Spicetify.Player.data &&
      Spicetify.Player.data.item &&
      Spicetify.Player.data.item.metadata;
    if (!meta) return "";
    const raw =
      meta.image_xlarge_url || meta.image_large_url || meta.image_url || "";
    return raw.replace("spotify:image:", "https://i.scdn.co/image/");
  }

  function update() {
    const url = artworkUrl();
    if (!url || url === currentUrl) return;
    currentUrl = url;
    const next = 1 - active;
    const img = new Image();
    img.onload = () => {
      layers[next].style.backgroundImage = 'url("' + url + '")';
      layers[next].classList.add("visible");
      layers[active].classList.remove("visible");
      active = next;
    };
    img.src = url;
  }

  Spicetify.Player.addEventListener("songchange", update);

  /* ── Menu de configuration (menu profil → IOS26) ────────────────── */
  const schemeItems = {};
  function pickScheme(name) {
    settings.scheme = name;
    save();
    render();
    for (const key of Object.keys(schemeItems)) {
      schemeItems[key].setState(key === name);
    }
  }
  schemeItems.dark = new Spicetify.Menu.Item("Sombre", settings.scheme === "dark", () =>
    pickScheme("dark")
  );
  schemeItems.light = new Spicetify.Menu.Item("Clair", settings.scheme === "light", () =>
    pickScheme("light")
  );
  schemeItems.auto = new Spicetify.Menu.Item(
    "Auto (système)",
    settings.scheme === "auto",
    () => pickScheme("auto")
  );

  const artworkItem = new Spicetify.Menu.Item(
    "Fond pochette",
    settings.artwork,
    (item) => {
      settings.artwork = !settings.artwork;
      save();
      render();
      item.setState(settings.artwork);
    }
  );

  const blurItems = {};
  function pickBlur(level) {
    settings.blur = level;
    save();
    render();
    for (const key of Object.keys(blurItems)) {
      blurItems[key].setState(key === level);
    }
  }
  blurItems.subtil = new Spicetify.Menu.Item(
    "Flou : subtil",
    settings.blur === "subtil",
    () => pickBlur("subtil")
  );
  blurItems.normal = new Spicetify.Menu.Item(
    "Flou : normal",
    settings.blur === "normal",
    () => pickBlur("normal")
  );
  blurItems.fort = new Spicetify.Menu.Item(
    "Flou : fort",
    settings.blur === "fort",
    () => pickBlur("fort")
  );

  new Spicetify.Menu.SubMenu("IOS26", [
    schemeItems.dark,
    schemeItems.light,
    schemeItems.auto,
    artworkItem,
    blurItems.subtil,
    blurItems.normal,
    blurItems.fort,
  ]).register();

  render();
  update();
})();
