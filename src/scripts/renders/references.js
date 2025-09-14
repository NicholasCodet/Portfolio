import { fetchJSON } from "../utils/fetch-json.js";

export async function mountReferences({
  selector = "section.references",
  title = "Trusted by the world's most talented brands",
  pxPerSec = 20,
  minItems = 6,
} = {}) {
  const section = document.querySelector(selector);
  if (!section) return;

  const container = section.querySelector(".container");
  if (!container) return;

  // 1) Charger le JSON
  const dataUrl = new URL("../../data/references.json", import.meta.url).href;
  const data = await fetchJSON(dataUrl);
  const items = data?.corporates ?? [];
  if (!items.length) {
    section.hidden = true;
    return;
  }

  // 2) Assurer une densité minimale
  let rowItems = items.slice();
  while (rowItems.length < minItems) rowItems = rowItems.concat(items);

  // 3) Générer le HTML
  const rowHTML = rowItems.map(renderLogo).join("");
  container.innerHTML = `
    <div class="refs-grid">
      <h2 class="refs-title" id="refs-title">${title}</h2>
      <div class="refs-marquee" role="region" aria-roledescription="carousel" aria-labelledby="refs-title">
        <div class="refs-track">
          <ul class="refs-row" role="list">${rowHTML}</ul>
          <ul class="refs-row" role="list" aria-hidden="true">${rowHTML}</ul>
        </div>
      </div>
    </div>
  `;

  // 4) Mesure → variables CSS (durée, largeur)
  const marquee = container.querySelector(".refs-marquee");
  const firstRow = container.querySelector(".refs-row");

  const setAnimationVars = () => {
    const rowWidth = firstRow?.scrollWidth || 0;
    const seconds = Math.max(12, rowWidth / pxPerSec);
    marquee.style.setProperty("--roww", `${rowWidth}px`);
    marquee.style.setProperty("--duration", `${seconds.toFixed(2)}s`);
  };

  setAnimationVars();
  window.addEventListener("load", setAnimationVars, { once: true });
  window.addEventListener("resize", setAnimationVars);

  // ---- helpers ----
  function renderLogo(item) {
    const src = resolveLogoUrl(item);
    const alt = item.alt || item.name || "Logo";
    const w = Number(item.width) || 160;
    const h = Number(item.height) || Math.round(w * 0.24);

    return `
      <li class="refs-logo" role="listitem">
        <img src="${src}" alt="${alt}" width="${w}" height="${h}" loading="lazy" decoding="async">
      </li>`;
  }

  // Images dans /src/assets/images/logos/
  function resolveLogoUrl(item) {
    if (item.file) {
      // JSON donne juste "file": "bnp-paribas.svg"
      return new URL(`../../assets/images/logos/${item.file}`, import.meta.url)
        .href;
    }
    if (item.src && item.src.startsWith("/src/")) {
      // JSON donne "/src/assets/images/logos/bnp-paribas.svg"
      const rel = item.src.replace(/^\/src\//, "");
      return new URL(`../../${rel}`, import.meta.url).href;
    }
    return item.src || "";
  }
}
