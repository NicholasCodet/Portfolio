import { escape } from "../utils/dom.js";
import { fetchJSON } from "../utils/fetch-json.js";
import {
  fetchSocials,
  filterByIds,
  renderSocialItem,
} from "../utils/socials.js";
import { inlineSpriteOnce } from "../utils/svg.js";
import { showToast } from "../utils/toast.js";

export async function mountFooter({
  selector = ".section.footer",
  email = "nicholas.codet@gmail.com",

  spritePath = "../../assets/icons/sprite.svg",
  socialsPath = "../../data/socials.json",
  socialIds = ["LinkedIn", "Dribbble", "Medium", "GitHub"],
  caseStudiesPath = "../../data/case-studies.json",

  projectsLimit = 4,
} = {}) {
  const section = document.querySelector(selector);
  if (!section) return;

  const container = section.querySelector(".container");
  if (!container) return;

  const spriteUrl = new URL(spritePath, import.meta.url).href;

  const year = new Date().getFullYear();

  const csUrl = new URL(caseStudiesPath, import.meta.url).href;
  const soUrl = new URL(socialsPath, import.meta.url).href;
  const [csRaw, socialsRaw] = await Promise.all([
    fetchJSON(csUrl),
    fetchSocials(soUrl),
  ]);

  await inlineSpriteOnce(spriteUrl);

  const projects = Array.isArray(csRaw)
    ? pickSelected(csRaw, projectsLimit)
    : [];

  const socials = filterByIds(socialsRaw, socialIds, (s) => s.name || s.id);

  const projectsHTML = projects.map(toProjectLink).join("");
  const socialsHTML = socials
    .map((s) => renderSocialItem(s, { withLabel: true, size: 20 }))
    .join("");

  container.innerHTML = `
    <div class="ft-wrap">
      <div class="ft-about">
        <div class="block-id">
          <p class="name">Nicholas Codet</p>
          <p class="role">Product Designer</p>
        </div>
        <p class="location">
          Currently based in France,<br />Available across Europe.
        </p>
      </div>

      <div class="ft-contact">
        <div class="block-actions">
          <p class="headline-1">I'd love to hear about your project or idea. Let's connect.</p>

          <div class="actions">
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

            <a class="btn-md btn-secondary" href="#" role="button" data-email="${email}" aria-live="polite">
              <span class="shadow"></span>
              <span class="edge"></span>
              <span class="front">
                ${email}
                <svg class="icon linear" width="24" height="24" aria-hidden="true">
                  <use href="${spriteUrl}#icon-copy-linear"></use>
                </svg>
              </span>
              <span class="visually-hidden" aria-hidden="true">Copy email</span>
            </a>
          </div>
        </div>

        <div class="ft-links">
          <div class="block-projects">
            <h3 class="heading-3">Selected projects</h3>
            <ul class="ft-list projects">${projectsHTML}</ul>
          </div>

          <div class="block-socials">
            <h3 class="heading-3">Socials</h3>
            <ul class="ft-list socials" role="list" aria-label="Social links">${socialsHTML}</ul>
          </div>

        </div>
      </div>
    </div>

    <div class="ft-bottom" role="contentinfo">
      <p>© ${year} — Designed & coded <br class="break"/> by Nicholas Codet. All rights reserved.</p>
    </div>
  `;

  const copyLink = container.querySelector("[data-email]");
  if (copyLink) {
    const copyEmail = async () => {
      const text = copyLink.dataset.email || "";
      let success = false;

      try {
        if (
          navigator.clipboard &&
          typeof navigator.clipboard.writeText === "function"
        ) {
          await navigator.clipboard.writeText(text);
          success = true;
        }
      } catch {}

      // Fallback
      if (!success) {
        try {
          const sel = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(copyLink);
          sel.removeAllRanges();
          sel.addRange(range);
          success = document.execCommand("copy");
          sel.removeAllRanges();
        } catch {
          success = false;
        }
      }

      if (success) {
        copyLink.classList.add("copied");
        copyLink.setAttribute("aria-label", "Email copied");
        setTimeout(() => {
          copyLink.classList.remove("copied");
          copyLink.removeAttribute("aria-label");
        }, 1500);
        showToast(" ✓ Email copied");
      } else {
        if (typeof console !== "undefined") {
          console.warn(
            "Copy failed: clipboard API and fallbacks were not permitted."
          );
        }
      }
    };

    copyLink.addEventListener("click", (e) => {
      e.preventDefault();
      copyEmail();
    });

    copyLink.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        copyEmail();
      }
    });
  }

  // helpers
  function pickSelected(list, limit) {
    const featured = list.filter((x) => x.featured);
    const others = list.filter((x) => !x.featured);
    return featured.concat(others).slice(0, limit);
  }

  function toProjectLink(p) {
    const url =
      (p.href && String(p.href)) || (p.slug ? `/case/${p.slug}.html` : "#");
    const label = escape(p.title || "Untitled case");
    return `
      <li>
        <a href="${url}">
          <svg class="icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
            <use href="#icon-markerRight-bold"></use>
          </svg>
          ${label}
        </a>
      </li>
    `;
  }
}
