// assets.js
// Map all known assets at build time so we can resolve
// JSON-provided paths ('/src/assets/...', 'src/assets/...', 'assets/...', '../assets/...')
// to their final fingerprinted URL.
const __ASSET_URLS__ = import.meta.glob('../../assets/**/*', { eager: true, import: 'default' });

function lookupAssetFromRoot(relativeFromSrc) {
  // Keys in __ASSET_URLS__ look like '../../assets/...'
  const key = `../../${relativeFromSrc.replace(/^\/+/, '')}`; // ensure no leading slash
  return __ASSET_URLS__[key] || null;
}

export function resolveAssetPath(p, baseModuleUrl) {
  if (!p || typeof p !== "string") return null;
  // Absolute (http, data) -> keep as is
  if (/^(https?:|data:)/i.test(p)) return p;

  // Handle common notations pointing under src/assets
  // 1) '/src/...'
  if (/^\/?src\//i.test(p)) {
    const rel = p.replace(/^\/?src\//i, ''); // -> 'assets/...'
    const url = lookupAssetFromRoot(rel);
    if (url) return url;
  }

  // 2) '../assets/...' or 'assets/...': interpret from project src/ root
  if (/^(?:\.\.\/)+assets\//.test(p)) {
    const rel = p.replace(/^(?:\.\.\/)+/, ''); // strip leading ../
    const url = lookupAssetFromRoot(rel);
    if (url) return url;
  }
  if (/^assets\//.test(p)) {
    const url = lookupAssetFromRoot(p);
    if (url) return url;
  }

  // 3) Fallback to module-relative URL if provided
  if (baseModuleUrl) {
    try {
      const url = new URL(p, baseModuleUrl);
      if (url.protocol === "file:") {
        const pathname = url.pathname.replace(/\\/g, "/");
        const idx = pathname.lastIndexOf("/assets/");
        if (idx !== -1) {
          const assetPath = pathname.slice(idx);
          return assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
        }
        return pathname;
      }
      return url.href;
    } catch {}
  }
  return null;
}
