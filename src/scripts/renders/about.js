// @/src/scripts/renders/about.js
import { fetchJSON } from "../utils/fetch-json.js";
import { escape } from "../utils/dom.js";
import { fetchSocials, filterByIds, renderSocialItem } from "../utils/socials.js";

export async function mountAbout({
  selector = "section.about",
  eyebrow = "Beyond design",
  title = "Designing with empathy, clarity and ambition",
  ledeTitle = "Design, for me, is about turning complexity into clarity.",
  lede = "I believe design should make innovation accessible and human. My journey has taken me from startups to deeptech, where I’ve helped teams turn complex ideas into meaningful products people actually use. Along the way, I’ve blended strategy, design craft and collaboration, guided by empathy and the ambition to create clarity out of complexity.",
  name = "Nicholas Codet",
  role = "Product Designer",
  photo = "/src/assets/images/about/profile.jpg", // 4:3

  socialsPath = "../../data/socials.json",
  toolkitPath = "../../data/toolkit.json",
  socialIds = ["LinkedIn", "Dribbble", "Medium", "GitHub"],
  toolIds = [],
} = {}) {
  const root = document.querySelector(selector);
  if (!root) return;
  const container = root.querySelector(".container");
  if (!container) return;

  // --- Fetch data (soft-fail)
  const socials = filterByIds(
    await fetchSocials(new URL(socialsPath, import.meta.url).href),
    socialIds,
    (s) => s.name || s.id
  );
  const tools = filterByIds(
    (await fetchJSON(new URL(toolkitPath, import.meta.url).href)) || [],
    toolIds,
    (t) => t.id || t.label
  );

  const photoUrl = resolve(photo);

  // --- Render
  container.innerHTML = `
    <div class="about-grid">
      <header class="about-head" aria-labelledby="about-title">
        <p class="eyebrow">${escape(eyebrow)}</p>
        <h2 id="about-title" class="h2">${escape(title)}</h2>
      </header>

      <figure class="about-media">
        ${
          photoUrl
            ? `<img src="${photoUrl}" alt="Portrait of ${escape(
                name
              )}" loading="lazy" decoding="async">`
            : ""
        }
      </figure>

      <div class="about-meta">
        <div class="about-id">
          <strong class="name">${escape(name)}</strong>
          <span class="role">${escape(role)}</span>
        </div>
        <ul class="about-socials" role="list" aria-label="Social links">
          ${socials.map((s) => renderSocialItem(s, { withLabel: false, size: 20 })).join("")}
        </ul>
      </div>

      <div class="about-right">
        <h3 class="lede-title">${escape(ledeTitle)}</h3>
        <p class="lede">${escape(lede)}</p>
      </div>

      <div class="career">
        <h3 class="h3">Career path</h3>
        <ul class="career-list" role="list">
          <li class="career-row"><span class="c-title">Design Engineer</span><span class="c-company">Freelance</span><span class="c-period">2022 – Now</span></li>
          <li class="career-row"><span class="c-title">Lead Designer</span><span class="c-company">1Kubator</span><span class="c-period">2021 – 2023</span></li>
          <li class="career-row"><span class="c-title">Product Designer</span><span class="c-company">1Kubator</span><span class="c-period">2019 – 2021</span></li>
          <li class="career-row"><span class="c-title">Graphic Designer</span><span class="c-company">Armor Group</span><span class="c-period">2017 – 2018</span></li>
        </ul>
      </div>

      <div class="toolkit">
        <h3 class="h3">Design toolkit</h3>
        <ul class="tools" role="list" aria-label="Design tools">
          ${tools.map((t) => svgTool(t)).join("")}
        </ul>
      </div>
    </div>
  `;

  // --- Mobile-only autoloop for the toolkit rail (no duplicates on desktop)
  const toolsEl = container.querySelector(".tools");
  setupMobileAutoloop(toolsEl);
}

/* ================= Helpers ================= */
function resolve(p) {
  if (!p) return "";
  return p.startsWith("/src/")
    ? new URL("../../" + p.slice(5), import.meta.url).href
    : p;
}
function svgTool(t) {
  if (t.paths && t.paths.length) {
    const vb = t.viewBox || "0 0 24 24";
    return `<li class="tool"><span class="tool-badge" data-label="${esc(
      t.label
    )}">
      <svg viewBox="${vb}" width="22" height="22" aria-hidden="true">
        ${t.paths.map((p) => `<path d="${p.d}"></path>`).join("")}
      </svg></span></li>`;
  }
  return `<li class="tool"><span class="tool-badge" data-label="${esc(
    t.label
  )}">${esc(t.label?.[0] || "")}</span></li>`;
}

/* ============= Mobile autoloop rail ============= */
function setupMobileAutoloop(list) {
  if (!list) return;

  // snapshot de la liste originale pour pouvoir la restaurer en desktop
  if (!list.dataset.original) list.dataset.original = list.innerHTML;

  const mqMobile = window.matchMedia("(max-width: 63.999rem)");
  const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  let raf = null;
  let paused = false;

  const start = () => {
    cancelAnimationFrame(raf);
    if (!mqMobile.matches || mqReduce.matches) return;

    // assure qu'on n'a pas de doublons : on repart de l'original à chaque activation mobile
    if (list.dataset.mode !== "mobile") {
      list.innerHTML =
        list.dataset.original + list.dataset.original + list.dataset.original; // triple pour une boucle douce
      list.dataset.mode = "mobile";
      list.scrollLeft = 0;
    }

    const originalWidth = list.scrollWidth / 3; // largeur d'un cycle
    const speed = 0.45; // px/frame

    const tick = () => {
      if (!mqMobile.matches || mqReduce.matches) return; // stop si on sort du mobile
      if (!paused) {
        list.scrollLeft += speed;
        if (list.scrollLeft >= originalWidth) list.scrollLeft = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };

  const stop = () => {
    cancelAnimationFrame(raf);
    // si on passe desktop, on restaure la liste d'origine (zéro duplicata)
    if (!mqMobile.matches && list.dataset.mode === "mobile") {
      list.innerHTML = list.dataset.original;
      list.dataset.mode = "desktop";
      list.scrollLeft = 0;
    }
  };

  // interactions utilisateur : pause/reprise
  list.addEventListener("mouseenter", () => (paused = true));
  list.addEventListener("mouseleave", () => (paused = false));
  list.addEventListener("touchstart", () => (paused = true), { passive: true });
  list.addEventListener("touchend", () => (paused = false), { passive: true });

  // réagit aux changements d'état
  mqMobile.addEventListener?.("change", () => {
    stop();
    start();
  });
  mqReduce.addEventListener?.("change", () => {
    stop();
    start();
  });

  // init
  stop(); // s'assure que l'état desktop est propre
  start();
}
