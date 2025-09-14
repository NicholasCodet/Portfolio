import { fetchJSON } from "./fetch-json.js";
import { escape } from "./dom.js";

export async function fetchSocials(url) {
  try {
    const list = await fetchJSON(url);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function filterByIds(list, ids, getId = (x) => x.name || x.id) {
  if (!Array.isArray(list)) return [];
  if (!ids || !ids.length) return list;
  const set = new Set(ids.map(String));
  return list.filter((x) => set.has(String(getId(x))));
}

export function renderSocialIcon(s, { size = 20, className = "icon", ariaHidden = true } = {}) {
  const vb = s.viewBox || "0 0 24 24";
  const paths = Array.isArray(s.paths) ? s.paths : [];
  return `
    <svg class="${className}" viewBox="${vb}" width="${size}" height="${size}" aria-hidden="${ariaHidden ? "true" : "false"}" focusable="false">
      ${paths.map((p) => {
        const fr = p.fillRule ? ` fill-rule="${p.fillRule}"` : "";
        const cr = p.clipRule ? ` clip-rule="${p.clipRule}"` : "";
        return `<path d="${p.d}"${fr}${cr}></path>`;
      }).join("")}
    </svg>
  `;
}

export function renderSocialLink(s, { withLabel = false, size = 20 } = {}) {
  const label = s.ariaLabel || s.name || "Social link";
  const icon = renderSocialIcon(s, { size });
  const content = withLabel ? `${icon} ${escape(s.name)}` : icon;
  const aria = withLabel ? `` : ` aria-label="${escape(label)}"`;
  return `<a href="${s.href}" target="_blank" rel="noopener"${aria}>${content}</a>`;
}

export function renderSocialItem(s, opts) {
  return `<li>${renderSocialLink(s, opts)}</li>`;
}

