import {
  fetchSocials,
  filterByIds,
  renderSocialItem,
} from "../utils/socials.js";
import { inlineSpriteOnce } from "../utils/svg.js";

export async function mountHero({
  selector = "section.hero",
  email = "nicholas.codet@gmail.com",

  spritePath = "../../assets/icons/sprite.svg",
  socialsPath = "../../data/socials.json",
  socialIds = ["LinkedIn", "Dribbble", "Medium", "GitHub"],
} = {}) {
  const section = document.querySelector(selector);
  if (!section) return;

  const container = section.querySelector(".container");
  if (!container) return;

  const spriteUrl = new URL(spritePath, import.meta.url).href;

  await inlineSpriteOnce(spriteUrl);
  const socials = filterByIds(
    await fetchSocials(new URL(socialsPath, import.meta.url).href),
    socialIds
  );

  container.innerHTML = `
    <div class="hero-wrap">
      <span class="status-badge">
        <span class="dot" aria-hidden="true"></span>
        <span class="label">Available Now</span>
      </span>

      <div class="hero-head">
        <h1 class="heading-1"> Hey, I'm Nicholas Codet Product Designer for Saas and Deeptech. </h1>
        <p class="headline-1"> I help ambitious companies turn complex ideas into digital experiences people love. </p>
        <p> At the crossroads of product strategy, emerging technologies and human storytelling, I craft experiences that scale, connect and endure. </p>
      </div>

      <div class="hero-actions">
        <a class="btn-md btn-primary" href="mailto:${email}" role="button">
          <span class="shadow"></span>
          <span class="edge"></span>
          <span class="front">
          <svg class="icon bold" width="24" height="24" aria-hidden="true">
            <use href="${spriteUrl}#icon-mail-bold"></use>
          </svg>
          Email me
          </span>
        </a>

        <span class="or" aria-hidden="true">OR</span>

        <ul class="hero-list socials" role="list" aria-label="Social links">
          ${socials
            .map((s) => renderSocialItem(s, { withLabel: false, size: 20 }))
            .join("")}
        </ul>
      </div>
    </div>
  `;
}
