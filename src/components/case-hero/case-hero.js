import tplHTML from './case-hero.html?raw';
import './case-hero.css';
import { inlineSpriteOnce } from '../../scripts/utils/svg.js';

let __tpl;
function getTemplate() {
  if (!__tpl) {
    const doc = new DOMParser().parseFromString(tplHTML, 'text/html');
    const t = doc.querySelector('template');
    if (!t) throw new Error('case-hero: <template> missing');
    __tpl = t;
  }
  return __tpl;
}

export async function mountCaseHero({ selector = '.section.case-hero', data = {}, spritePath = '../../assets/icons/sprite.svg' } = {}) {
  const section = document.querySelector(selector);
  if (!section) return () => {};
  const container = section.querySelector('.container');
  if (!container) return () => {};

  const tpl = getTemplate();
  const frag = tpl.content.cloneNode(true);
  const wrap = frag.querySelector('.case-hero-wrap');
  const titleEl = frag.querySelector('.case-title');
  const sumEl = frag.querySelector('.summary');
  const metaEl = frag.querySelector('.case-meta');
  const backIconUse = frag.querySelector('.back-icon');

  // Inline sprite for back icon
  try {
    const spriteUrl = new URL(spritePath, import.meta.url).href;
    await inlineSpriteOnce(spriteUrl);
    if (backIconUse) backIconUse.setAttribute('href', `${spriteUrl}#icon-arrowLeft-linear`);
  } catch {}

  const title = String(data['case-title'] || data.title || 'Untitled case study');
  const summary = String(data.summary || '');
  if (titleEl) titleEl.textContent = title;
  if (sumEl) sumEl.textContent = summary;

  // Render meta items if available
  const metaItems = Array.isArray(data.meta) ? data.meta : [];
  if (metaEl && metaItems.length) {
    for (const m of metaItems) {
      const item = document.createElement('div');
      item.className = 'case-meta-item';
      const lab = document.createElement('p');
      lab.className = 'text-sm sub-heading-2';
      lab.textContent = String((m && m.label) || '-');
      const val = document.createElement('p');
      val.className = 'text-md';
      val.textContent = String((m && m.value) || '—');
      item.appendChild(lab);
      item.appendChild(val);
      metaEl.appendChild(item);
    }
  }

  // Back link
  const back = frag.querySelector('.link.back');
  if (back) {
    back.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.history.length > 1) window.history.back();
      else window.location.assign('/');
    });
  }

  container.textContent = '';
  container.appendChild(frag);

  return () => {};
}

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.mountCaseHero = mountCaseHero;
}

