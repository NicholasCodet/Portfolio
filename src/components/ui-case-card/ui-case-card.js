import "./ui-case-card.css";
import tplHTML from "./ui-case-card.html?raw";

import { resolveAssetPath } from "../../scripts/utils/assets.js";
import { createSvgUse } from "../../scripts/utils/svg.js";
import { bindSafeLink } from "../../scripts/utils/urls.js";

let __tpl;
function getTemplate() {
  if (!__tpl) {
    const doc = new DOMParser().parseFromString(tplHTML, "text/html");
    const t = doc.querySelector("template");
    if (!t) throw new Error("ui-case-card: <template> missing");
    __tpl = t;
  }
  return __tpl;
}

export function createCaseCard({
  title,
  description,
  href,
  imageUrl,
  spriteInline = true,
} = {}) {
  const tpl = getTemplate();
  const frag = tpl.content.cloneNode(true);
  const link = frag.querySelector(".cs-card-link");
  const media = frag.querySelector(".cs-media");
  const h4 = frag.querySelector(".cs-title");
  const desc = frag.querySelector(".cs-desc");
  const read = frag.querySelector(".link");

  if (link) bindSafeLink(link, href || "#");
  if (h4) h4.textContent = title || "";
  if (desc) {
    if (description) {
      desc.textContent = String(description);
    } else {
      desc.remove();
    }
  }

  if (media) {
    const resolved = imageUrl
      ? resolveAssetPath(imageUrl, import.meta.url) || imageUrl
      : "";
    if (resolved) {
      const img = document.createElement("img");
      img.setAttribute("src", resolved);
      img.setAttribute("alt", `${title || ""} preview`);
      img.setAttribute("loading", "lazy");
      img.setAttribute("decoding", "async");
      media.appendChild(img);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "img-placeholder";
      placeholder.setAttribute("aria-hidden", "true");
      media.appendChild(placeholder);
    }
  }

  if (read) {
    const icon = createSvgUse("icon-arrowRight-linear", {
      size: 24,
      className: "icon linear",
    });
    read.appendChild(icon);
  }

  return { element: frag.firstElementChild };
}

if (typeof window !== "undefined") {
  // @ts-ignore
  window.createCaseCard = createCaseCard;
}

// Alias export for naming convention consistency
export { createCaseCard as createUICaseCard };
