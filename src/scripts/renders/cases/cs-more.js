import { escape } from "../../utils/dom.js";
import { fetchJSON } from "../../utils/fetch-json.js";
import { inlineSpriteOnce } from "../../utils/svg.js";

export async function mountCSMore({
  selector = ".section.more-projects",
  casesPath = "../../../data/case-studies.json",
  currentId = "",
  spritePath = "../../../assets/icons/sprite.svg",
  maxCards = 2,
} = {}) {
  const section = document.querySelector(selector);
  if (!section) return;
  const container = section.querySelector(".container");
  if (!container) return;

  const spriteUrl = new URL(spritePath, import.meta.url).href;
  await inlineSpriteOnce(spriteUrl);

  // Determine current slug if not provided
  let slug = currentId;
  if (!slug) {
    const params = new URLSearchParams(location.search);
    slug = params.get("id") || (location.pathname.split("/").pop() || "").replace(/\.html?$/i, "");
  }

  const url = new URL(casesPath, import.meta.url).href;
  let list = (await fetchJSON(url)) || [];
  if (!Array.isArray(list)) list = [];

  const getSlug = (it) => {
    if (it.slug) return it.slug;
    const m = (it.href || "").match(/\/cases\/(.+?)\.html/i);
    return m ? m[1] : "";
  };

  // Keep different projects only
  let items = list.filter((x) => x && x.featured === true && getSlug(x) !== slug);
  if (items.length > maxCards) items = items.slice(0, maxCards);

  // If we have less than maxCards, we'll append a placeholder card.
  const needsPlaceholder = items.length < maxCards;

  const renderRealCard = (it) => {
    const link = it.href ? it.href : it.slug ? `/cases/${it.slug}.html` : "#";
    const src =
      it.thumbnail && it.thumbnail.startsWith("/src/")
        ? new URL("../../" + it.thumbnail.slice(5), import.meta.url).href
        : it.thumbnail || "";
    return `
      <a href="${link}">
        <article class="cs-card">
          <div class="cs-media">
            ${
              src
                ? `<img src="${src}" alt="${escape(it.title)} preview" loading="lazy" decoding="async">`
                : `<div class="img-placeholder" aria-hidden="true"></div>`
            }
          </div>
          <div class="cs-body">
            <h4 class="cs-title sub-heading-1">${escape(it.title)}</h4>
            ${it.description ? `<p class="cs-desc">${escape(it.description)}</p>` : ""}
          </div>
          <span class="link">
            Read the case study
            <svg class="icon linear" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
              <use href="${spriteUrl}#icon-arrowRight-linear"></use>
            </svg>
          </span>
        </article>
      </a>`;
  };

  const renderPlaceholder = () => `
    <article class="cs-card cs-empty" aria-disabled="true" tabindex="-1">
      <div class="cs-media">
        <div class="cs-empty-inner">
          <svg class="icon linear" width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
            <use href="${spriteUrl}#icon-people-linear"></use>
          </svg>
          <p class="text-md"><span class="hint">Got a cool idea?</span> This spot is waiting<br> for your success story.</p>
        </div>
      </div>
    </article>`;

  const cardsHTML = [
    ...items.map((it) => renderRealCard(it)),
    ...(needsPlaceholder ? [renderPlaceholder()] : []),
  ].join("");

  container.innerHTML = `
    <header class="mp-header">
      <h2 class="heading-2">More projects</h2>
    </header>
    <div class="mp-layout">${cardsHTML}</div>
  `;
}
