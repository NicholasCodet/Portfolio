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

