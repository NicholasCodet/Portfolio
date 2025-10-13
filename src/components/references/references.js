import "./references.css";
import tplHTML from "./references.html?raw";

import refsData from "../../data/references.json";

import { resolveAssetPath } from "../../scripts/utils/assets.js";
import { mountCarousel } from "../ui-carousel/ui-carousel.js";

let __tpl;
function getTemplate() {
  if (!__tpl) {
    const doc = new DOMParser().parseFromString(tplHTML, "text/html");
    const t = doc.querySelector("template");
    if (!t) throw new Error("references: <template> missing");
    __tpl = t;
  }
  return __tpl;
}

const baseUrl = import.meta.url;

export async function mountReferences({
  selector = "section.references",
  minItems = 5,
  pxPerSec = 20,
} = {}) {
  const section = document.querySelector(selector);
  if (!section) return () => {};
  const container = section.querySelector(".container");
  if (!container) return () => {};

  const items = Array.isArray(refsData?.corporates) ? refsData.corporates : [];
  if (!items.length) {
    section.hidden = true;
    return () => {};
  }

  let rowItems = items.slice();
  while (rowItems.length < minItems) rowItems = rowItems.concat(items);

  const tpl = getTemplate();
  let root = container.querySelector(".refs-layout");
  let isHydrating = false;
  if (!root) {
    const frag = tpl.content.cloneNode(true);
    container.textContent = "";
    container.appendChild(frag);
    root = container.querySelector(".refs-layout");
  } else {
    isHydrating = true;
  }
  if (!root) return () => {};

  const cleanupFns = [];

  const rows = root.querySelectorAll(".refs-row");
  const renderRow = (ul) => {
    for (const it of rowItems) {
      const li = document.createElement("li");
      li.className = "refs-logo";
      li.setAttribute("role", "listitem");
      const img = document.createElement("img");
      const p = it.file ? `../../assets/images/logos/${it.file}` : it.src || "";
      img.setAttribute("src", resolveAssetPath(p, baseUrl) || "");
      img.setAttribute("alt", it.alt || it.name || "Logo");
      const w = Number(it.width) || 160;
      const h = Number(it.height) || Math.round(w * 0.24);
      img.setAttribute("width", String(w));
      img.setAttribute("height", String(h));
      img.setAttribute("loading", "eager");
      img.setAttribute("decoding", "async");
      li.appendChild(img);
      ul.appendChild(li);
    }
  };

  rows.forEach((ul) => {
    if (!ul) return;
    if (ul.dataset.refsHydrated === "true" && !isHydrating) return;
    if (isHydrating) ul.textContent = "";
    renderRow(ul);
    ul.dataset.refsHydrated = "true";
  });

  const track = root.querySelector(".refs-track");
  if (track && track.dataset.refsCarouselHydrated !== "true") {
    const destroy = mountCarousel(track, {
      autoplay: {
        enabled: true,
        mode: "marquee",
        speed: pxPerSec,
        pauseOnHover: false,
        pauseOnVisibility: true,
      },
      draggable: false,
      keyboard: false,
      loop: true,
    });
    cleanupFns.push(() => {
      if (typeof destroy === "function") destroy();
      delete track.dataset.refsCarouselHydrated;
    });
    track.dataset.refsCarouselHydrated = "true";
  }

  return () => {
    cleanupFns.forEach((fn) => {
      try {
        if (typeof fn === "function") fn();
      } catch {}
    });
    rows.forEach((ul) => {
      if (ul) delete ul.dataset.refsHydrated;
    });
  };
}

if (typeof window !== "undefined") {
  // @ts-ignore
  window.mountReferences = mountReferences;
}
