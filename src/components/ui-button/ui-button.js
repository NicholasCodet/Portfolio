import "./ui-button.css";
import tplHTML from "./ui-button.html?raw";

import { createSvgUse } from "../../scripts/utils/svg.js";
import { bindSafeLink } from "../../scripts/utils/urls.js";

/*=== Get Template ===*/ /*Should I comp?*/
let __tpl;
function getTemplate() {
  if (!__tpl) {
    const doc = new DOMParser().parseFromString(tplHTML, "text/html");
    const t = doc.querySelector("template");
    if (!t) throw new Error("ui-button: <template> missing");
    __tpl = t;
  }
  return __tpl;
}

// createSvgUse now imported from utils/svg.js
export function createUIButton({
  label,
  variant = "primary", // 'primary' | 'secondary'
  href,
  target,
  rel,
  onClick,
  icon,
  iconPosition = "left", // 'left' | 'right'
  disabled = false,
  size = "md", // 'md' | 'sm' | 'lg'
  clickSound = true,
  pressFeedback = true,

  // Convenience semantics
  kind,
  email, // used when kind==='email' or extra class indicates email
  className, // extra classes to add (space-separated)
  attrs = {},
  type = "button", // for <button> | <a>
} = {}) {
  const tpl = getTemplate();
  const frag = tpl.content.cloneNode(true);
  const structure = frag.querySelector(".ui-btn");
  if (!structure) throw new Error("ui-button: structure missing");

  // Determine semantic preset from kind or className
  const extraClass = typeof className === "string" ? className : "";
  const hasEmailClass = /(?:^|\s)(email|is-email|btn-email)(?:\s|$)/.test(
    extraClass || ""
  );
  const isEmail = kind === "email" || hasEmailClass;

  // Compute href if needed (email preset)
  let computedHref = href;
  if (isEmail && !computedHref) {
    const emailAddr =
      email ||
      (attrs && (attrs["data-email"] || attrs["data-mail"])) ||
      "hello@nicholascodet.com";
    computedHref = `mailto:${emailAddr}`;
    if (!icon) icon = "icon-mail-bold";
    if (!(attrs && Object.prototype.hasOwnProperty.call(attrs, "aria-label"))) {
      attrs = { ...(attrs || {}), "aria-label": "Send me an email" };
    }
  }

  const isLink = typeof computedHref === "string" && computedHref.length > 0;
  const el = document.createElement(isLink ? "a" : "button");
  // Always include btn-md to benefit from existing base styles,
  // and add size modifier for future-specific styles.
  el.className = `btn-md btn-${variant}`;
  if (size && size !== "md") el.classList.add(`btn-${size}`);
  if (extraClass) {
    for (const c of extraClass.split(/\s+/).filter(Boolean))
      el.classList.add(c);
  }

  // Transfer structure children into the host element
  while (structure.firstChild) {
    el.appendChild(structure.firstChild);
  }

  const labelEl = el.querySelector(".label");
  const leftSlot = el.querySelector(".icon-left");
  const rightSlot = el.querySelector(".icon-right");
  if (labelEl) labelEl.textContent = label || "";

  // Icon handling
  if (icon) {
    const id = typeof icon === "string" ? icon : icon.id;
    if (id) {
      const iconEl = createSvgUse(id, {
        size: 24,
        className: icon && icon.className ? icon.className : "icon",
      });
      if (iconPosition === "right") {
        rightSlot && rightSlot.appendChild(iconEl);
      } else {
        leftSlot && leftSlot.appendChild(iconEl);
      }
    }
  }

  if (isLink) {
    bindSafeLink(el, computedHref, { target });
    if (rel && target !== "_blank") el.setAttribute("rel", rel);
    // Accessible disabled link
    if (disabled) {
      el.setAttribute("aria-disabled", "true");
      el.setAttribute("tabindex", "-1");
      el.addEventListener("click", (e) => e.preventDefault());
    }
  } else {
    el.setAttribute("type", type || "button");
    if (disabled) el.setAttribute("disabled", "true");
  }

  if (attrs && typeof attrs === "object") {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null) continue;
      if (k === "class" || k === "className") {
        for (const c of String(v).split(/\s+/).filter(Boolean))
          el.classList.add(c);
      } else {
        el.setAttribute(k, String(v));
      }
    }
  }

  // Allow opting out of global click sound utility
  if (!clickSound) {
    el.dataset.noClickSound = "true";
  }

  // Allow opting out of global press feedback utility
  if (!pressFeedback) {
    el.dataset.noPressFeedback = "true";
  }

  let onClickRef = null;
  if (typeof onClick === "function" && !disabled) {
    onClickRef = (e) => onClick(e, el);
    el.addEventListener("click", onClickRef);
  }

  const cleanup = () => {
    if (onClickRef) el.removeEventListener("click", onClickRef);
  };

  return { element: el, cleanup };
}

export function mountUIButton(selector, options) {
  const host = document.querySelector(selector);
  if (!host) return () => {};
  const { element, cleanup } = createUIButton(options);
  host.appendChild(element);
  return cleanup;
}

if (typeof window !== "undefined") {
  // @ts-ignore
  window.createUIButton = createUIButton;
  // @ts-ignore
  window.mountUIButton = mountUIButton;
}
