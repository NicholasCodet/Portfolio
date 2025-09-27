// Utils for loading and normalizing case study data from src/data/cases/*.json

function normalizeThumbnailPath(path, baseUrl) {
  if (!path) return "";
  // Convert "/src/..." to a file URL relative to this module so Vite serves it
  if (path.startsWith("/src/")) {
    try {
      const rel = "../../" + path.slice(5); // remove leading /src/
      return new URL(rel, baseUrl).href;
    } catch {
      return path;
    }
  }
  return path;
}

export function loadAllCases() {
  // Eagerly import all case JSON files
  const modules = import.meta.glob("../../data/cases/*.json", { eager: true, import: "default" });
  const baseUrl = import.meta.url;
  const list = [];
  for (const [path, data] of Object.entries(modules)) {
    try {
      const slug = String(path).split("/").pop().replace(/\.json$/i, "");
      const card = data && data.card ? data.card : data || {};
      const title = card && card.title ? String(card.title) : (data && data.title ? String(data.title) : "Untitled case");
      const description = card && card.description ? String(card.description) : (data && (data.description || data.summary) ? String(data.description || data.summary) : "");
      const thumbnail = card && card.thumbnail ? String(card.thumbnail) : (data && data.thumbnail ? String(data.thumbnail) : "");
      const featured = card && Object.prototype.hasOwnProperty.call(card, 'featured') ? Boolean(card.featured) : Boolean(data && data.featured);
      const priority = Number.isFinite(Number(card && card.priority)) ? Number(card.priority) : (Number.isFinite(Number(data && data.priority)) ? Number(data.priority) : 0);
      const tags = Array.isArray(card && card.tags) ? card.tags.map(String) : [];
      const date = card && typeof card.date === 'string' ? card.date : '';
      const dev = import.meta.env && import.meta.env.DEV;
      const href = `${dev ? "/src/pages" : "/cases"}/${slug}.html`;
      const thumbnailUrl = normalizeThumbnailPath(thumbnail, baseUrl);

      list.push({ slug, title, description, thumbnail, thumbnailUrl, featured, priority, href, tags, date, raw: data });
    } catch {
      // ignore malformed entries
    }
  }

  return list;
}

export function featuredCases(limit = 4) {
  const all = loadAllCases();
  const items = all.filter((c) => c && c.featured === true);
  items.sort((a, b) => {
    const pa = Number.isFinite(a.priority) ? a.priority : 0;
    const pb = Number.isFinite(b.priority) ? b.priority : 0;
    if (pb !== pa) return pb - pa; // priority desc
    const ta = (a.title || "").toLowerCase();
    const tb = (b.title || "").toLowerCase();
    if (ta !== tb) return ta < tb ? -1 : 1;
    return (a.slug || "") < (b.slug || "") ? -1 : 1;
  });
  return typeof limit === "number" && limit > 0 ? items.slice(0, limit) : items;
}

export function getCaseBySlug(slug) {
  const all = loadAllCases();
  return all.find((c) => c.slug === slug) || null;
}
