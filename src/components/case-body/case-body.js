import "./case-body.css";
import tplHTML from "./case-body.html?raw";

import { resolveAssetPath } from "../../scripts/utils/assets.js";
import { escape } from "../../scripts/utils/dom.js";

let __tpl;
function getTemplate() {
  if (!__tpl) {
    const doc = new DOMParser().parseFromString(tplHTML, "text/html");
    const t = doc.querySelector("template");
    if (!t) throw new Error("case-body: <template> missing");
    __tpl = t;
  }
  return __tpl;
}

const baseUrl = import.meta.url;

export function mountCaseBody({
  selector = ".section.case-body",
  data = {},
} = {}) {
  const section = document.querySelector(selector);
  if (!section) return () => {};
  const container = section.querySelector(".container");
  if (!container) return () => {};

  const tpl = getTemplate();
  const frag = tpl.content.cloneNode(true);
  const root = frag.querySelector(".case-body-root");
  if (!root) return () => {};

  // Pull data from JSON once at the top
  const sections = Array.isArray(data.sections) ? data.sections : [];

  const hasStructured = !!(
    data &&
    (data.context ||
      data.problems ||
      data.process ||
      data.approach ||
      data.solution ||
      data.impact)
  );

  // Helpers
  const idx = (pred) => sections.findIndex(pred);
  const after = (start, type) =>
    sections.slice(start + 1).find((s) => s.type === type) || null;
  const nextOfTypeAfter = (start, type) => {
    const i = sections.findIndex((s, k) => k > start && s.type === type);
    return i >= 0 ? sections[i] : null;
  };

  const renderImage = (
    img,
    { figureClass = "case-media case-section" } = {}
  ) => {
    if (!img) return "";
    const alt = escape(img.alt || "");
    const caption = escape(img.caption || "");
    const src = resolveAssetPath(img.src || "", baseUrl) || "";
    const width = Number(img.width ?? img.w ?? img.pixelWidth);
    const height = Number(img.height ?? img.h ?? img.pixelHeight);
    const widthAttr = Number.isFinite(width) && width > 0 ? ` width=\"${Math.round(width)}\"` : "";
    const heightAttr = Number.isFinite(height) && height > 0 ? ` height=\"${Math.round(height)}\"` : "";
    const mediaInner = src
      ? `<img src="${escape(src)}" alt="${alt}" loading="lazy" decoding="async"${widthAttr}${heightAttr} />`
      : `<div class="img-placeholder" role="img" aria-label="${alt}"></div>`;
    return `
      <figure class="${figureClass}">
        <span class="case-media-frame">${mediaInner}</span>
        ${
          caption ? `<figcaption class=\"text-xs\">${caption}</figcaption>` : ""
        }
      </figure>`;
  };

  const renderMediaGallery = (media) => {
    if (!media) return "";
    const title = escape(media.title || "");
    const itemsRaw = Array.isArray(media.items)
      ? media.items
      : Array.isArray(media.images)
      ? media.images
      : media.image
      ? Array.isArray(media.image)
        ? media.image
        : [media.image]
      : [];
    const items = itemsRaw
      .map((item) => renderImage(item, { figureClass: "case-media" }))
      .filter(Boolean)
      .join("");
    if (!items) return "";
    return `
      ${title ? `<h3 class=\"heading-3 case-section\">${title}</h3>` : ""}
      <div class="case-media-grid case-section">
        ${items}
      </div>
    `;
  };

  const renderKpis = (kpi) => {
    if (!kpi) return "";
    const itemsBase = Array.isArray(kpi?.items)
      ? kpi.items
      : Array.isArray(kpi)
      ? kpi
      : kpi.data
      ? [kpi.data]
      : [];
    const cards = itemsBase
      .map((item) => {
        if (!item) return "";
        const number = escape(item.number || "");
        const text = escape(item.text || "");
        if (!number && !text) return "";
        return `
          <div class="case-kpi">
            ${number ? `<span class=\"case-kpi-number\">${number}</span>` : ""}
            ${text ? `<span class=\"case-kpi-text\">${text}</span>` : ""}
          </div>
        `;
      })
      .filter(Boolean)
      .join("");
    if (!cards) return "";
    return `<div class="case-kpis case-section">${cards}</div>`;
  };

  const normaliseBreaks = (text) =>
    String(text)
      .replace(/\r\n?/g, "\n")
      .replace(/<\/?br\s*\/?\s*>/gi, "\n");

  const toParagraphInner = (text) => {
    if (!text) return "";
    const value = normaliseBreaks(text).trim();
    if (!value) return "";
    return escape(value).replace(/\n/g, "<br />");
  };

  const renderParagraphContent = (
    content,
    { paragraphClass = "text-lg case-paragraph" } = {}
  ) => {
    const wrapParagraph = (value, { raw = false } = {}) => {
      if (raw) {
        const html = String(value || "").trim();
        if (!html) return "";
        return `<p class="${paragraphClass}">${html}</p>`;
      }

      const inner = toParagraphInner(value);
      if (!inner) return "";
      return `<p class="${paragraphClass}">${inner}</p>`;
    };

    const paragraphs = [];

    const collect = (value) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        for (const entry of value) collect(entry);
        return;
      }
      if (typeof value === "object") {
        if ("html" in value) {
          const p = wrapParagraph(value.html, { raw: true });
          if (p) paragraphs.push(p);
          return;
        }
        if ("text" in value || "content" in value) {
          collect(value.text ?? value.content);
        }
        return;
      }
      const p = wrapParagraph(value);
      if (p) paragraphs.push(p);
    };

    collect(content);

    if (!paragraphs.length) return "";

    return `<div class="case-paragraphs">${paragraphs.join("")}</div>`;
  };

  const renderProcess = (process) => {
    if (!process) return "";
    const title = escape(process.title || "");
    const stepsRaw = Array.isArray(process.content) ? process.content : [];
    const steps = stepsRaw
      .map((step) => {
        if (!step || typeof step !== "object") return "";
        const subtitle = escape(step.subtitle || step.title || "");
        const body = renderParagraphContent(step.text ?? step.content);
        if (!subtitle && !body) return "";
        return `
          <div class="case-process-step case-text">
            ${subtitle ? `<h4 class="heading-4">${subtitle}</h4>` : ""}
            ${body}
          </div>
        `;
      })
      .filter(Boolean)
      .join("");

    if (!title && !steps) return "";

    return `
      <div class="case-process case-section">
        ${title ? `<h3 class="heading-3">${title}</h3>` : ""}
        ${steps ? `<div class="case-process-steps">${steps}</div>` : ""}
      </div>
    `;
  };

  const block = (section, extra = "") => {
    if (!section) return "";
    const title = escape(section.title || "");
    const body = renderParagraphContent(
      section.content !== undefined ? section.content : section.text
    );
    if (!title && !body && !extra) return "";
    return `
      <div class="case-text case-section">
        ${title ? `<h3 class="heading-3">${title}</h3>` : ""}
        ${body}
        ${extra}
      </div>
    `;
  };

  if (!hasStructured) {
    // Legacy path: extract content from flat `sections` list
    const firstImage = sections.find((s) => s.type === "image") || null;

    const iLandscape = idx((s) => s.type === "subheading");
    const titleLandscape = escape(sections[iLandscape]?.text || "");
    const textLandscape = renderParagraphContent(
      after(iLandscape, "paragraph")
    );

    const iProblems = idx(
      (s) => s.type === "subheading" && /problems/i.test(s.text || "")
    );
    const titleProblems = escape(sections[iProblems]?.text || "");
    const textProblems = renderParagraphContent(after(iProblems, "paragraph"));

    const iApproach = idx(
      (s) => s.type === "subheading" && /approach/i.test(s.text || "")
    );
    const titleApproach = escape(sections[iApproach]?.text || "");
    const textApproach = renderParagraphContent(after(iApproach, "paragraph"));
    const secondImage = nextOfTypeAfter(iApproach, "image");

    const iSolution = idx(
      (s) => s.type === "heading" && /solution/i.test(s.text || "")
    );
    const titleSolution = escape(sections[iSolution]?.text || "");
    const textSolution = renderParagraphContent(after(iSolution, "paragraph"));

    const iImpact = idx(
      (s) => s.type === "heading" && /impact/i.test(s.text || "")
    );
    const titleImpact = escape(sections[iImpact]?.text || "");
    const textImpact = renderParagraphContent(after(iImpact, "paragraph"));
    const thirdImage = nextOfTypeAfter(iImpact, "image");

    root.innerHTML = `
      ${renderImage(firstImage)}
      ${
        titleLandscape
          ? `<h3 class=\"heading-3 case-section\">${titleLandscape}</h3>`
          : ""
      }
      ${textLandscape ? `${textLandscape}` : ""}

      ${
        titleProblems
          ? `<h3 class=\"heading-3 case-section\">${titleProblems}</h3>`
          : ""
      }
      ${textProblems ? `${textProblems}` : ""}

      ${
        titleApproach
          ? `<h3 class=\"heading-3 case-section\">${titleApproach}</h3>`
          : ""
      }
      ${textApproach ? `${textApproach}` : ""}
      ${renderImage(secondImage)}

      ${
        titleSolution
          ? `<h3 class=\"heading-3 case-section\">${titleSolution}</h3>`
          : ""
      }
      ${textSolution ? `${textSolution}` : ""}

      ${
        titleImpact
          ? `<h3 class=\"heading-3 case-section\">${titleImpact}</h3>`
          : ""
      }
      ${textImpact ? `${textImpact}` : ""}
      ${renderImage(thirdImage)}
    `;
  } else {
    // Structured path
    const ctx = data.context || {};
    const prb = data.problems || {};
    const pro = data.process || {};
    const apr = data.approach || {};
    const sol = data.solution || {};
    const out = data.outcome || {};
    const res = data.results || {};
    const media = data.media || {};
    const imp = data.impact || {};
    const learn = data.learnings || data.learning || {};

    const kpiExtras = (section) =>
      renderKpis(section?.kpi || section?.kpis || section?.metrics);

    const append = (value) => {
      if (value) parts.push(value);
    };

    const parts = [];
    append(renderImage(ctx.image));
    append(block(ctx));
    append(block(prb));
    append(renderProcess(pro));
    append(block(apr));
    append(renderImage(apr.image));
    append(block(sol));
    append(renderImage(sol.image));
    append(renderMediaGallery(media));
    append(block(out, kpiExtras(out)));
    append(renderImage(out.image));
    append(block(res, kpiExtras(res)));
    append(renderImage(res.image));
    append(block(imp, kpiExtras(imp)));
    append(renderImage(imp.image));
    append(block(learn, kpiExtras(learn)));
    append(renderImage(learn.image));

    root.innerHTML = parts.filter(Boolean).join("");
  }

  container.textContent = "";
  container.appendChild(frag);

  return () => {};
}

if (typeof window !== "undefined") {
  // @ts-ignore
  window.mountCaseBody = mountCaseBody;
}
