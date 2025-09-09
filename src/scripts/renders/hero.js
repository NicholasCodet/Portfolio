// /src/scripts/renders/hero.js
import { fetchJSON } from "../utils/fetch-json.js";

export async function mountHero({
  selector = "section.hero",
  spritePath = "../../assets/icons/sprite.svg",
  email = "nicholas.codet@gmail.com",
  statusText = "Available Now",
  title = "Hey, I’m Nicholas Codet\nProduct Designer\nfor Saas and Deeptech.",
  lead = "I help ambitious companies turn complex ideas into digital experiences people love.",
  sub = "At the crossroads of product strategy, emerging technologies and human storytelling, I craft experiences that scale, connect and endure.",

  socialsPath = "../../data/socials.json",
  socialIds = ["LinkedIn", "Dribbble", "Medium", "GitHub"],
} = {}) {
  const section = document.querySelector(selector);
  if (!section) return;
  const container = section.querySelector(".container");
  if (!container) return;

  const spriteUrl = new URL(spritePath, import.meta.url).href;
  const socials = await safeSocials(
    new URL(socialsPath, import.meta.url).href,
    socialIds
  );

  container.innerHTML = `
    <div class="hero-wrap">
      <p class="availability">
        <span class="dot" aria-hidden="true"></span>
        <span class="txt">${statusText}</span>
      </p>

      <h1 class="hero-title">${escape(title).replaceAll("\\n", "<br>")}</h1>

      <p class="hero-lead">${escape(lead)}</p>
      <p class="hero-sub">${escape(sub)}</p>

      <div class="hero-actions">
        <a class="btn email" href="mailto:${email}">
          <svg class="icon" width="24" height="24" aria-hidden="true">
            <use href="${spriteUrl}#icon-mail-bold"></use>
          </svg>
          Email me
        </a>

        <span class="or" aria-hidden="true">OR</span>

        <ul class="socials" role="list" aria-label="Social links">
          ${socials.map((s) => svgSocial(s)).join("")}
        </ul>
      </div>
    </div>
  `;

  /* ------------- helpers ------------- */
  function escape(str = "") {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function svgSocial(s) {
    // socials.json fournit viewBox + paths → rendu inline
    const vb = s.viewBox || "0 0 24 24";
    const paths = Array.isArray(s.paths) ? s.paths : [];
    const label = s.ariaLabel || s.name || "Social link";
    return `
      <li>
        <a href="${s.href}" target="_blank" rel="noopener" aria-label="${escape(
      label
    )}">
          <svg class="icon" viewBox="${vb}" width="20" height="20" aria-hidden="true">
            ${paths.map((p) => `<path d="${p.d}"></path>`).join("")}
          </svg>
        </a>
      </li>
    `;
  }
}

async function safeSocials(url, ids) {
  try {
    const list = await fetchJSON(url);
    if (!Array.isArray(list)) return [];
    if (!ids || !ids.length) return list;
    const byName = new Map(list.map((x) => [String(x.name || x.id), x]));
    const selected = ids.map((id) => byName.get(String(id))).filter(Boolean);
    return selected.length ? selected : list;
  } catch {
    return [];
  }
}
