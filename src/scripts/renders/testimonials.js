import { fetchJSON } from "../utils/fetch-json.js";

/**
 * Testimonials — cartes multiples (tous les items sauf { main:true }).
 * Structure attendue : <section class="section testimonials"><div class="container"></div></section>
 */
export async function mountTestimonials({
  selector = "section.testimonials",
  dataPath = "../../data/testimonials.json",
  limit = 6, // 2 x 3
  eyebrow = "What people say",
  title = "Testimonials",
} = {}) {
  const section = document.querySelector(selector);
  if (!section) return;
  const container = section.querySelector(".container");
  if (!container) return;

  // 1) Data
  const url = new URL(dataPath, import.meta.url).href;
  const list = await fetchJSON(url);
  if (!Array.isArray(list) || !list.length) {
    section.hidden = true;
    return;
  }

  const cards = list.filter((t) => !t.main).slice(0, limit);
  if (!cards.length) {
    section.hidden = true;
    return;
  }

  // 2) Calcul des colonnes (≥ md)
  const cols = Math.min(3, cards.length); // 1, 2 ou 3
  const isCompact = cards.length < 3; // centre si 1–2

  // 3) Markup
  container.innerHTML = `
    <header class="t-header" aria-labelledby="testimonials-title">
      <p class="eyebrow">${escapeHTML(eyebrow)}</p>
      <h2 id="testimonials-title" class="h2">${escapeHTML(title)}</h2>
    </header>

    <div class="testimonials-grid${
      isCompact ? " is-compact" : ""
    }" style="--cols:${cols}">
      ${cards.map(renderCard).join("")}
    </div>
  `;

  function renderCard(t) {
    const src =
      t.avatar && t.avatar.startsWith("/src/")
        ? new URL("../../" + t.avatar.slice(5), import.meta.url).href
        : t.avatar || "";

    const companyLabel = t.company ? ` @${t.company}` : "";
    const roleLine = [t.role, companyLabel].filter(Boolean).join("");

    return `
    <div class="t-item">
      <article class="t-card">
        <blockquote class="t-quote"><p>${escapeHTML(t.quote)}</p></blockquote>
        <footer class="t-footer">
          ${
            src
              ? `<img class="t-avatar" src="${src}" alt="" width="${
                  t.avatarW || 48
                }" height="${t.avatarH || 48}" loading="lazy" decoding="async">`
              : ""
          }
          <div class="t-meta">
            <strong class="name">${escapeHTML(t.author)}</strong>
            <span class="role">${escapeHTML(roleLine)}</span>
          </div>
        </footer>
      </article>
    </div>
  `;
  }
}

function escapeHTML(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
