import { escape } from "../../utils/dom.js";
import { inlineSpriteOnce } from "../../utils/svg.js";

export async function mountCSHero({
  selector = ".section.case-hero",
  data = {},
  spritePath = "../../../assets/icons/sprite.svg",
} = {}) {
  const section = document.querySelector(selector);
  if (!section) return;
  const container = section.querySelector(".container");
  if (!container) return;

  const spriteUrl = new URL(spritePath, import.meta.url).href;
  await inlineSpriteOnce(spriteUrl);

  const title = escape(data.title || "Untitled case study");
  const summary = escape(data.summary || "");
  const note = "Not available for now";

  container.innerHTML = `
      <a class="link back" href="javascript:history.length>1?history.back(): '/'">
        <svg class="icon linear" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
          <use href="${spriteUrl}#icon-arrowLeft-linear"></use>
        </svg>
        Back
      </a>
      <h1 class="heading-1">${title}</h1>
      <p class="text-md summary">${summary}</p>

       <a class="btn-md btn-secondary is-disabled" href="#" role="button" aria-disabled="true" tabindex="-1">
          <span class="shadow"></span>
          <span class="edge"></span>
          <span class="front">Read the full case study</span>
        </a>
      <p class="hint text-sm">${escape(note)}</p>
  `;
}
