import "./case-hero.css";
import tplHTML from "./case-hero.html?raw";

import spriteHref from "../../assets/icons/sprite.svg?url";
import { createSvgUse, inlineSpriteOnce } from "../../scripts/utils/svg.js";
import { bindSafeLink } from "../../scripts/utils/urls.js";

let __tpl;
function getTemplate() {
  if (!__tpl) {
    const doc = new DOMParser().parseFromString(tplHTML, "text/html");
    const t = doc.querySelector("template");
    if (!t) throw new Error("case-hero: <template> missing");
    __tpl = t;
  }
  return __tpl;
}

export async function mountCaseHero({
  selector = ".section.case-hero",
  data = {},
  spritePath = spriteHref,
} = {}) {
  const section = document.querySelector(selector);
  if (!section) return () => {};
  const container = section.querySelector(".container");
  if (!container) return () => {};

  const tpl = getTemplate();
  let rootEl = container.querySelector(".case-hero-root");
  let isHydrating = false;
  if (!rootEl) {
    const frag = tpl.content.cloneNode(true);
    container.textContent = "";
    container.appendChild(frag);
    rootEl = container.querySelector(".case-hero-root");
  } else {
    isHydrating = true;
  }
  if (!rootEl) return () => {};

  const titleEl = rootEl.querySelector(".case-title");
  const sumEl = rootEl.querySelector(".summary");
  const metaEl = rootEl.querySelector(".case-meta");

  // Inline sprite for back icon
  try {
    const spriteUrl = new URL(spritePath, import.meta.url).href;
    await inlineSpriteOnce(spriteUrl);
  } catch {}

  const homeHref = "../index.html";

  if (rootEl) {
    let backLink = rootEl.querySelector(".link.back");
    if (!backLink) {
      backLink = document.createElement("a");
      backLink.className = "link back";
      rootEl.insertBefore(backLink, rootEl.firstChild);
    } else if (backLink !== rootEl.firstChild) {
      rootEl.insertBefore(backLink, rootEl.firstChild);
    }
    backLink.setAttribute("aria-label", "Back home");
    bindSafeLink(backLink, homeHref);

    backLink.textContent = "";
    const svg = createSvgUse("icon-arrowLeft-linear", {
      size: 24,
      className: "icon linear",
    });
    const label = document.createElement("span");
    label.textContent = "Back home";
    backLink.append(svg, label);
  }

  const title = String(
    data["case-title"] || data.title || "Untitled case study"
  );
  const summary = String(data.summary || "");
  if (titleEl) titleEl.textContent = title;
  if (sumEl) sumEl.textContent = summary;

  if (titleEl) {
    const headingId =
      titleEl.id || `case-hero-title-${Math.random().toString(36).slice(2)}`;
    titleEl.id = headingId;
    section.setAttribute("aria-labelledby", headingId);
  }

  // Render meta items if available
  const metaItems = Array.isArray(data.meta) ? data.meta : [];
  if (metaEl && metaItems.length) {
    metaEl.textContent = "";
    for (const m of metaItems) {
      const item = document.createElement("div");
      item.className = "case-meta-item";
      const lab = document.createElement("p");
      lab.className = "sub-heading-2";
      lab.textContent = String((m && m.label) || "-");
      const val = document.createElement("p");
      val.className = "text-lg";
      val.textContent = String((m && m.value) || "—");
      item.appendChild(lab);
      item.appendChild(val);
      metaEl.appendChild(item);
    }
  } else if (metaEl) {
    metaEl.textContent = "";
    if (!isHydrating) metaEl.remove();
  }

  return () => {};
}

if (typeof window !== "undefined") {
  // @ts-ignore
  window.mountCaseHero = mountCaseHero;
}
