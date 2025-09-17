import { escape } from "../utils/dom.js";
import { fetchJSON } from "../utils/fetch-json.js";
import { inlineSpriteOnce } from "../utils/svg.js";

export async function mountWritings({
  selector = "section.writings",

  spritePath = "../../assets/icons/sprite.svg",
  dataPath = "../../data/articles.json",
  limit = 3,
} = {}) {
  const section = document.querySelector(selector);
  if (!section) return;
  const container = section.querySelector(".container");
  if (!container) return;

  const spriteUrl = new URL(spritePath, import.meta.url).href;
  await inlineSpriteOnce(spriteUrl);

  const url = new URL(dataPath, import.meta.url).href;
  let items = (await fetchJSON(url)) || [];
  if (!Array.isArray(items) || !items.length) items = [];
  items = items.slice(0, limit);

  if (!items.length) {
    section.hidden = true;
    return;
  }

  container.innerHTML = `
    <header class="w-header" aria-labelledby="writings-title">
      <p class="eyebrow">Writing</p>
      <h2 class="heading-2">Thoughts on design, tech and product strategy</h2>
    </header>

    <ul class="w-list" role="list"></ul>
  `;

  const listEl = container.querySelector(".w-list");
  listEl.innerHTML = items.map(renderItem).join("");

  function renderItem(art) {
    const url = art.url || "#";
    const date = art.published ? formatDate(art.published) : "";
    const mins = Number(art.minutes) ? `${art.minutes} min` : "";
    const meta = [date, mins].filter(Boolean).join(" • ");

    return `
    <li class="w-item">
      <a href="${url}" target="_blank" rel="noopener">
        <article class="w-card">
          <div class="w-left">
            <div class="w-meta text-sm">${escape(meta)}</div>
            <h4 class="w-title sub-heading-2">
              ${escape(art.title)}
            </h4>
          </div>

          <div class="w-right">
            <span class="link">
              Read the article
              <svg class="icon linear" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
                <use href="${spriteUrl}#icon-arrowRight-linear"></use>
              </svg>
            </span>
          </div>
        </article>
      </a>
    </li>
  `;
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }
}
