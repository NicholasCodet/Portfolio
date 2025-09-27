import "./footer.css";
import footerHTML from "./footer.html?raw";

import socialsDataRaw from "../../data/socials.json";
import { featuredCases } from "../../scripts/utils/cases.js";
import { filterByIds } from "../../scripts/utils/socials.js";
import { createSvgUse, inlineSpriteOnce } from "../../scripts/utils/svg.js";
import { bindSafeLink } from "../../scripts/utils/urls.js";
import { showToast } from "../../scripts/utils/toast.js";
import { createUIButton } from "../ui-button/ui-button.js";

let __footerTemplate;

function getTemplate() {
  if (!__footerTemplate) {
    const doc = new DOMParser().parseFromString(footerHTML, "text/html");
    const tpl = doc.querySelector("template");
    if (!tpl) throw new Error("footer: <template> missing");
    __footerTemplate = tpl;
  }
  return __footerTemplate;
}

// createSvgUse imported from utils/svg.js
function createSocialIconFromPaths(s, { size = 20, className = "icon" } = {}) {
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

export async function mountFooter(selector = "section.footer", opts = {}) {
  const root = document.querySelector(selector);
  if (!root) return () => {};
  const container = root.querySelector(".container");
  if (!container) return () => {};

  const {
    email = "hello@nicholascodet.com",
    spritePath = "../../assets/icons/sprite.svg",
    socialIds = ["LinkedIn", "Dribbble", "Medium", "GitHub"],
    projectsLimit = 4,
  } = opts;

  const tpl = getTemplate();
  const frag = tpl.content.cloneNode(true);

  // Resolve asset/data URLs relative to this module
  const base = new URL(".", import.meta.url);
  const spriteUrl = new URL(spritePath, base).href;
  // Use statically imported data to avoid fetch failures in dev/build
  const socialsAll = Array.isArray(socialsDataRaw) ? socialsDataRaw : [];

  // Ensure sprite available (works with both internal and external <use href>)
  inlineSpriteOnce(spriteUrl).catch(() => {});

  // Prepare actions container where we will inject UI buttons
  const actions = frag.querySelector(".actions");
  const yearP = frag.querySelector(".copyright");

  if (actions) {
    // clear previous children if any
    actions.textContent = "";
    // Email button (anchor)
    const { element: emailBtn } = createUIButton({
      label: "Email me",
      variant: "primary",
      className: "email",
      email,
      icon: "icon-mail-bold",
      iconPosition: "left",
    });

    // Copy email button
    const { element: copyButton, cleanup: cleanupCopy } = createUIButton({
      label: email,
      variant: "secondary",
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
          showToast("Email copied!");
        } catch {
          showToast("Copied!");
        }
      },
    });
    actions.appendChild(emailBtn);
    actions.appendChild(copyButton);
    // Track cleanup for the copy listener
    // We return cleanup later (see below)
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
        size: 20,
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
        size: 20,
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
    // buttons created via createUIButton return their own cleanup if needed
  };
}

// Optional global for convenience
if (typeof window !== "undefined") {
  // @ts-ignore
  window.mountFooter = mountFooter;
}
