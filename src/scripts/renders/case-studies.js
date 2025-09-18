import { escape } from "../utils/dom.js";
import { fetchJSON } from "../utils/fetch-json.js";
import { inlineSpriteOnce } from "../utils/svg.js";

export async function mountCaseStudies({
  selector = "section.case-studies",
  casesPath = "../../data/case-studies.json",

  spritePath = "../../assets/icons/sprite.svg",
  dribbbleProfile = "nicholascodet",
  shotsPath = "../../data/shots.json",

  caseLimit = 4,
  shotsLimit = 10,
} = {}) {
  const section = document.querySelector(selector);
  if (!section) return;
  const container = section.querySelector(".container");
  if (!container) return;

  const spriteUrl = new URL(spritePath, import.meta.url).href;
  await inlineSpriteOnce(spriteUrl);

  const csUrl = new URL(casesPath, import.meta.url).href;
  const list = await fetchJSON(csUrl);

  const items = Array.isArray(list)
    ? list.filter((x) => x && x.featured === true).slice(0, caseLimit)
    : [];

  const cardsHTML = items
    .map((it) => {
      const link = it.href ? it.href : it.slug ? `/case/${it.slug}.html` : "#";
      const src =
        it.thumbnail && it.thumbnail.startsWith("/src/")
          ? new URL("../../" + it.thumbnail.slice(5), import.meta.url).href
          : it.thumbnail || "";

      return `
      <a href="${link}">
        <article class="cs-card">
            ${
              src
                ? `<img src="${src}" alt="${escape(it.title)} 
                  preview" loading="lazy" decoding="async">`
                : `<div class="img-placeholder" aria-hidden="true"></div>`
            }
          <div class="cs-body">
              <h4 class="cs-title sub-heading-1">
                ${escape(it.title)}
              </h4>

              ${
                it.description
                  ? `<p class="cs-desc">${escape(it.description)}</p>`
                  : ""
              }
            </div>
            <span class="link">
              Read the case study
              <svg class="icon linear" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
                <use href="${spriteUrl}#icon-arrowRight-linear"></use>
              </svg>
            </span>
        </article>
      </a>
    `;
    })
    .join("");

  container.innerHTML = `
    <header class="cs-header" aria-labelledby="cs-title">
      <p class="eyebrow">Case studies</p>
      <h2 class="heading-2">Making complex products simple, useful and loved</h2>
    </header>

    <div class="cs-layout">
      ${cardsHTML}
    </div>
  `;

  // Equalize all .cs-desc heights to match the tallest description
  const layout = container.querySelector(".cs-layout");
  if (layout) {
    const getDescs = () => Array.from(layout.querySelectorAll(".cs-desc"));

    const computeAndSetMaxDesc = () => {
      layout.style.removeProperty("--cs-desc-h");
      const max = getDescs().reduce(
        (acc, el) => Math.max(acc, el.getBoundingClientRect().height),
        0
      );
      if (max > 0)
        layout.style.setProperty("--cs-desc-h", `${Math.ceil(max)}px`);
    };

    const ro = new ResizeObserver(() => computeAndSetMaxDesc());
    getDescs().forEach((el) => ro.observe(el));

    const onResize = () => computeAndSetMaxDesc();
    window.addEventListener("resize", onResize, { passive: true });

    requestAnimationFrame(computeAndSetMaxDesc);
  }

  // Shots
  const explore = document.createElement("div");
  explore.className = "cs-explore";
  explore.innerHTML = `
    <div class="cs-explore-head">
      <h3 class="heading-3">Design explorations</h3>
      <a class="btn-md btn-secondary" href="https://dribbble.com/${dribbbleProfile}" target="_blank" rel="noopener">
        <span class="shadow"></span>
        <span class="edge"></span>
        <span class="front">See more on Dribbble</span>
      </a>
    </div>
    <div class="explore-rail" aria-label="Dribbble shots carousel"></div>
  `;
  container.appendChild(explore);

  const fbUrl = new URL(shotsPath, import.meta.url).href;
  let shots = (await fetchJSON(fbUrl)) || [];
  if (!Array.isArray(shots)) shots = [];
  shots = shots.slice(0, shotsLimit);

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
      const title = s.title || "Dribbble Shot";
      return `
      <a class="explore-card " href="${url}" target="_blank" rel="noopener" 
      aria-label="${escape(title)}">
        ${
          src
            ? `<img src="${src}" alt="${escape(title)}" 
              loading="lazy" decoding="async">`
            : `<div class="img-placeholder" aria-hidden="true"></div>`
        }
      </a>
    `;
    })
    .join("");
}
