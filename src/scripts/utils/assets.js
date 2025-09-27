// assets.js
export function resolveAssetPath(p, baseModuleUrl) {
  if (!p || typeof p !== "string") return null;
  // URL absolue (http, data) -> laisse tel quel
  if (/^(https?:|data:)/i.test(p)) return p;

  // Normaliser chemins typés '/src/...'(absolu) ou 'src/...'(relatif au root)
  let path = p;
  if (p.startsWith('/src/')) path = p.slice(5);
  else if (p.startsWith('src/')) path = p.slice(4);

  try {
    // important : base = import.meta.url du MODULE qui consomme le JSON
    const url = new URL(path, baseModuleUrl);
    return url.href; // laisse Vite émettre un asset fingerprinté
  } catch (_) {
    return null;
  }
}
