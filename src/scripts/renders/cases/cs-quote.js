import { escape } from "../../utils/dom.js";

export function mountCSQuote({
  selector = ".section.case-quote",
  data = {},
} = {}) {
  const section = document.querySelector(selector);
  if (!section) return;
  const container = section.querySelector(".container");
  if (!container) return;

  // Extract JSON data up-front
  const q = data.quote || {};
  const quoteText = escape(q.text || "");
  const quoteAuthor = escape(q.author || "");
  const role = q.role || "";
  const company = q.company || "";
  const companyLabel = company ? ` @${company}` : "";
  const roleLine = [role, companyLabel].filter(Boolean).join("");

  if (!quoteText) {
    section.hidden = true;
    return;
  }

  const avatarPath = q.avatar || "";
  const avatarUrl = avatarPath.startsWith("/src/")
    ? new URL("../../../" + avatarPath.slice(5), import.meta.url).href
    : avatarPath;
  const avatarW = q.avatarW || 44;
  const avatarH = q.avatarH || 44;

  container.innerHTML = `
    <figure class="cquote-figure">
      <blockquote class="cquote-quote">
        <p class="headline-2">${quoteText}</p>
      </blockquote>
      <figcaption class="cquote-author">
        ${
          avatarUrl
            ? `<img class=\"cquote-avatar\" src=\"${avatarUrl}\" alt=\"\" width=\"${avatarW}\" height=\"${avatarH}\" loading=\"lazy\" decoding=\"async\">`
            : ""
        }
        <div class="cquote-meta">
          ${quoteAuthor ? `<strong class="name">${quoteAuthor}</strong>` : ""}
          ${roleLine ? `<span class="role">${escape(roleLine)}</span>` : ""}
        </div>
      </figcaption>
    </figure>
  `;
}
