// SVG-related helpers

let __spriteInlined = false;

export async function inlineSpriteOnce(url, { rootId = "__sprite_inline" } = {}) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (__spriteInlined || document.getElementById(rootId)) return;

  let resolvedHref;
  try {
    resolvedHref = new URL(url, window.location?.href || document.baseURI || "");
  } catch {
    return;
  }

  if (resolvedHref.origin !== window.location.origin) {
    console.warn("[inlineSpriteOnce] blocked cross-origin sprite", resolvedHref.href);
    return;
  }

  try {
    const res = await fetch(resolvedHref.href);
    if (!res.ok) return;
    const contentType = res.headers.get("content-type") || "";
    if (contentType && !/image\/svg\+xml/i.test(contentType)) return;

    const text = await res.text();
    if (!text.trim()) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) return;
    if (doc.querySelector("script")) {
      console.warn("[inlineSpriteOnce] rejected sprite containing script tags");
      return;
    }

    const imported = document.importNode(svg, true);
    imported.id = rootId;
    imported.setAttribute("aria-hidden", "true");
    imported.style.position = "absolute";
    imported.style.width = "0";
    imported.style.height = "0";
    imported.style.overflow = "hidden";
    document.body.prepend(imported);
    __spriteInlined = true;
  } catch {
    // ignore fetch/inject errors
  }
}

// Create an <svg><use href="#id"></use></svg> element
export function createSvgUse(
  idOrHref,
  {
    size = 24,
    className = "icon",
    viewBox = "0 0 24 24",
    ariaHidden = true,
    autoVariantClass = true,
  } = {}
) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("viewBox", viewBox);
  svg.setAttribute("focusable", "false");
  svg.setAttribute("aria-hidden", ariaHidden ? "true" : "false");

  const classSet = new Set(
    typeof className === "string"
      ? className.split(/\s+/).filter(Boolean)
      : Array.isArray(className)
      ? className.flatMap((c) => String(c).split(/\s+/).filter(Boolean))
      : []
  );

  if (autoVariantClass && idOrHref) {
    const id = String(idOrHref).replace(/^#/, "");
    const match = id.match(/-(bold|linear)$/i);
    if (match) classSet.add(match[1].toLowerCase());
  }

  if (classSet.size > 0) {
    svg.setAttribute("class", Array.from(classSet).join(" "));
  }

  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  const href = String(idOrHref || "").startsWith("#")
    ? String(idOrHref)
    : `#${String(idOrHref)}`;
  use.setAttribute("href", href);
  svg.appendChild(use);
  return svg;
}
