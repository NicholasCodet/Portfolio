import { fetchJSON } from "../utils/fetch-json.js";

// Footer statique + projects dynamiques (case-studies.json)
export async function mountFooter({
  selector = "footer.section.footer",
  email = "nicholas.codet@gmail.com",
  caseStudiesPath = "../../data/case-studies.json",

  socialsPath = "../../data/socials.json",
  socialIds = ["LinkedIn", "Dribbble", "Medium", "GitHub"],

  spritePath = "../../assets/icons/sprite.svg",
  projectsLimit = 4,
} = {}) {
  const root = document.querySelector(selector);
  if (!root) return;
  const container = root.querySelector(".container");
  if (!container) return;

  const spriteUrl = new URL(spritePath, import.meta.url).href;
  const year = new Date().getFullYear();

  // --- Selected projects + Socials (from JSON) ---
  const csUrl = new URL(caseStudiesPath, import.meta.url).href;
  const soUrl = new URL(socialsPath, import.meta.url).href;
  const [csRaw, socialsRaw] = await Promise.all([
    fetchJSON(csUrl),
    fetchJSON(soUrl),
  ]);
  const projects = Array.isArray(csRaw)
    ? pickSelected(csRaw, projectsLimit)
    : [];
  const socials = filterSocials(socialsRaw, socialIds);

  const projectsHTML = projects.map(toProjectLink).join("");
  const socialsHTML = socials.map(svgSocial).join("");

  container.innerHTML = `
    <div class="footer-grid">
      <div class="footer-col about">
        <div class="id-block">
          <p class="name">Nicholas Codet</p>
          <p class="role">Product Designer</p>
        </div>
        <p class="location">
          Currently based in France,<br />Available across Europe.
        </p>
      </div>

      <div class="footer-col contact">
        <div class="cta">
          <p class="headline">I’d love to hear about your project or idea.<br>Let’s connect.</p>
          <div class="actions">
            <!-- 1) Email me (ouvre le client mail) -->
            <a class="btn email" href="mailto:${email}">
              <svg class="icon" width="24" height="24" aria-hidden="true">
                <use href="${spriteUrl}#icon-mail-bold"></use>
              </svg>
              Email me
            </a>

            <!-- 2) Copy email (copie dans presse-papiers) -->
            <a class="btn email-copy" href="#" data-email="${email}" aria-live="polite">
              <span class="email-text">${email}</span>
              <svg class="icon" width="20" height="20" aria-hidden="true">
                <use href="${spriteUrl}#icon-copy-linear"></use>
              </svg>
              <span class="visually-hidden" aria-hidden="true">Copy email</span>
            </a>
          </div>
        </div>

        <div class="lists">
          <div class="block">
            <h3 class="h3">Selected projects</h3>
            <ul class="foot-list projects">${projectsHTML}</ul>
          </div>
          <div class="block">
            <h3 class="h3">Socials</h3>
            <ul class="foot-list socials" role="list" aria-label="Social links">${socialsHTML}</ul>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bottom" role="contentinfo">
      <p>© ${year} — Designed & coded by Nicholas Codet. All rights reserved.</p>
    </div>
  `;

  // === Copy to clipboard (anchor version) ===
  const copyLink = container.querySelector(".email-copy");
  if (copyLink) {
    copyLink.addEventListener("click", async (e) => {
      e.preventDefault();
      const text = copyLink.dataset.email || "";
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback (non sécurisé / http)
          const input = document.createElement("input");
          input.value = text;
          document.body.appendChild(input);
          input.select();
          document.execCommand("copy");
          input.remove();
        }
        copyLink.classList.add("copied");
        copyLink.setAttribute("aria-label", "Email copied");
        setTimeout(() => {
          copyLink.classList.remove("copied");
          copyLink.removeAttribute("aria-label");
        }, 1500);
      } catch {
        /* noop */
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
    return `<li><a href="${url}">${escape(
      p.title || "Untitled case"
    )}</a></li>`;
  }
  function filterSocials(list, ids) {
    if (!Array.isArray(list)) return [];
    if (!ids || !ids.length) return list;
    const byName = new Map(list.map((x) => [String(x.name || x.id), x]));
    const out = ids.map((id) => byName.get(String(id))).filter(Boolean);
    return out.length ? out : list;
  }
  function svgSocial(s) {
    const vb = s.viewBox || "0 0 24 24";
    const paths = Array.isArray(s.paths) ? s.paths : [];
    const label = s.ariaLabel || s.name || "Social link";
    return `
      <li>
        <a href="${s.href}" target="_blank" rel="noopener" aria-label="${escape(
      label
    )}">
          <svg class="icon" viewBox="${vb}" width="20" height="20" aria-hidden="true" focusable="false" fill="currentColor">
            ${paths
              .map((p) => {
                const fr = p.fillRule ? ` fill-rule="${p.fillRule}"` : "";
                const cr = p.clipRule ? ` clip-rule="${p.clipRule}"` : "";
                return `<path d="${p.d}"${fr}${cr}></path>`;
              })
              .join("")}
          </svg>
          ${escape(s.name)}
        </a>
      </li>
    `;
  }
  function escape(str = "") {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}
