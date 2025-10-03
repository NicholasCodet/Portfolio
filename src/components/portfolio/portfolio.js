import "./portfolio.css";
import tplHTML from "./portfolio.html?raw";

import { featuredCases } from "../../scripts/utils/cases.js";
import { fetchJSON } from "../../scripts/utils/fetch-json.js";
import { inlineSpriteOnce } from "../../scripts/utils/svg.js";
import { bindSafeLink } from "../../scripts/utils/urls.js";
import { createUIButton } from "../ui-button/ui-button.js";
import { createUICaseCard as createCaseCard } from "../ui-case-card/ui-case-card.js";

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

const MODULE_ORIGIN = (() => {
  try {
    return new URL(import.meta.url).origin;
  } catch {
    return null;
  }
})();

function resolveLocalShotsUrl(path) {
  try {
    const resolved = new URL(path, import.meta.url);
    if (MODULE_ORIGIN && resolved.origin !== MODULE_ORIGIN) {
      console.warn("[mountCaseStudies] blocked cross-origin shots url", resolved.href);
      return null;
    }
    return resolved.href;
  } catch {
    return null;
  }
}

export async function mountCaseStudies({
  selector = "section.case-studies",
  spritePath = "../../assets/icons/sprite.svg",
  caseLimit = 4,
  dribbbleProfile = "nicholascodet",
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

  let shots = [];
  const fbUrl = resolveLocalShotsUrl(shotsPath);
  if (fbUrl) {
    shots = (await fetchJSON(fbUrl)) || [];
    if (!Array.isArray(shots)) shots = [];
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
    const track = document.createElement("div");
    track.className = "explore-track";
    rail.appendChild(track);

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
      track.appendChild(a);
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
      const originals = Array.from(track.children);
      if (!originals.length) return;

      const style = getComputedStyle(track);
      const gap = parseFloat(style.gap || "0") || 0;
      const cycleDistance = (() => {
        const width = originals.reduce(
          (acc, node) => acc + node.getBoundingClientRect().width,
          0
        );
        return width + gap * originals.length;
      })();

      if (cycleDistance <= 0) return;

      (function ensureOverflow() {
        let guard = 0;
        const minWidth = Math.max(
          cycleDistance * 2,
          rail.clientWidth + cycleDistance
        );
        while (track.scrollWidth < minWidth && guard < 6) {
          originals.forEach((child) => {
            const clone = child.cloneNode(true);
            clone.setAttribute("aria-hidden", "true");
            clone.setAttribute("tabindex", "-1");
            clone.querySelectorAll("img").forEach((img) => {
              img.setAttribute("loading", "eager");
              img.setAttribute("decoding", "sync");
            });
            track.appendChild(clone);
          });
          guard++;
        }
      })();

      const baseSpeed = 30; // px/s
      let curSpeed = baseSpeed;
      let targetSpeed = baseSpeed;
      let offset = 0;
      let rafId = 0;
      let lastTs = 0;

      const setSpeed = (value, immediate = false) => {
        targetSpeed = value;
        if (immediate) curSpeed = value;
      };

      const tick = (ts) => {
        if (!lastTs) lastTs = ts;
        const dt = Math.max(0, (ts - lastTs) / 1000);
        lastTs = ts;
        const smoothing = 4;
        curSpeed += (targetSpeed - curSpeed) * Math.min(1, dt * smoothing);
        offset += curSpeed * dt;
        if (cycleDistance > 0) {
          while (offset >= cycleDistance) offset -= cycleDistance;
          while (offset < 0) offset += cycleDistance;
        }
        track.style.transform = `translate3d(${-offset}px, 0, 0)`;
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);

      let isHovering = false;
      let isIntersecting = true;

      const updateState = ({ immediate = false } = {}) => {
        const shouldRun = !document.hidden && isIntersecting && !isHovering;
        setSpeed(shouldRun ? baseSpeed : 0, immediate);
      };

      const onEnter = () => {
        isHovering = true;
        updateState();
      };
      const onLeave = () => {
        isHovering = false;
        updateState({ immediate: true });
      };
      rail.addEventListener("mouseenter", onEnter);
      rail.addEventListener("mouseleave", onLeave);
      rail.addEventListener("focusin", onEnter);
      rail.addEventListener("focusout", onLeave);

      const onVis = () => updateState({ immediate: !document.hidden });
      document.addEventListener("visibilitychange", onVis);

      let io;
      try {
        io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.target === rail) {
                isIntersecting = entry.isIntersecting;
              }
            });
            updateState({ immediate: isIntersecting });
          },
          { threshold: 0.1 }
        );
        io.observe(rail);
      } catch {}

      updateState({ immediate: true });

      shotsCleanup = () => {
        try {
          cancelAnimationFrame(rafId);
        } catch {}
        rail.removeEventListener("mouseenter", onEnter);
        rail.removeEventListener("mouseleave", onLeave);
        rail.removeEventListener("focusin", onEnter);
        rail.removeEventListener("focusout", onLeave);
        document.removeEventListener("visibilitychange", onVis);
        if (io) io.disconnect();
        track.style.transform = "";
      };
    };
  }

  container.textContent = "";
  container.appendChild(frag);
  if (initShotsMarqueeFn) requestAnimationFrame(() => initShotsMarqueeFn());

  // Equalize .cs-desc heights based on tallest description
  const getDescs = () => Array.from(layout.querySelectorAll(".cs-desc"));
  const mq = window.matchMedia("(min-width: 576px)");

  const computeAndSetMaxDesc = () => {
    if (!layout) return;
    layout.style.removeProperty("--cs-desc-h");
    if (!mq.matches) return; // skip equalisation on mobile
    const descs = getDescs();
    if (!descs.length) return;
    const max = descs.reduce(
      (acc, el) => Math.max(acc, el.getBoundingClientRect().height),
      0
    );
    if (max > 0) layout.style.setProperty("--cs-desc-h", `${Math.ceil(max)}px`);
  };
  const ro = new ResizeObserver(() => computeAndSetMaxDesc());
  getDescs().forEach((el) => ro.observe(el));
  const onResize = () => computeAndSetMaxDesc();
  window.addEventListener("resize", onResize, { passive: true });
  mq.addEventListener?.("change", computeAndSetMaxDesc);
  requestAnimationFrame(computeAndSetMaxDesc);

  return () => {
    try {
      ro.disconnect();
    } catch {}
    window.removeEventListener("resize", onResize);
    mq.removeEventListener?.("change", computeAndSetMaxDesc);
    if (shotsCleanup) {
      try {
        shotsCleanup();
      } catch {}
      shotsCleanup = null;
    }
  };
}

if (typeof window !== "undefined") {
  // @ts-ignore
  window.mountCaseStudies = mountCaseStudies;
}
