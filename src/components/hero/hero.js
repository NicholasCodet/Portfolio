import socialsData from "../../data/socials.json";
import spriteHref from "../../assets/icons/sprite.svg?url";
import { filterByIds } from "../../scripts/utils/socials.js";
import { inlineSpriteOnce } from "../../scripts/utils/svg.js";
import { createUIButton } from "../ui-button/ui-button.js";
import { bindSafeLink } from "../../scripts/utils/urls.js";
import "./hero.css";
import tplHTML from "./hero.html?raw";

let __tpl;
function getTemplate() {
  if (!__tpl) {
    const doc = new DOMParser().parseFromString(tplHTML, "text/html");
    const t = doc.querySelector("template");
    if (!t) throw new Error("hero: <template> missing");
    __tpl = t;
  }
  return __tpl;
}

function createSocialIconFromPaths(s, { size = 24, className = "icon" } = {}) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("viewBox", s.viewBox || "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("class", className);
  const paths = Array.isArray(s.paths) ? s.paths : [];
  for (const p of paths) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", p.d || "");
    if (p.fillRule) path.setAttribute("fill-rule", p.fillRule);
    if (p.clipRule) path.setAttribute("clip-rule", p.clipRule);
    svg.appendChild(path);
  }
  return svg;
}

export async function mountHero({
  selector = "section.hero",
  email = "hello@nicholascodet.com",
  spritePath = spriteHref,
  socialIds = ["LinkedIn", "Dribbble", "Medium", "GitHub"],
} = {}) {
  const section = document.querySelector(selector);
  if (!section) return () => {};
  const container = section.querySelector(".container");
  if (!container) return () => {};

  const spriteUrl = new URL(spritePath, import.meta.url).href;
  await inlineSpriteOnce(spriteUrl);

  const tpl = getTemplate();
  const frag = tpl.content.cloneNode(true);
  const actions = frag.querySelector(".hero-actions");
  const list = frag.querySelector(".hero-list.socials");
  const orEl = frag.querySelector(".hero-actions .or");

  // Build email button via ui-button preset
  if (actions) {
    const { element: emailBtn } = createUIButton({
      label: "Email me",
      variant: "primary",
      className: "email",
      email,
      icon: "icon-mail-bold",
      iconPosition: "left",
    });
    actions.insertBefore(emailBtn, list);
    if (orEl && list) {
      // Ensure order: [email button] [OR] [socials]
      actions.insertBefore(orEl, list);
    }
  }

  const socials = filterByIds(
    Array.isArray(socialsData) ? socialsData : [],
    socialIds,
    (s) => s.name || s.id
  );
  if (list) {
    for (const s of socials) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      bindSafeLink(a, s.href || "#", { target: "_blank" });
      a.setAttribute("aria-label", s.ariaLabel || s.name || "Social link");
      const icon = createSocialIconFromPaths(s, {
        size: 24,
        className: "icon",
      });
      a.appendChild(icon);
      li.appendChild(a);
      list.appendChild(li);
    }
  }

  container.textContent = "";
  container.appendChild(frag);

  return () => {};
}

if (typeof window !== "undefined") {
  // @ts-ignore
  window.mountHero = mountHero;
}
