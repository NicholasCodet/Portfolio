import tplHTML from './related-projects.html?raw';
import './related-projects.css';
import { featuredCases } from '../../scripts/utils/cases.js';
import { createUICaseCard } from '../ui-case-card/ui-case-card.js';
import { inlineSpriteOnce } from '../../scripts/utils/svg.js';

let __tpl;
function getTemplate() {
  if (!__tpl) {
    const doc = new DOMParser().parseFromString(tplHTML, 'text/html');
    const t = doc.querySelector('template');
    if (!t) throw new Error('related-projects: <template> missing');
    __tpl = t;
  }
  return __tpl;
}

export async function mountRelatedProjects({
  selector = 'section.related-projects',
  spritePath = '../../assets/icons/sprite.svg',
  limit = 2,
} = {}) {
  const section = document.querySelector(selector);
  if (!section) return () => {};
  const container = section.querySelector('.container');
  if (!container) return () => {};

  // Inline sprite (needed by ui-case-card arrow icon if not already inlined)
  try { const url = new URL(spritePath, import.meta.url).href; await inlineSpriteOnce(url); } catch {}

  // Determine current slug from url
  const pathSlug = (location.pathname.split('/').pop() || '').replace(/\.html?$/i, '');

  const tpl = getTemplate();
  const frag = tpl.content.cloneNode(true);
  const layout = frag.querySelector('.mp-layout');

  // Load featured cases, exclude current
  const items = featuredCases(0).filter((x) => x && x.slug !== pathSlug).slice(0, limit);

  for (const it of items) {
    const { element } = createUICaseCard({
      title: it.title,
      description: it.description,
      href: it.href || (it.slug ? `/cases/${it.slug}.html` : '#'),
      imageUrl: it.thumbnailUrl || it.thumbnail || '',
    });
    layout.appendChild(element);
  }

  // Placeholder if needed
  if (items.length < limit) {
    const card = document.createElement('article');
    card.className = 'cs-card cs-empty';
    const media = document.createElement('div');
    media.className = 'cs-media';
    const inner = document.createElement('div');
    inner.className = 'cs-empty-inner';
    inner.innerHTML = `
      <svg class="icon linear" width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
        <use href="#icon-people-linear"></use>
      </svg>
      <p class="text-md"><span class="hint">Got a cool idea?</span> This spot is waiting<br> for your success story.</p>
    `;
    media.appendChild(inner);
    card.appendChild(media);
    layout.appendChild(card);
  }

  container.textContent = '';
  container.appendChild(frag);

  return () => {};
}

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.mountRelatedProjects = mountRelatedProjects;
}
