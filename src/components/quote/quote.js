import tplHTML from './quote.html?raw';
import './quote.css';
import testimonials from '../../data/testimonials.json';
import { resolveAssetPath } from '../../scripts/utils/assets.js';

let __tpl;
function getTemplate() {
  if (!__tpl) {
    const doc = new DOMParser().parseFromString(tplHTML, 'text/html');
    const t = doc.querySelector('template');
    if (!t) throw new Error('quote: <template> missing');
    __tpl = t;
  }
  return __tpl;
}

const baseUrl = import.meta.url;

export function mountQuote({ selector = 'section.quote', data = null, classPrefix = 'testimony', headlineClass = 'headline-1' } = {}) {
  const section = document.querySelector(selector) || document.querySelector('section.testimony');
  if (!section) return () => {};
  const container = section.querySelector('.container');
  if (!container) return () => {};

  const list = data && Array.isArray(data) ? data : (Array.isArray(testimonials) ? testimonials : []);
  const t = list.find((x) => x && x.main) || list[0];
  if (!t) { section.hidden = true; return () => {}; }

  const tpl = getTemplate();
  const frag = tpl.content.cloneNode(true);

  // Remap classes according to prefix
  const fig = frag.querySelector('.testimony-figure');
  const bq = frag.querySelector('.testimony-quote');
  const pEl = frag.querySelector('.testimony-quote p');
  const cap = frag.querySelector('.testimony-author');
  const meta = frag.querySelector('.testimony-meta');
  const nameEl = frag.querySelector('.testimony-meta .name');
  const roleEl = frag.querySelector('.testimony-meta .role');

  if (fig && classPrefix !== 'testimony') fig.className = `${classPrefix}-figure`;
  if (bq && classPrefix !== 'testimony') bq.className = `${classPrefix}-quote`;
  if (cap && classPrefix !== 'testimony') cap.className = `${classPrefix}-author`;
  if (meta && classPrefix !== 'testimony') meta.className = `${classPrefix}-meta`;

  if (pEl) {
    // support both { text, author, ... } and { quote, author, ... }
    const txt = t.text || t.quote || '';
    pEl.textContent = String(txt);
    // adjust heading style class
    pEl.className = headlineClass;
  }
  if (nameEl) nameEl.textContent = String(t.author || t.name || '');
  const companyLabel = t.company ? ` @${t.company}` : '';
  if (roleEl) roleEl.textContent = [t.role || '', companyLabel].filter(Boolean).join('');

  const avatarUrl = resolveAssetPath(t.avatar || '', baseUrl) || '';
  if (avatarUrl && cap) {
    const img = document.createElement('img');
    img.className = classPrefix === 'testimony' ? 'testimony-avatar' : `${classPrefix}-avatar`;
    img.setAttribute('src', avatarUrl);
    img.setAttribute('alt', '');
    img.setAttribute('width', String(t.avatarW || 44));
    img.setAttribute('height', String(t.avatarH || 44));
    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');
    cap.insertBefore(img, cap.firstChild);
  }

  container.textContent = '';
  container.appendChild(frag);

  return () => {};
}

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.mountQuote = mountQuote;
}
