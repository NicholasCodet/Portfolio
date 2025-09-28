import "./ui-fab.css";
import tplHTML from "./ui-fab.html?raw";

import { inlineSpriteOnce } from "../../scripts/utils/svg.js";

let __tpl;
function getTemplate() {
  if (!__tpl) {
    const doc = new DOMParser().parseFromString(tplHTML, "text/html");
    const t = doc.querySelector("template");
    if (!t) throw new Error("ui-fab: <template> missing");
    __tpl = t;
  }
  return __tpl;
}

export async function mountUIFab({
  spritePath = "../../assets/icons/sprite.svg",
  iconId = "icon-arrowTop-linear",
  threshold = 200,
} = {}) {
  const tpl = getTemplate();
  const frag = tpl.content.cloneNode(true);
  const btn = frag.querySelector(".ui-fab");
  const use = frag.querySelector(".fab-icon");

  try {
    const spriteUrl = new URL(spritePath, import.meta.url).href;
    await inlineSpriteOnce(spriteUrl);
    if (use) use.setAttribute("href", `#${iconId}`);
  } catch {}

  if (!btn) return () => {};

  const onClick = (e) => {
    e.preventDefault();
    try {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    } catch {
      window.scrollTo(0, 0);
    }
  };
  btn.addEventListener("click", onClick);

  // Insert into DOM
  document.body.appendChild(frag);

  const el = document.querySelector(".ui-fab");
  if (!el) return () => {};

  // Toggle on scroll
  let lastVisible = false;
  const update = () => {
    const vis =
      (window.scrollY || document.documentElement.scrollTop || 0) > threshold;
    if (vis !== lastVisible) {
      lastVisible = vis;
      el.classList.toggle("is-visible", vis);
    }
  };
  update();
  const onScroll = () => update();
  const onResize = () => update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });

  return () => {
    try {
      btn.removeEventListener("click", onClick);
    } catch {}
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    try {
      el.remove();
    } catch {}
  };
}

if (typeof window !== "undefined") {
  // @ts-ignore
  window.mountUIFab = mountUIFab;
}
