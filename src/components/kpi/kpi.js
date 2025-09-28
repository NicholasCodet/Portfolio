import "./kpi.css";
import tplHTML from "./kpi.html?raw";

let __tpl;
function getTemplate() {
  if (!__tpl) {
    const doc = new DOMParser().parseFromString(tplHTML, "text/html");
    const t = doc.querySelector("template");
    if (!t) throw new Error("kpi: <template> missing");
    __tpl = t;
  }
  return __tpl;
}

export function mountKPI(
  selector = "section.kpi",
  { items, duration = 1200, threshold = 0.25 } = {}
) {
  const section = document.querySelector(selector);
  if (!section) return () => {};
  const container = section.querySelector(".container");
  if (!container) return () => {};

  const tpl = getTemplate();
  const frag = tpl.content.cloneNode(true);
  const list = frag.querySelector(".kpi-list");

  // If template already contains items, keep them; else build from options
  if (!list.children.length && Array.isArray(items)) {
    for (const it of items) {
      const li = document.createElement("li");
      li.className = "kpi-item";
      const val = document.createElement("span");
      val.className = "kpi-value heading-1";
      const raw = String(it.value ?? "");
      const m = raw.match(/(-?\d+(?:\.\d+)?)(.*)/);
      const num = m ? m[1] : "0";
      const suffix = (m ? m[2] : "").trim();
      val.dataset.target = num;
      if (suffix) val.dataset.suffix = suffix;
      val.textContent = "0" + (suffix || "");
      const lab = document.createElement("span");
      lab.className = "kpi-label text-md";
      lab.textContent = String(it.label ?? "");
      li.appendChild(val);
      li.appendChild(lab);
      list.appendChild(li);
    }
  }

  container.textContent = "";
  container.appendChild(frag);

  // Animate on intersection
  const values = Array.from(container.querySelectorAll(".kpi-value"));

  const animateValue = (el) => {
    if (el.dataset.animated === "1") return;
    const targetStr = el.dataset.target || el.textContent || "0";
    const suffix = el.dataset.suffix || "";
    const end = parseFloat(targetStr) || 0;
    const decimals = (targetStr.split(".")[1] || "").length;
    const d = Math.max(200, Number(duration) || 1200);
    const startTime = performance.now();
    el.dataset.animated = "1";

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      const t = Math.min(1, (now - startTime) / d);
      const eased = easeOutCubic(t);
      const val = end * eased;
      el.textContent = `${val.toFixed(decimals)}${suffix}`;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = `${end.toFixed(decimals)}${suffix}`;
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          values.forEach(animateValue);
          io.disconnect();
          break;
        }
      }
    },
    { threshold: threshold }
  );

  io.observe(container);

  return () => io.disconnect();
}

if (typeof window !== "undefined") {
  // @ts-ignore
  window.mountKPI = mountKPI;
}
