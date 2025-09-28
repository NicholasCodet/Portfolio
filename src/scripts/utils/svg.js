// SVG-related helpers

let __spriteInlined = false;

export async function inlineSpriteOnce(url, { rootId = "__sprite_inline" } = {}) {
  if (__spriteInlined || document.getElementById(rootId)) return;
  try {
    const res = await fetch(url);
    if (!res.ok) return;
    const text = await res.text();
    const div = document.createElement("div");
    div.innerHTML = text.trim();
    const svg = div.querySelector("svg");
    if (!svg) return;
    svg.id = rootId;
    svg.setAttribute("aria-hidden", "true");
    svg.style.position = "absolute";
    svg.style.width = "0";
    svg.style.height = "0";
    svg.style.overflow = "hidden";
    document.body.prepend(svg);
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
