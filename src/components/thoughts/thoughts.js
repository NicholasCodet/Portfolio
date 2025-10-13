import "./thoughts.css";
import tplHTML from "./thoughts.html?raw";

import spriteHref from "../../assets/icons/sprite.svg?url";
import { featuredArticles } from "../../scripts/utils/articles.js";
import { createSvgUse, inlineSpriteOnce } from "../../scripts/utils/svg.js";
import { bindSafeLink } from "../../scripts/utils/urls.js";

let __tpl;
function getTemplate() {
  if (!__tpl) {
    const doc = new DOMParser().parseFromString(tplHTML, "text/html");
    const t = doc.querySelector("template");
    if (!t) throw new Error("thoughts: <template> missing");
    __tpl = t;
  }
  return __tpl;
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export async function mountThoughts({
  selector = "section.writings",
  spritePath = spriteHref,
  limit = 4,
} = {}) {
  const section = document.querySelector(selector);
  if (!section) return () => {};
  const container = section.querySelector(".container");
  if (!container) return () => {};

  const spriteUrl = new URL(spritePath, import.meta.url).href;
  await inlineSpriteOnce(spriteUrl);

  const items = featuredArticles(limit);
  if (!items.length) {
    section.hidden = true;
    return () => {};
  }

  const tpl = getTemplate();
  let root = container.querySelector(".w-root");
  let isHydrating = false;
  if (!root) {
    const frag = tpl.content.cloneNode(true);
    container.textContent = "";
    container.appendChild(frag);
    root = container.querySelector(".w-root");
  } else {
    isHydrating = true;
  }
  if (!root) return () => {};

  const listEl = root.querySelector(".w-list");
  if (listEl && (!isHydrating || listEl.children.length === 0)) {
    listEl.textContent = "";
    for (const art of items) {
      const li = document.createElement("li");
      li.className = "w-item";

      const a = document.createElement("a");
      const isExternal = art.externalUrl && art.href === art.externalUrl;
      bindSafeLink(a, art.href || "#", {
        target: isExternal ? "_blank" : undefined,
      });

      const card = document.createElement("article");
      card.className = "w-card";

      const left = document.createElement("div");
      left.className = "w-left";
      const meta = document.createElement("div");
      meta.className = "w-meta text-sm";
      const date = art.published ? formatDate(art.published) : "";
      const mins = Number(art.minutes) ? `${art.minutes} min` : "";
      const metaText = [date, mins].filter(Boolean).join(" • ");
      meta.textContent = metaText;
      const title = document.createElement("h4");
      title.className = "w-title sub-heading-2";
      title.textContent = String(art.title || "");
      left.appendChild(meta);
      left.appendChild(title);

      const right = document.createElement("div");
      right.className = "w-right";
      const spanLink = document.createElement("span");
      spanLink.className = "link";
      spanLink.appendChild(document.createTextNode("Read the article"));
      const icon = createSvgUse("icon-arrowRight-linear", {
        size: 24,
        className: "icon linear",
      });
      spanLink.appendChild(icon);
      right.appendChild(spanLink);

      card.appendChild(left);
      card.appendChild(right);
      a.appendChild(card);
      li.appendChild(a);
      listEl.appendChild(li);
    }
  }

  return () => {};
}

if (typeof window !== "undefined") {
  // @ts-ignore
  window.mountThoughts = mountThoughts;
}
