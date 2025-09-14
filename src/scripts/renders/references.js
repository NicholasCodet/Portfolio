import { fetchJSON } from "../utils/fetch-json.js";

export async function mountReferences({
  selector = "section.references",

  pxPerSec = 20,
  minItems = 5,
} = {}) {
  const section = document.querySelector(selector);
  if (!section) return;

  const container = section.querySelector(".container");
  if (!container) return;

  const dataPath = new URL("../../data/references.json", import.meta.url).href;
  const data = await fetchJSON(dataPath);
  const items = data?.corporates ?? [];
  if (!items.length) {
    section.hidden = true;
    return;
  }

  let rowItems = items.slice();
  while (rowItems.length < minItems) rowItems = rowItems.concat(items);

  const rowHTML = rowItems.map(renderLogo).join("");
  container.innerHTML = `
    <div class="refs-layout">
      <p class="refs-title">Trusted by the world's <br class="break-up"/> most talented brands</p>
      <div class="refs-marquee" role="region" aria-roledescription="carousel" aria-labelledby="refs-title">
        <div class="refs-track">
          <ul class="refs-row" role="list">${rowHTML}</ul>
          <ul class="refs-row" role="list" aria-hidden="true">${rowHTML}</ul>
        </div>
      </div>
    </div>
  `;

  const firstRow = container.querySelector(".refs-row");
  const secondRow = container.querySelector(".refs-row + .refs-row");
  const track = container.querySelector(".refs-track");

  const setAnimationVars = () => {
    const rect = firstRow?.getBoundingClientRect();
    const rowWidth = rect ? rect.width : 0;
    const gap = secondRow
      ? parseFloat(getComputedStyle(secondRow).marginLeft) || 0
      : 0;
    const distance = rowWidth + gap;
    const seconds = Math.max(12, distance / pxPerSec);

    if (!track) return;

    if (track._refsStyleEl) {
      try {
        track._refsStyleEl.remove();
      } catch {}
      track._refsStyleEl = null;
    }

    const name = `refsLoop_${Math.random().toString(36).slice(2)}`;
    const styleEl = document.createElement("style");
    styleEl.textContent = `@keyframes ${name} { from { transform: translateX(0); } to { transform: translateX(-${distance}px); } }`;
    document.head.appendChild(styleEl);
    track._refsStyleEl = styleEl;

    track.style.animationName = name;
    track.style.animationDuration = `${seconds}`.includes("s")
      ? `${seconds}`
      : `${seconds.toFixed(2)}s`;
    track.style.animationTimingFunction = "linear";
    track.style.animationIterationCount = "infinite";
    track.style.animationDirection = "normal";
    track.style.animationFillMode = "none";
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
