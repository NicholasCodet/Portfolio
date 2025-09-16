import { escape } from "../utils/dom.js";
import { fetchJSON } from "../utils/fetch-json.js";

export async function mountTestimonials({
  selector = "section.testimonials",
  dataPath = "../../data/testimonials.json",

  limit = 6,
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

  const cards = list.filter((t) => !t.main).slice(0, limit);
  if (!cards.length) {
    section.hidden = true;
    return;
  }

  container.innerHTML = `
    <header class="t-header" aria-labelledby="testimonials-title">
      <p class="eyebrow">Client Feedback</p>
      <h2 class="heading-2">Trusted by founders and product leaders</h2>
    </header>

    <div class="t-layout">
      ${cards.map(renderCard).join("")}
    </div>
  `;

  // Calc .t-quote higher height
  const layout = container.querySelector(".t-layout");
  if (layout) {
    const getQuotes = () => Array.from(layout.querySelectorAll(".t-quote"));

    const computeAndSetMaxQuote = () => {
      layout.style.removeProperty("--t-quote-h");
      const max = getQuotes().reduce(
        (acc, el) => Math.max(acc, el.getBoundingClientRect().height),
        0
      );
      if (max > 0)
        layout.style.setProperty("--t-quote-h", `${Math.ceil(max)}px`);
    };

    const ro = new ResizeObserver(() => computeAndSetMaxQuote());
    getQuotes().forEach((el) => ro.observe(el));

    const onResize = () => computeAndSetMaxQuote();
    window.addEventListener("resize", onResize, { passive: true });

    requestAnimationFrame(computeAndSetMaxQuote);
  }

  function renderCard(t) {
    const avatarUrl =
      t.avatar && t.avatar.startsWith("/src/")
        ? new URL("../../" + t.avatar.slice(5), import.meta.url).href
        : t.avatar || "";

    const companyLabel = t.company ? ` @${t.company}` : "";
    const roleLine = [t.role, companyLabel].filter(Boolean).join("");

    return `
    <div class="t-item">

      <figure class="t-figure">
        <blockquote class="t-quote">
          <p class="text-md">${escape(t.quote)}</p>
        </blockquote>
        <figcaption class="t-author">
          ${
            avatarUrl
              ? `
            <img class="t-avatar" 
                src="${avatarUrl}" alt=""  
                width="${t.avatarW || 44}" height="${t.avatarH || 44}" 
                loading="lazy" decoding="async">`
              : ""
          }
          <div class="t-meta">
            <strong class="name">${escape(t.author)}</strong>
            <span class="role">${escape(roleLine)}</span>
          </div>
        </figcaption>
      </figure>
    </div>
  `;
  }
}
