import { escape } from "../../utils/dom.js";

export function mountCSBody({
  selector = ".section.case-body",
  data = {},
} = {}) {
  const section = document.querySelector(selector);
  if (!section) return;
  const container = section.querySelector(".container");
  if (!container) return;

  // Pull data from JSON once at the top
  const metaItems = Array.isArray(data.meta) ? data.meta : [];
  const sections = Array.isArray(data.sections) ? data.sections : [];

  // Helpers
  const idx = (pred) => sections.findIndex(pred);
  const after = (start, type) =>
    sections.slice(start + 1).find((s) => s.type === type) || null;
  const nextOfTypeAfter = (start, type) => {
    const i = sections.findIndex((s, k) => k > start && s.type === type);
    return i >= 0 ? sections[i] : null;
  };

  // Media and content blocks
  const firstImage = sections.find((s) => s.type === "image") || null;

  const iLandscape = idx((s) => s.type === "subheading");
  const titleLandscape = escape(sections[iLandscape]?.text || "");
  const textLandscape = escape(after(iLandscape, "paragraph")?.text || "");

  const iProblems = idx(
    (s) => s.type === "subheading" && /problems/i.test(s.text || "")
  );
  const titleProblems = escape(sections[iProblems]?.text || "");
  const textProblems = escape(after(iProblems, "paragraph")?.text || "");

  const iApproach = idx(
    (s) => s.type === "subheading" && /approach/i.test(s.text || "")
  );
  const titleApproach = escape(sections[iApproach]?.text || "");
  const textApproach = escape(after(iApproach, "paragraph")?.text || "");
  const secondImage = nextOfTypeAfter(iApproach, "image");

  const iSolution = idx(
    (s) => s.type === "heading" && /solution/i.test(s.text || "")
  );
  const titleSolution = escape(sections[iSolution]?.text || "");
  const textSolution = escape(after(iSolution, "paragraph")?.text || "");

  const iImpact = idx(
    (s) => s.type === "heading" && /impact/i.test(s.text || "")
  );
  const titleImpact = escape(sections[iImpact]?.text || "");
  const textImpact = escape(after(iImpact, "paragraph")?.text || "");
  const thirdImage = nextOfTypeAfter(iImpact, "image");

  const renderMeta = () =>
    metaItems
      .map(
        (m) => `
      <div class="case-meta-item">
        <p class="text-sm sub-heading-2">${escape(m.label || "-")}</p>
        <p class="text-md">${escape(m.value || "—")}</p>
      </div>`
      )
      .join("");

  const renderImage = (img) => {
    if (!img) return "";

    const alt = escape(img.alt || "");
    const caption = escape(img.caption || "");
    const src = String(img.src || "").trim();
    return `
      <figure class="case-media case-section">
        ${
          src
            ? `<img src="${escape(src)}" alt="${alt}" loading="lazy" />`
            : `<div class="img-placeholder" role="img" aria-label="${alt}"></div>`
        }
        ${caption ? `<figcaption class="text-xs">${caption}</figcaption>` : ""}
      </figure>`;
  };

  container.innerHTML = `
    <div class="case-meta">${renderMeta()}</div>
    ${renderImage(firstImage)}

    <h3 class="heading-3 case-section">${titleLandscape}</h3>
    <p class="text-md case-paragraph">${textLandscape}</p>

    <h3 class="heading-3 case-section">${titleProblems}</h3>
    <p class="text-md case-paragraph">${textProblems}</p>

    <h3 class="heading-3 case-section">${titleApproach}</h3>
    <p class="text-md case-paragraph">${textApproach}</p>
    ${renderImage(secondImage)}

    <h3 class="heading-3 case-section">${titleSolution}</h3>
    <p class="text-md case-paragraph">${textSolution}</p>

    <h3 class="heading-3 case-section">${titleImpact}</h3>
    <p class="text-md case-paragraph">${textImpact}</p>
    ${renderImage(thirdImage)}
  `;
}
