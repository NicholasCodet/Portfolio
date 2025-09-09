import { fetchJSON } from "../utils/fetch-json.js";

/**
 * Case Studies + Design Explorations (Dribbble)
 * - Section HTML attendue : <section class="section case-studies"><div class="container"></div></section>
 * - Thumbs: /src/... résolus via new URL(..., import.meta.url)
 * - Sous-section Dribbble : fetch via Netlify Function, fallback local shots.json
 */
export async function mountCaseStudies({
  selector = "section.case-studies",
  casesPath = "../../data/case-studies.json",
  eyebrow = "Case studies",
  title = "Making complex products simple, useful and loved",
  casesLimit = 2,
  // Dribbble
  dribbbleFn = "/.netlify/functions/dribbble?limit=10",
  dribbbleUsername = "nicholas_codet",
  fallbackShotsPath = "../../data/shots.json",
  shotsMax = 10,
} = {}) {
  const section = document.querySelector(selector);
  if (!section) return;
  const container = section.querySelector(".container");
  if (!container) return;

  /* ----------------------------- CASE STUDIES ----------------------------- */
  const csUrl = new URL(casesPath, import.meta.url).href;
  const list = await fetchJSON(csUrl);

  const ordered = Array.isArray(list)
    ? list.filter((x) => x.featured).concat(list.filter((x) => !x.featured))
    : [];

  const items = ordered.slice(0, casesLimit);

  const cardsHTML = items
    .map((it) => {
      const link = it.href ? it.href : it.slug ? `/case/${it.slug}.html` : "#";
      const src =
        it.thumbnail && it.thumbnail.startsWith("/src/")
          ? new URL("../../" + it.thumbnail.slice(5), import.meta.url).href
          : it.thumbnail || "";

      return `
      <article class="cs-card">
        <a class="cs-media" href="${link}">
          ${
            src
              ? `<img src="${src}" alt="${escapeHTML(
                  it.title
                )} preview" loading="lazy" decoding="async">`
              : `<div class="cs-media ph" aria-hidden="true"></div>`
          }
        </a>
        <div class="cs-body">
          <h3 class="cs-title"><a href="${link}">${escapeHTML(
        it.title
      )}</a></h3>
          ${
            it.description
              ? `<p class="cs-desc">${escapeHTML(it.description)}</p>`
              : ""
          }
          <p class="cs-cta">
            <a class="link" href="${link}">Read the case study <span aria-hidden="true">↗</span></a>
          </p>
        </div>
      </article>
    `;
    })
    .join("");

  container.innerHTML = `
    <header class="cs-head" aria-labelledby="cs-title">
      <p class="eyebrow">${escapeHTML(eyebrow)}</p>
      <h2 id="cs-title" class="h2">${escapeHTML(title)}</h2>
    </header>
    <div class="cs-grid">
      ${cardsHTML}
    </div>
  `;

  /* ----------------------- DESIGN EXPLORATIONS (Shots) -------------------- */
  // Wrapper sous-section
  const explore = document.createElement("div");
  explore.className = "cs-explore";
  explore.innerHTML = `
    <div class="cs-explore-head">
      <h3 class="h3">Design explorations</h3>
      <a class="btn light" href="https://dribbble.com/${dribbbleUsername}" target="_blank" rel="noopener">
        See more on Dribbble
      </a>
    </div>
    <div class="explore-rail" aria-label="Dribbble shots carousel"></div>
  `;
  container.appendChild(explore);

  // 1) Tente le live via Netlify Function
  let shots = await fetchJSON(dribbbleFn);
  // 2) Fallback local si pas de data
  if (!Array.isArray(shots) || !shots.length) {
    const fbUrl = new URL(fallbackShotsPath, import.meta.url).href;
    shots = (await fetchJSON(fbUrl)) || [];
  }
  // 3) Cap à 10 (max UX)
  if (shots.length > shotsMax) shots = shots.slice(0, shotsMax);

  if (!shots.length) {
    explore.hidden = true;
    return;
  }

  const rail = explore.querySelector(".explore-rail");
  rail.innerHTML = shots
    .map((s) => {
      const url = s.url || "#";
      const src =
        s.image && s.image.startsWith("/src/")
          ? new URL("../../" + s.image.slice(5), import.meta.url).href
          : s.image || "";
      const title = s.title || "Shot";
      return `
      <a class="explore-card" href="${url}" target="_blank" rel="noopener" aria-label="${escapeHTML(
        title
      )}">
        ${
          src
            ? `<img src="${src}" alt="${escapeHTML(
                title
              )}" loading="lazy" decoding="async">`
            : `<div class="explore-ph" aria-hidden="true"></div>`
        }
      </a>
    `;
    })
    .join("");

  function escapeHTML(s = "") {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}
