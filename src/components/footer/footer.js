import "./footer.css";
import tplHTML from "./footer.html?raw";

import spriteHref from "../../assets/icons/sprite.svg?url";
import socialsDataRaw from "../../data/socials.json";

import { featuredCases } from "../../scripts/utils/cases.js";
import { filterByIds } from "../../scripts/utils/socials.js";
import { createSvgUse, inlineSpriteOnce } from "../../scripts/utils/svg.js";
import { showToast } from "../../scripts/utils/toast.js";
import { bindSafeLink } from "../../scripts/utils/urls.js";
import { createUIButton } from "../ui-button/ui-button.js";

/*=== Get Template ===*/ /*Should I comp?*/
let __tpl;
function getTemplate() {
  if (!__tpl) {
    const doc = new DOMParser().parseFromString(tplHTML, "text/html");
    const t = doc.querySelector("template");
    if (!t) throw new Error("footer: <template> missing");
    __tpl = t;
  }
  return __tpl;
}

/*=== Set Social Icons ===*/ /*Should I comp?*/
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

/*=== Set Component ===*/
export function mountFooter(selector = ".section.footer", opts = {}) {
  const section = document.querySelector(selector);
  if (!section) return () => {};
  const container = section.querySelector(".container");
  if (!container) return () => {};

  const {
    email = "hello@nicholascodet.com",
    spritePath = spriteHref,
    socialIds = ["LinkedIn", "Dribbble", "Medium", "GitHub"],
    projectsLimit = 4,
  } = opts;

  const tpl = getTemplate();
  const frag = tpl.content.cloneNode(true);

  // Resolve asset/data URLs relative to this module
  const spriteUrl = new URL(spritePath, import.meta.url).href;

  // Use statically imported data to avoid fetch failures in dev/build
  const socialsAll = Array.isArray(socialsDataRaw) ? socialsDataRaw : [];

  // Ensure sprite available
  inlineSpriteOnce(spriteUrl).catch(() => {});

  // Prepare actions container where we will inject UI buttons
  const actions = frag.querySelector(".actions");
  const yearP = frag.querySelector(".copyright");

  const cleanupFns = [];

  if (actions) {
    // clear previous children if any
    actions.textContent = "";
    const defaultCopyLabel = email;
    const copiedLabel = "Email copied ✓";

    // Email button
    const { element: emailBtn, cleanup: cleanupEmailBtn } = createUIButton({
      label: "Email me",
      variant: "primary",
      className: "email-link",
      kind: "email",
      email,
      icon: "icon-mail-bold",
      iconPosition: "left",
    });
    if (typeof cleanupEmailBtn === "function") cleanupFns.push(cleanupEmailBtn);

    // Copy email button
    const { element: copyButton, cleanup: cleanupCopy } = createUIButton({
      label: defaultCopyLabel,
      variant: "secondary",
      className: "copy-email",
      icon: "icon-copy-linear",
      iconPosition: "right",
      borderless: true,
      onClick: async () => {
        try {
          if (
            navigator.clipboard &&
            typeof navigator.clipboard.writeText === "function"
          ) {
            await navigator.clipboard.writeText(email);
          }
          showToast(copiedLabel);
        } catch {
          showToast("Email Copied ✓");
        }
      },
    });

    actions.appendChild(emailBtn);
    actions.appendChild(copyButton);

    // Track cleanup for the copy listener
    if (typeof cleanupCopy === "function") cleanupFns.push(cleanupCopy);
  }

  if (yearP) {
    const year = new Date().getFullYear();
    yearP.textContent = `© ${year} — Designed & coded by Nicholas Codet. All rights reserved.`;
  }

  // Fill Projects
  const featured = featuredCases(projectsLimit);
  const projList = frag.querySelector(".ft-list.projects");
  if (projList) {
    for (const p of featured) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.className = "link";
      bindSafeLink(a, p.href || "#");
      const icon = createSvgUse("icon-markerRight-bold", {
        size: 24,
        className: "icon",
      });
      a.appendChild(icon);
      const label = document.createTextNode(
        p && p.title ? String(p.title) : "Untitled case"
      );
      a.appendChild(label);
      li.appendChild(a);
      projList.appendChild(li);
    }
  }

  // Fill Socials
  const socials = filterByIds(socialsAll, socialIds, (s) => s.name || s.id);
  const socialList = frag.querySelector(".ft-list.socials");
  if (socialList) {
    for (const s of socials) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.className = "link";
      bindSafeLink(a, s.href || "#", { target: "_blank" });
      a.setAttribute("aria-label", s.ariaLabel || s.name || "Social link");
      const icon = createSocialIconFromPaths(s, {
        size: 24,
        className: "icon",
      });
      a.appendChild(icon);
      const text = document.createTextNode(` ${s.name || ""}`);
      a.appendChild(text);
      li.appendChild(a);
      socialList.appendChild(li);
    }
  }

  // Mount
  container.appendChild(frag);

  return function cleanup() {
    cleanupFns.forEach((fn) => {
      try {
        if (typeof fn === "function") fn();
      } catch {
        // Ignore cleanup errors
      }
    });
  };
}

// Optional global for convenience
if (typeof window !== "undefined") {
  // @ts-ignore
  window.mountFooter = mountFooter;
}
