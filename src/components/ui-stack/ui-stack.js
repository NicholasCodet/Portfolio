import "./ui-stack.css";
import tplHTML from "./ui-stack.html?raw";

let __tpl;
function getTemplate() {
  if (!__tpl) {
    const doc = new DOMParser().parseFromString(tplHTML, "text/html");
    const t = doc.querySelector("template");
    if (!t) throw new Error("ui-stack: <template> missing");
    __tpl = t;
  }
  return __tpl;
}

function resolveSrc(path = "") {
  const s = String(path || "");
  if (s.startsWith("/src/")) return s;
  if (s.startsWith("src/")) return "/" + s;
  return s;
}

export function mountUIStack(
  rootOrSelector,
  {
    images = [],
    rotations = [-2, -4, 3],
    scaleStep = 0.98,
    maxVisible = 3,
    swipeThreshold = 40,
    desktopDefaultDirection = "left", // 'left' | 'right' | 'up' | 'down'
  } = {}
) {
  const root =
    typeof rootOrSelector === "string"
      ? document.querySelector(rootOrSelector)
      : rootOrSelector;
  if (!root) return () => {};

  const tpl = getTemplate();
  const frag = tpl.content.cloneNode(true);
  const stack = frag.querySelector(".ui-stack");
  root.textContent = "";
  root.appendChild(frag);

  const items = [];
  const normalised = images
    .map((entry) => {
      if (!entry) return null;
      if (typeof entry === "string") {
        return { src: resolveSrc(entry) };
      }
      if (typeof entry === "object") {
        const rawSrc = entry.src || entry.url || entry.href || "";
        const src = resolveSrc(rawSrc);
        if (!src) return null;
        const width = Number(entry.width ?? entry.w ?? entry.pixelWidth);
        const height = Number(entry.height ?? entry.h ?? entry.pixelHeight);
        const alt = typeof entry.alt === "string" ? entry.alt : "";
        return {
          src,
          width: Number.isFinite(width) && width > 0 ? width : null,
          height: Number.isFinite(height) && height > 0 ? height : null,
          alt,
        };
      }
      return null;
    })
    .filter((item) => item && item.src);

  for (const meta of normalised) {
    const item = document.createElement("div");
    item.className = "ui-stack-item";
    const img = document.createElement("img");
    img.src = meta.src;
    img.alt = meta.alt || "";
    img.loading = "lazy";
    img.decoding = "async";
    if (Number.isFinite(meta.width) && meta.width > 0) {
      img.setAttribute("width", String(Math.round(meta.width)));
    }
    if (Number.isFinite(meta.height) && meta.height > 0) {
      img.setAttribute("height", String(Math.round(meta.height)));
    }
    item.appendChild(img);
    stack.appendChild(item);
    items.push(item);
  }
  if (!items.length) return () => {};

  function layoutStack() {
    const visible = Math.min(maxVisible, items.length);
    items.forEach((el, i) => {
      el.style.zIndex = String(items.length - i);
      if (i < visible) {
        const rot = rotations[i % rotations.length] || 0;
        const sc = Math.pow(scaleStep, i);
        const dy = 6 * i; // slight translation to accentuate "posed" effect
        el.style.transform = `translate(0, ${dy}px) rotate(${rot}deg) scale(${sc})`;
        el.style.opacity = "1";
        el.style.pointerEvents = i === 0 ? "auto" : "none";
      } else {
        const rotLast = rotations[(visible - 1) % rotations.length] || 0;
        const scLast = Math.pow(scaleStep, visible - 1);
        const dyLast = 6 * (visible - 1);
        el.style.transform = `translate(0, ${dyLast}px) rotate(${rotLast}deg) scale(${scLast})`;
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
      }
      el.style.transition = "transform 260ms ease, opacity 200ms ease";
    });
  }

  function cycle(dir = 1, axis = "x") {
    if (!items.length) return;
    const top = items[0];
    const w = stack.clientWidth || 300;
    const h = stack.clientHeight || 200;
    const sign = dir >= 0 ? 1 : -1;
    stack.classList.add("is-animating");
    top.classList.add("is-exiting");
    // swipe out with fade
    if (axis === "y") {
      top.style.transform = `translate(0, ${sign * -(h * 1.1)}px) rotate(${
        sign * -8
      }deg)`; // up by default (negative)
    } else {
      top.style.transform = `translate(${sign * (w * 1.1)}px, 0) rotate(${
        sign * 14
      }deg)`;
    }
    top.style.opacity = "0";
    const onEnd = () => {
      top.removeEventListener("transitionend", onEnd);
      // move first to end
      items.push(items.shift());
      // reset style for moved element
      top.classList.remove("is-exiting");
      top.style.transition = "none";
      top.style.transform = "";
      top.style.opacity = "";
      layoutStack();
      // allow transitions again
      requestAnimationFrame(() => {
        items.forEach(
          (el) =>
            (el.style.transition = "transform 260ms ease, opacity 200ms ease")
        );
        stack.classList.remove("is-animating");
        bindTopInteractions();
      });
    };
    top.addEventListener("transitionend", onEnd);
  }

  // Interaction handlers on top item only
  let startX = 0;
  let dragging = false;
  let ptrId = null;
  let lastPointerType = "mouse";
  function bindTopInteractions() {
    const top = items[0];
    // Remove potential stale inline handlers
    top.onpointerdown = null;
    top.onpointermove = null;
    top.onpointerup = null;
    top.onpointercancel = null;
    top.ontouchstart = null;
    top.ontouchmove = null;
    top.ontouchend = null;
    const onDown = (e) => {
      if (stack.classList.contains("is-animating")) return;
      dragging = true;
      startX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
      ptrId = e.pointerId;
      lastPointerType = e.pointerType || (e.touches ? "touch" : "mouse");
      top.setPointerCapture?.(ptrId);
      top.style.transition = "none";
    };
    const onMove = (e) => {
      if (!dragging) return;
      const x = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? startX;
      const dx = x - startX;
      top.style.transform = `translate(${dx}px, 0) rotate(${dx * 0.04}deg)`;
      // fade out progressively with distance
      const w = stack.clientWidth || 300;
      const fade = Math.min(1, Math.abs(dx) / (w * 0.6));
      top.style.opacity = String(1 - fade * 0.85);
    };
    const onUp = (e) => {
      if (!dragging) return;
      dragging = false;
      const x =
        e.clientX ??
        (e.changedTouches && e.changedTouches[0]?.clientX) ??
        startX;
      const dx = x - startX;
      // restore transition so exit animation runs
      top.style.transition = "";
      if (Math.abs(dx) > swipeThreshold) {
        cycle(dx >= 0 ? 1 : -1, "x");
      } else {
        // Desktop default: swipe left or up; Mobile: simple tap advances forward (left)
        if (lastPointerType === "mouse") {
          const dir = (desktopDefaultDirection || "left").toLowerCase();
          const mapping = {
            left: { sign: -1, axis: "x" },
            right: { sign: 1, axis: "x" },
            up: { sign: 1, axis: "y" },
            down: { sign: -1, axis: "y" },
          };
          const { sign, axis } = mapping[dir] || mapping.left;
          cycle(sign, axis);
        } else {
          cycle(-1, "x");
        }
      }
      try {
        if (ptrId != null) top.releasePointerCapture(ptrId);
      } catch {}
      ptrId = null;
    };
    top.onpointerdown = onDown;
    top.onpointermove = onMove;
    top.onpointerup = onUp;
    top.onpointercancel = onUp;
    top.ontouchstart = onDown;
    top.ontouchmove = onMove;
    top.ontouchend = onUp;
  }

  layoutStack();
  // If only one image, keep it fixed (no swipe/click)
  if (items.length < 2) {
    const top = items[0];
    if (top) top.style.pointerEvents = "none";
    stack.style.cursor = "default";
    return () => {};
  }
  bindTopInteractions();

  const cleanup = () => {};
  return cleanup;
}

if (typeof window !== "undefined") {
  // @ts-ignore
  window.mountUIStack = mountUIStack;
}
