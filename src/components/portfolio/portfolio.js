import { featuredCases } from "../../scripts/utils/cases.js";
import { fetchJSON } from "../../scripts/utils/fetch-json.js";
import { inlineSpriteOnce } from "../../scripts/utils/svg.js";
import { createUICaseCard as createCaseCard } from "../ui-case-card/ui-case-card.js";
import { createUIButton } from "../ui-button/ui-button.js";
import { bindSafeLink } from "../../scripts/utils/urls.js";
import "./portfolio.css";
import tplHTML from "./portfolio.html?raw";

let __tpl;
function getTemplate() {
  if (!__tpl) {
    const doc = new DOMParser().parseFromString(tplHTML, "text/html");
    const t = doc.querySelector("template");
    if (!t) throw new Error("portfolio: <template> missing");
    __tpl = t;
  }
  return __tpl;
}

async function fetchDribbbleShots({ token, perPage = 10 } = {}) {
  if (!token) return null;
  const url = `https://api.dribbble.com/v2/user/shots?per_page=${perPage}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((s) => ({
      url: s.html_url || "#",
      image:
        (s.images && (s.images.hidpi || s.images.two_x || s.images.normal)) ||
        "",
      title: s.title || "Dribbble Shot",
    }));
  } catch {
    return null;
  }
}

export async function mountCaseStudies({
  selector = "section.case-studies",
  spritePath = "../../assets/icons/sprite.svg",
  caseLimit = 4,
  dribbbleProfile = "nicholascodet",
  dribbbleToken = (import.meta.env && import.meta.env.VITE_DRIBBBLE_TOKEN) ||
    "",
  shotsPath = "../../data/shots.json",
  shotsLimit = 10,
} = {}) {
  const section = document.querySelector(selector);
  if (!section) return () => {};
  const container = section.querySelector(".container");
  if (!container) return () => {};

  const spriteUrl = new URL(spritePath, import.meta.url).href;
  await inlineSpriteOnce(spriteUrl);

  const tpl = getTemplate();
  const frag = tpl.content.cloneNode(true);
  const layout = frag.querySelector(".cs-layout");
  const explore = frag.querySelector(".cs-explore");
  const rail = frag.querySelector(".explore-rail");
  const ctaTop = frag.querySelector(".cs-explore-cta-top");
  const ctaBottom = frag.querySelector(".cs-explore-cta-bottom");
  // Deferred initializer + cleanup for shots marquee
  let initShotsMarqueeFn = null;
  let shotsCleanup = null;

  // Render case cards
  const items = featuredCases(caseLimit);
  for (const it of items) {
    const { element } = createCaseCard({
      title: it.title,
      description: it.description,
      href: it.href,
      imageUrl: it.thumbnailUrl || it.thumbnail || "",
    });
    layout.appendChild(element);
  }

  // Build Dribbble CTA once, movable
  const dribbbleHref = `https://dribbble.com/${dribbbleProfile}`;
  const { element: cta } = createUIButton({
    label: "See more on Dribbble",
    variant: "secondary",
    href: dribbbleHref,
    target: "_blank",
    rel: "noopener",
  });

  // Shots: try Dribbble API, else fallback to local JSON
  let shots =
    (await fetchDribbbleShots({ token: dribbbleToken, perPage: shotsLimit })) ||
    [];
  if (!shots.length) {
    const fbUrl = new URL(shotsPath, import.meta.url).href;
    shots = (await fetchJSON(fbUrl)) || [];
    if (!Array.isArray(shots)) shots = [];
    // Show newest-last entries first: take last N then reverse
    shots =
      shotsLimit > 0
        ? shots.slice(-shotsLimit).reverse()
        : shots.slice().reverse();
  }

  if (!shots.length) {
    explore.hidden = true;
  } else {
    // Render shots
    rail.innerHTML = "";
    for (const s of shots) {
      const a = document.createElement("a");
      a.className = "explore-card";
      bindSafeLink(a, s.url || "#", { target: "_blank" });
      a.setAttribute("aria-label", s.title || "Dribbble Shot");
      const src = String(s.image || "");
      if (src) {
        const img = document.createElement("img");
        img.setAttribute("src", src);
        img.setAttribute("alt", s.title || "Dribbble Shot");
        img.setAttribute("loading", "lazy");
        img.setAttribute("decoding", "async");
        a.appendChild(img);
      } else {
        const ph = document.createElement("div");
        ph.className = "img-placeholder";
        ph.setAttribute("aria-hidden", "true");
        a.appendChild(ph);
      }
      rail.appendChild(a);
    }

    // Position CTA: top for desktop, bottom for mobile
    const mq = window.matchMedia("(min-width: 576px)");
    const placeCta = () => {
      if (mq.matches) {
        ctaTop.textContent = "";
        ctaTop.appendChild(cta);
      } else {
        ctaBottom.textContent = "";
        ctaBottom.appendChild(cta);
      }
    };
    placeCta();
    mq.addEventListener?.("change", placeCta);

    // Prepare marquee init to run after fragment is attached to DOM
    initShotsMarqueeFn = () => {
      // Continuous marquee with smooth hover slowdown
      rail.style.scrollSnapType = "none";
      rail.style.overflowX = "hidden";

      const originals = Array.from(rail.children);
      const originalWidth = rail.scrollWidth; // measure after attach

      (function ensureOverflow() {
        let guard = 0;
        while (rail.scrollWidth < originalWidth * 2 && guard < 4) {
          originals.forEach((child) => rail.appendChild(child.cloneNode(true)));
          guard++;
        }
      })();

      let rafId = 0;
      let lastTs = 0;
      const baseSpeed = 50; // px/s
      let curSpeed = baseSpeed;
      let targetSpeed = baseSpeed;

      const tick = (ts) => {
        if (!lastTs) lastTs = ts;
        const dt = Math.max(0, (ts - lastTs) / 1000);
        lastTs = ts;
        const smoothing = 4; // per-second approach rate
        curSpeed += (targetSpeed - curSpeed) * Math.min(1, dt * smoothing);

        let nx = rail.scrollLeft + curSpeed * dt;
        if (originalWidth > 0 && nx >= originalWidth - 1) nx -= originalWidth;
        rail.scrollLeft = nx;
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);

      const onEnter = () => { targetSpeed = 0; };
      const onLeave = () => { targetSpeed = baseSpeed; };
      rail.addEventListener("mouseenter", onEnter);
      rail.addEventListener("mouseleave", onLeave);

      const onVis = () => { targetSpeed = document.hidden ? 0 : baseSpeed; };
      document.addEventListener("visibilitychange", onVis);

      let io;
      try {
        io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            targetSpeed = entry.isIntersecting ? baseSpeed : 0;
          });
        }, { threshold: 0.1 });
        io.observe(rail);
      } catch {}

      shotsCleanup = () => {
        try { cancelAnimationFrame(rafId); } catch {}
        rail.removeEventListener("mouseenter", onEnter);
        rail.removeEventListener("mouseleave", onLeave);
        document.removeEventListener("visibilitychange", onVis);
        if (io) io.disconnect();
      };
    };
  }

  container.textContent = "";
  container.appendChild(frag);
  if (initShotsMarqueeFn) requestAnimationFrame(() => initShotsMarqueeFn());

  // Equalize .cs-desc heights based on tallest description
  const getDescs = () => Array.from(layout.querySelectorAll('.cs-desc'));
  const computeAndSetMaxDesc = () => {
    if (!layout) return;
    layout.style.removeProperty('--cs-desc-h');
    const descs = getDescs();
    if (!descs.length) return;
    const max = descs.reduce((acc, el) => Math.max(acc, el.getBoundingClientRect().height), 0);
    if (max > 0) layout.style.setProperty('--cs-desc-h', `${Math.ceil(max)}px`);
  };
  const ro = new ResizeObserver(() => computeAndSetMaxDesc());
  getDescs().forEach((el) => ro.observe(el));
  const onResize = () => computeAndSetMaxDesc();
  window.addEventListener('resize', onResize, { passive: true });
  requestAnimationFrame(computeAndSetMaxDesc);

  return () => {
    try { ro.disconnect(); } catch {}
    window.removeEventListener('resize', onResize);
    if (shotsCleanup) { try { shotsCleanup(); } catch {} shotsCleanup = null; }
  };
}

if (typeof window !== "undefined") {
  // @ts-ignore
  window.mountCaseStudies = mountCaseStudies;
}
