// urls.js
const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);
const FALLBACK_ORIGIN = "http://localhost";

function getBaseOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return FALLBACK_ORIGIN;
}

function isAllowedRelative(value) {
  return (
    value.startsWith("#") ||
    (value.startsWith("/") && !value.startsWith("//")) ||
    value.startsWith("./") ||
    value.startsWith("../")
  );
}

export function sanitizeHref(raw, { allowRelative = true } = {}) {
  if (typeof raw !== "string") return "";
  const value = raw.trim();
  if (!value) return "";

  if (allowRelative && isAllowedRelative(value)) {
    return value;
  }

  if (
    allowRelative &&
    !value.startsWith('//') &&
    !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)
  ) {
    return `/${value.replace(/^\/+/, '')}`;
  }

  try {
    const url = new URL(value, getBaseOrigin());
    if (ALLOWED_PROTOCOLS.has(url.protocol)) {
      return url.href;
    }
  } catch {
    // ignore
  }
  return "";
}

export function sanitizeURL(raw) {
  const href = sanitizeHref(raw);
  return href || null;
}

export function bindSafeLink(a, rawHref, { target } = {}) {
  const href = sanitizeHref(rawHref);
  if (!href) {
    // désactive le lien dangereux
    a.removeAttribute("href");
    a.setAttribute("aria-disabled", "true");
    a.tabIndex = -1;
    return;
  }
  a.setAttribute("href", href);

  if (target === "_blank") {
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
  } else {
    a.removeAttribute("target");
    a.removeAttribute("rel");
  }
}
