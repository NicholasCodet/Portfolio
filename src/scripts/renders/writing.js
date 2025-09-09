import { fetchJSON } from "../utils/fetch-json.js";

export async function mountWriting({
  selector = "section.writing",
  eyebrow = "Writing",
  title = "Thoughts on design,\ntech and product strategy",
  mediumUser = "your-handle", // ← ton @ Medium (sans @)
  funcUrl = "/.netlify/functions/medium", // proxy
  fallbackPath = "../../data/articles.json", // local fallback
  limit = 3,
} = {}) {
  const section = document.querySelector(selector);
  if (!section) return;
  const container = section.querySelector(".container");
  if (!container) return;

  // header
  container.innerHTML = `
    <header class="w-head" aria-labelledby="w-title">
      <p class="eyebrow">${escapeHTML(eyebrow)}</p>
      <h2 id="w-title" class="h2">${escapeHTML(title).replaceAll(
        "\\n",
        "<br>"
      )}</h2>
    </header>
    <ul class="w-list" role="list"></ul>
  `;

  const listEl = container.querySelector(".w-list");

  // 1) Medium (serverless) → 2) fallback JSON
  let items = await fetchJSON(
    `${funcUrl}?user=${encodeURIComponent(mediumUser)}&limit=${limit}`
  );
  if (!Array.isArray(items) || !items.length) {
    const fb = new URL(fallbackPath, import.meta.url).href;
    items = (await fetchJSON(fb)) || [];
  }
  items = items.slice(0, limit);

  if (!items.length) {
    section.hidden = true;
    return;
  }

  listEl.innerHTML = items.map(renderItem).join("");

  function renderItem(it) {
    const url = it.url || "#";
    const date = it.published ? formatDate(it.published) : "";
    const mins = Number(it.minutes) ? `${it.minutes} min` : "";
    const meta = [date, mins].filter(Boolean).join(" • ");

    return `
    <li class="w-item">
      <div class="w-left">
        <div class="w-meta">${escapeHTML(meta)}</div>
        <h3 class="w-title">
          <a href="${url}" target="_blank" rel="noopener">
            ${escapeHTML(it.title)}
          </a>
        </h3>
      </div>
      <div class="w-cta">
        <a class="w-link" href="${url}" target="_blank" rel="noopener">
          Read the article <span class="chev" aria-hidden="true">›</span>
        </a>
      </div>
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
  function escapeHTML(s = "") {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}
