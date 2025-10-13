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
  let figure =
    container.querySelector(`.${classPrefix}-figure`) ||
    container.querySelector(`.${DEFAULT_PREFIX}-figure`);
  let isHydrating = false;
  if (!figure) {
    const frag = tpl.content.cloneNode(true);
    container.textContent = "";
    container.appendChild(frag);
    figure = container.querySelector(`.${DEFAULT_PREFIX}-figure`);
  } else {
    isHydrating = true;
  }
  if (!figure) return () => {};

  const remapClass = (el, klass) => {
    if (!el) return;
    el.className = klass;
  };

  const ensurePrefixedClasses = () => {
    if (classPrefix !== DEFAULT_PREFIX) {
      remapClass(figure, `${classPrefix}-figure`);
    }

    const blockquote =
      figure.querySelector(`.${DEFAULT_PREFIX}-text`) ||
      figure.querySelector(`.${classPrefix}-text`) ||
      figure.querySelector(".testimony-quote") ||
      figure.querySelector(".quote-text");
    const caption =
      figure.querySelector(`.${DEFAULT_PREFIX}-author`) ||
      figure.querySelector(`.${classPrefix}-author`) ||
      figure.querySelector(".testimony-author") ||
      figure.querySelector(".quote-author");
    const meta =
      figure.querySelector(`.${DEFAULT_PREFIX}-meta`) ||
      figure.querySelector(`.${classPrefix}-meta`) ||
      figure.querySelector(".testimony-meta") ||
      figure.querySelector(".quote-meta");

    if (blockquote) {
      const nextPrefix =
        classPrefix !== DEFAULT_PREFIX ? classPrefix : DEFAULT_PREFIX;
      remapClass(
        blockquote,
        `${nextPrefix}-text ${nextPrefix}-quote`.trim()
      );
    }
    if (caption && classPrefix !== DEFAULT_PREFIX) {
      remapClass(caption, `${classPrefix}-author`);
    }
    if (meta && classPrefix !== DEFAULT_PREFIX) {
      remapClass(meta, `${classPrefix}-meta`);
    }
  };

  ensurePrefixedClasses();

  const block =
    figure.querySelector(`.${classPrefix}-text`) ||
    figure.querySelector(`.${DEFAULT_PREFIX}-text`) ||
    figure.querySelector(".quote-text") ||
    figure.querySelector(".testimony-quote");
  const pEl =
    block?.querySelector("p") ||
    figure.querySelector(`.${classPrefix}-text p`) ||
    figure.querySelector(`.${DEFAULT_PREFIX}-text p`);
  const caption =
    figure.querySelector(`.${classPrefix}-author`) ||
    figure.querySelector(`.${DEFAULT_PREFIX}-author`) ||
    figure.querySelector(".quote-author") ||
    figure.querySelector(".testimony-author");
  const meta =
    caption?.querySelector(`.${classPrefix}-meta`) ||
    caption?.querySelector(`.${DEFAULT_PREFIX}-meta`) ||
    caption?.querySelector(".quote-meta") ||
    caption?.querySelector(".testimony-meta");
  const nameEl = meta?.querySelector(".name");
  const roleEl = meta?.querySelector(".role");

  if (pEl) {
    const txt = t.text || t.quote || "";
    pEl.textContent = String(txt);
    pEl.className = headlineClass;
  }
  if (nameEl) nameEl.textContent = String(t.author || t.name || "");
  if (roleEl) {
    const parts = [t.role || "", t.company ? `@${t.company}` : ""].filter(
      Boolean
    );
    roleEl.textContent = parts.join(" ").trim();
  }

  const avatarUrl = resolveAssetPath(t.avatar || "", baseUrl) || "";
  if (caption) {
    let img =
      caption.querySelector("img") ||
      caption.querySelector(`.${classPrefix}-avatar`) ||
      caption.querySelector(`.${DEFAULT_PREFIX}-avatar`);
    if (avatarUrl) {
      if (!img) {
        img = document.createElement("img");
        caption.insertBefore(img, caption.firstChild || null);
      }
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
    } else if (img) {
      img.remove();
    }
  }

  return () => {};
}

if (typeof window !== "undefined") {
  // @ts-ignore
  window.mountQuote = mountQuote;
}
