import "./quote.css";
import tplHTML from "./quote.html?raw";

import testimonials from "../../data/testimonials.json";

import { resolveAssetPath } from "../../scripts/utils/assets.js";

let __tpl;
function getTemplate() {
  if (!__tpl) {
    const doc = new DOMParser().parseFromString(tplHTML, "text/html");
    const t = doc.querySelector("template");
    if (!t) throw new Error("quote: <template> missing");
    __tpl = t;
  }
  return __tpl;
}

const baseUrl = import.meta.url;

const DEFAULT_PREFIX = "quote";

export function mountQuote({
  selector = "section.quote",
  data = null,
  classPrefix = DEFAULT_PREFIX,
  headlineClass = "headline-1",
} = {}) {
  const section =
    document.querySelector(selector) || document.querySelector("section.quote");
  if (!section) return () => {};
  const container = section.querySelector(".container");
  if (!container) return () => {};

  const list =
    data && Array.isArray(data)
      ? data
      : Array.isArray(testimonials)
      ? testimonials
      : [];
  const t = list.find((x) => x && x.main) || list[0];
  if (!t) {
    section.hidden = true;
    return () => {};
  }

  const tpl = getTemplate();
  const frag = tpl.content.cloneNode(true);

  // Remap classes according to prefix
  const find = (suffix, legacy) =>
    frag.querySelector(`.${DEFAULT_PREFIX}-${suffix}`) ||
    (legacy ? frag.querySelector(legacy) : null);

  const fig = find("figure", ".testimony-figure");
  const bq = find("text", ".testimony-quote");
  const pEl =
    frag.querySelector(`.${DEFAULT_PREFIX}-text p`) ||
    frag.querySelector(".testimony-quote p");
  const cap = find("author", ".testimony-author");
  const meta = find("meta", ".testimony-meta");
  const nameEl =
    frag.querySelector(`.${DEFAULT_PREFIX}-meta .name`) ||
    frag.querySelector(".testimony-meta .name");
  const roleEl =
    frag.querySelector(`.${DEFAULT_PREFIX}-meta .role`) ||
    frag.querySelector(".testimony-meta .role");

  if (classPrefix !== DEFAULT_PREFIX) {
    if (fig) fig.className = `${classPrefix}-figure`;
    if (bq) bq.className = `${classPrefix}-text ${classPrefix}-quote`;
    if (cap) cap.className = `${classPrefix}-author`;
    if (meta) meta.className = `${classPrefix}-meta`;
  }

  if (pEl) {
    // support both { text, author, ... } and { quote, author, ... }
    const txt = t.text || t.quote || "";
    pEl.textContent = String(txt);
    // adjust heading style class
    pEl.className = headlineClass;
  }
  if (nameEl) nameEl.textContent = String(t.author || t.name || "");
  if (roleEl) {
    const parts = [t.role || "", t.company ? `@${t.company}` : ""].filter(Boolean);
    roleEl.textContent = parts.join(" ").trim();
  }

  const avatarUrl = resolveAssetPath(t.avatar || "", baseUrl) || "";
  if (avatarUrl && cap) {
    const img = document.createElement("img");
    img.className =
      classPrefix === DEFAULT_PREFIX
        ? `${DEFAULT_PREFIX}-avatar`
        : `${classPrefix}-avatar`;
    img.setAttribute("src", avatarUrl);
    img.setAttribute("alt", "");
    img.setAttribute("width", String(t.avatarW || 44));
    img.setAttribute("height", String(t.avatarH || 44));
    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");
    cap.insertBefore(img, cap.firstChild);
  }

  container.textContent = "";
  container.appendChild(frag);

  return () => {};
}

if (typeof window !== "undefined") {
  // @ts-ignore
  window.mountQuote = mountQuote;
}
