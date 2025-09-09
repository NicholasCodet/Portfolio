import { fetchJSON } from "../utils/fetch-json.js";

export async function mountTestimony({
  selector = "section.testimony",
  dataPath = "../../data/testimonials.json",
  maxWidth = 880,
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

  // Résolution inline du chemin avatar (compatible Vite)
  const avatarUrl =
    t.avatar && t.avatar.startsWith("/src/")
      ? new URL("../../" + t.avatar.slice(5), import.meta.url).href
      : t.avatar || "";

  const companyLabel = t.company ? ` @${t.company}` : "";
  const roleLine = [t.role, companyLabel].filter(Boolean).join("");

  container.innerHTML = `
    <figure class="testimony-figure" style="--maxw:${maxWidth}px">
      <blockquote class="testimony-quote">
        <p>${escapeHTML(t.quote)}</p>
      </blockquote>
      <figcaption class="testimony-author">
        ${
          avatarUrl
            ? `
          <img class="testimony-avatar"
               src="${avatarUrl}" alt=""
               width="${t.avatarW || 56}" height="${t.avatarH || 56}"
               loading="lazy" decoding="async">`
            : ""
        }
        <div class="testimony-meta">
          <strong class="name">${escapeHTML(t.author)}</strong>
          <span class="role">${escapeHTML(roleLine)}</span>
        </div>
      </figcaption>
    </figure>
  `;
}

function escapeHTML(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
