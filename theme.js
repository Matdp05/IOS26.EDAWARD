// IOS26.EDAWARD — fond dynamique : pochette du morceau en cours, floutée.
(function IOS26Backdrop() {
  if (!(window.Spicetify && Spicetify.Player && Spicetify.Player.data !== undefined)) {
    setTimeout(IOS26Backdrop, 300);
    return;
  }

  const backdrop = document.createElement("div");
  backdrop.id = "ios26-backdrop";
  const layers = [document.createElement("div"), document.createElement("div")];
  for (const layer of layers) {
    layer.className = "layer";
    backdrop.appendChild(layer);
  }
  document.body.prepend(backdrop);

  // Schéma clair : verre plus opaque pour préserver la lisibilité.
  function schemeIsLight() {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue("--spice-rgb-main")
      .split(",")
      .map(Number);
    if (raw.length !== 3 || raw.some(isNaN)) return false;
    return 0.299 * raw[0] + 0.587 * raw[1] + 0.114 * raw[2] > 127;
  }
  document.body.classList.toggle("ios26-light", schemeIsLight());

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
  update();
})();
