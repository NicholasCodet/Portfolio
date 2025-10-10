import "./testimonials.css";
import tplHTML from "./testimonials.html?raw";

import testimonialsData from "../../data/testimonials.json";
import refsData from "../../data/references.json";

import { resolveAssetPath } from "../../scripts/utils/assets.js";
import { mountCarousel } from "../ui-carousel/ui-carousel.js";

let __tpl;
function getTemplate() {
  if (!__tpl) {
    const doc = new DOMParser().parseFromString(tplHTML, "text/html");
    const t = doc.querySelector("template");
    if (!t) throw new Error("testimonials: <template> missing");
    __tpl = t;
  }
  return __tpl;
}

const baseUrl = import.meta.url;

export function mountTestimonials({
  selector = "section.testimonials",
  limit = 3,
  startupsMinItems = 6,
  startupsPxPerSec = 20,
} = {}) {
  const section = document.querySelector(selector);
  if (!section) return () => {};
  const container = section.querySelector(".container");
  if (!container) return () => {};

  const list = Array.isArray(testimonialsData) ? testimonialsData : [];
  const cards = list.filter((t) => !t.main).slice(0, limit);
  if (!cards.length) {
    section.hidden = true;
    return () => {};
  }

  const tpl = getTemplate();
  const frag = tpl.content.cloneNode(true);
  const layout = frag.querySelector(".t-layout");
  const startupsRoot = frag.querySelector(".t-startups");
  const startupsTrack = startupsRoot?.querySelector(".t-startups-track");
  let hasStartupsCarousel = false;

  for (const t of cards) {
    const item = document.createElement("div");
    item.className = "t-item";
    const fig = document.createElement("figure");
    fig.className = "t-figure";

    const block = document.createElement("blockquote");
    block.className = "t-quote";
    const p = document.createElement("p");
    p.className = "text-md";
    p.textContent = String(t.quote || "");
    block.appendChild(p);

    const fc = document.createElement("figcaption");
    fc.className = "t-author";

    const avatarUrl = resolveAssetPath(t.avatar || "", baseUrl) || "";
    if (avatarUrl) {
      const img = document.createElement("img");
      img.className = "t-avatar";
      img.setAttribute("src", avatarUrl);
      img.setAttribute("alt", "");
      img.setAttribute("width", String(t.avatarW || 44));
      img.setAttribute("height", String(t.avatarH || 44));
      img.setAttribute("loading", "lazy");
      img.setAttribute("decoding", "async");
      fc.appendChild(img);
    }

    const meta = document.createElement("div");
    meta.className = "t-meta";
    const strong = document.createElement("strong");
    strong.className = "name";
    strong.textContent = String(t.author || "");
    const span = document.createElement("span");
    span.className = "role";
    const companyLabel = t.company ? ` @${t.company}` : "";
    span.textContent = [t.role || "", companyLabel].filter(Boolean).join("");
    meta.appendChild(strong);
    meta.appendChild(span);
    fc.appendChild(meta);

    fig.appendChild(block);
    fig.appendChild(fc);
    item.appendChild(fig);
    layout.appendChild(item);
  }

  if (startupsRoot && startupsTrack) {
    const rawStartups = Array.isArray(refsData?.startups) ? refsData.startups : [];
    const resolvedStartups = rawStartups
      .filter((it) => it && (it.file || it.src))
      .map((it) => {
        const rel = it.file
          ? `../../assets/images/logos/${it.file}`
          : it.src || "";
        const src = resolveAssetPath(rel, baseUrl) || "";
        if (!src) return null;
        return { ...it, _src: src };
      })
      .filter(Boolean);

    if (!resolvedStartups.length) {
      startupsRoot.remove();
    } else {
      const rows = Array.from(
        startupsTrack.querySelectorAll(".t-startups-row")
      );
      if (!rows.length) {
        startupsRoot.remove();
      } else {
        const minLogos = Math.max(1, Number(startupsMinItems) || 1);
        let rowItems = resolvedStartups.slice();
        while (rowItems.length < minLogos)
          rowItems = rowItems.concat(resolvedStartups);

        const renderRow = (ul) => {
          ul.textContent = "";
          for (const it of rowItems) {
            const li = document.createElement("li");
            li.className = "t-startups-logo";
            li.setAttribute("role", "listitem");
            const img = document.createElement("img");
            img.className = "t-startups-img";
            img.setAttribute("src", it._src);
            img.setAttribute("alt", it.alt || it.name || "Logo");
            const w = Number(it.width) || 160;
            const h = Number(it.height) || Math.round(w * 0.24);
            img.setAttribute("width", String(w));
            img.setAttribute("height", String(h));
            img.setAttribute("loading", "eager");
            img.setAttribute("decoding", "async");
            li.appendChild(img);
            ul.appendChild(li);
          }
        };

        rows.forEach((row) => renderRow(row));
        hasStartupsCarousel = rows.some((row) => row.children.length > 0);
        if (!hasStartupsCarousel) {
          startupsRoot.remove();
        }
      }
    }
  }

  container.textContent = "";
  container.appendChild(frag);

  let startupsCarouselInstance = null;
  if (hasStartupsCarousel) {
    const track = container.querySelector(".t-startups-track");
    if (track) {
      startupsCarouselInstance = mountCarousel(track, {
        autoplay: {
          enabled: true,
          mode: "marquee",
          speed: Number(startupsPxPerSec) || 20,
          pauseOnHover: false,
          pauseOnVisibility: true,
        },
        draggable: false,
        keyboard: false,
        loop: true,
      });
    }
  }

  // Equalize quote heights
  const getQuotes = () => Array.from(container.querySelectorAll(".t-quote"));
  const computeAndSetMax = () => {
    const root = container.querySelector(".t-layout");
    if (!root) return;
    root.style.removeProperty("--t-quote-h");
    const quotes = getQuotes();
    if (!quotes.length) return;
    const max = quotes.reduce(
      (acc, el) => Math.max(acc, el.getBoundingClientRect().height),
      0
    );
    if (max > 0) root.style.setProperty("--t-quote-h", `${Math.ceil(max)}px`);
  };
  const ro = new ResizeObserver(() => computeAndSetMax());
  getQuotes().forEach((el) => ro.observe(el));
  const onResize = () => computeAndSetMax();
  window.addEventListener("resize", onResize, { passive: true });
  requestAnimationFrame(computeAndSetMax);

  return () => {
    try {
      ro.disconnect();
    } catch {}
    window.removeEventListener("resize", onResize);
    if (startupsCarouselInstance && typeof startupsCarouselInstance.destroy === "function") {
      try {
        startupsCarouselInstance.destroy();
      } catch {}
    }
  };
}

if (typeof window !== "undefined") {
  // @ts-ignore
  window.mountTestimonials = mountTestimonials;
}
