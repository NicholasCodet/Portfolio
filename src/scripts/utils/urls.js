// urls.js
const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

export function sanitizeURL(raw) {
  if (!raw || typeof raw !== "string") return null;
  // autoriser ancres/relatives (#, /, ./, ../)
  if (
    raw.startsWith("#") ||
    raw.startsWith("/") ||
    raw.startsWith("./") ||
    raw.startsWith("../")
  ) {
    return raw;
  }
  try {
    const u = new URL(raw, window.location.origin);
    if (ALLOWED_PROTOCOLS.has(u.protocol)) return u.toString();
  } catch (_) {
    /* noop */
  }
  return null; // rejette javascript:, data:, etc.
}

export function bindSafeLink(a, rawHref, { target } = {}) {
  const href = sanitizeURL(rawHref);
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
