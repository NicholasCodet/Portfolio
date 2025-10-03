export function loadAllArticles() {
  const modules = import.meta.glob("../../data/articles/*.json", {
    eager: true,
    import: "default",
  });
  const dev = import.meta.env && import.meta.env.DEV;
  const list = [];
  for (const [path, data] of Object.entries(modules)) {
    try {
      const slug = String(path)
        .split("/")
        .pop()
        .replace(/\.json$/i, "");
      const card = data && data.card ? data.card : data || {};
      const title =
        card && card.title
          ? String(card.title)
          : data && data.title
          ? String(data.title)
          : "Untitled";
      const published = card && card.published ? String(card.published) : "";
      const minutes = Number.isFinite(Number(card && card.minutes))
        ? Number(card.minutes)
        : null;
      const tags = Array.isArray(card && card.tags)
        ? card.tags.map(String)
        : [];
      const date = published; // alias for consistency
      const externalUrl = card && card.url ? String(card.url) : "";
      const href =
        externalUrl ||
        `${dev ? "/src/pages/articles" : "/articles"}/${slug}.html`;
      const featured = Boolean(card && card.featured);

      list.push({
        slug,
        title,
        published,
        minutes,
        tags,
        date,
        href,
        externalUrl,
        featured,
        raw: data,
      });
    } catch {
      // ignore bad entries
    }
  }
  return list;
}

export function recentArticles(limit = 3) {
  const all = loadAllArticles();
  all.sort((a, b) => {
    const da = a.published ? Date.parse(a.published) : 0;
    const db = b.published ? Date.parse(b.published) : 0;
    if (db !== da) return db - da; // newest first
    const ta = (a.title || "").toLowerCase();
    const tb = (b.title || "").toLowerCase();
    return ta < tb ? -1 : ta > tb ? 1 : 0;
  });
  return typeof limit === "number" && limit > 0 ? all.slice(0, limit) : all;
}

export function featuredArticles(limit = 3) {
  const all = loadAllArticles();
  let items = all.filter((a) => a && a.featured === true);
  if (items.length === 0) items = all; // fallback if none marked featured
  items.sort((a, b) => {
    const da = a.published ? Date.parse(a.published) : 0;
    const db = b.published ? Date.parse(b.published) : 0;
    if (db !== da) return db - da; // newest first
    const ta = (a.title || "").toLowerCase();
    const tb = (b.title || "").toLowerCase();
    return ta < tb ? -1 : ta > tb ? 1 : 0;
  });
  return typeof limit === "number" && limit > 0 ? items.slice(0, limit) : items;
}

export function getArticleBySlug(slug) {
  const all = loadAllArticles();
  return all.find((a) => a.slug === slug) || null;
}
