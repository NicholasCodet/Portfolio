import { escape } from "../utils/dom.js";
import { fetchJSON } from "../utils/fetch-json.js";

export async function mountTestimony({
  selector = "section.testimony",

  dataPath = "../../data/testimonials.json",
} = {}) {
  const section = document.querySelector(selector);
  if (!section) return;

  const container = section.querySelector(".container");
  if (!container) return;

  const url = new URL(dataPath, import.meta.url).href;
  const list = await fetchJSON(url);
  if (!Array.isArray(list) || !list.length) {
    section.hidden = true;
    return;
  }

  const t = list.find((x) => x.main) || list[0];

  const avatarUrl =
    t.avatar && t.avatar.startsWith("/src/")
      ? new URL("../../" + t.avatar.slice(5), import.meta.url).href
      : t.avatar || "";

  const companyLabel = t.company ? ` @${t.company}` : "";
  const roleLine = [t.role, companyLabel].filter(Boolean).join("");

  container.innerHTML = `
    <figure class="testimony-figure">
      <blockquote class="testimony-quote">
        <p class="headline-1">${escape(t.quote)}</p>
      </blockquote>
      <figcaption class="testimony-author">
        ${
          avatarUrl
            ? `
          <img class="testimony-avatar"
               src="${avatarUrl}" alt=""
               width="${t.avatarW || 44}" height="${t.avatarH || 44}"
               loading="lazy" decoding="async">`
            : ""
        }
        <div class="testimony-meta">
          <strong class="name">${escape(t.author)}</strong>
          <span class="role">${escape(roleLine)}</span>
        </div>
      </figcaption>
    </figure>
  `;
}
