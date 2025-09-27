import tplHTML from './about.html?raw';
import './about.css';
import socialsData from '../../data/socials.json';
import toolkitData from '../../data/toolkit.json';
import { filterByIds } from '../../scripts/utils/socials.js';
import { bindSafeLink } from '../../scripts/utils/urls.js';
import { mountUIStack } from '../ui-stack/ui-stack.js';

let __tpl;
function getTemplate() {
  if (!__tpl) {
    const doc = new DOMParser().parseFromString(tplHTML, 'text/html');
    const t = doc.querySelector('template');
    if (!t) throw new Error('about: <template> missing');
    __tpl = t;
  }
  return __tpl;
}

// No local resolveSrc needed; image stack uses import.meta.glob

function createSocialIconFromPaths(s, { size = 24, className = 'icon' } = {}) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', s.viewBox || '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('class', className);
  const paths = Array.isArray(s.paths) ? s.paths : [];
  for (const p of paths) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', p.d || '');
    if (p.fillRule) path.setAttribute('fill-rule', p.fillRule);
    if (p.clipRule) path.setAttribute('clip-rule', p.clipRule);
    svg.appendChild(path);
  }
  return svg;
}

export function mountAbout({
  selector = 'section.about',
  thoughtTitle = null,
  thought = null,
  role = null,
  photo = '/src/assets/images/profile/profile.png',
  socialIds = ['LinkedIn', 'Dribbble', 'Medium', 'GitHub'],
  toolIds = [],
} = {}) {
  const section = document.querySelector(selector);
  if (!section) return () => {};
  const container = section.querySelector('.container');
  if (!container) return () => {};

  const tpl = getTemplate();
  const frag = tpl.content.cloneNode(true);

  // Profile image and id
  const media = frag.querySelector('.about-media');
  const roleEl = frag.querySelector('.about-id .role');
  if (roleEl && role != null) roleEl.textContent = String(role);

  const photoUrl = photo; // kept for API compatibility; UI stack handles assets
  if (media) {
    // Load all images from assets/images/profile/ (works in Vite via import.meta.glob)
    let imgs = [];
    try {
      const mods = import.meta.glob('../../assets/images/profile/*.{png,jpg,jpeg,webp,svg}', { eager: true, import: 'default' });
      imgs = Object.keys(mods).sort().map((k) => mods[k]).filter(Boolean);
    } catch {
      // Fallback to single photo param if glob not available
      imgs = [photo].filter(Boolean);
    }
    if (!imgs.length) imgs = [photo];
    mountUIStack(media, { images: imgs, desktopDefaultDirection: 'up' });
  }

  // Socials
  const socialsList = frag.querySelector('.about-socials');
  const socials = filterByIds(Array.isArray(socialsData) ? socialsData : [], socialIds, (s) => s.name || s.id);
  if (socialsList) {
    for (const s of socials) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      bindSafeLink(a, s.href || '#', { target: '_blank' });
      a.setAttribute('aria-label', s.ariaLabel || s.name || 'Social link');
      const icon = createSocialIconFromPaths(s, { size: 24, className: 'icon' });
      a.appendChild(icon);
      li.appendChild(a);
      socialsList.appendChild(li);
    }
  }

  // Toolkit
  const toolsList = frag.querySelector('.tools');
  const tools = filterByIds(Array.isArray(toolkitData) ? toolkitData : [], toolIds, (t) => t.id || t.label || t.name);
  if (toolsList) {
    for (const t of tools) {
      const li = document.createElement('li');
      li.className = 'tool';
      const span = document.createElement('span');
      const label = t?.ariaLabel || t?.name || t?.label || t?.id || 'Tool';
      span.className = 'tool-badge';
      span.setAttribute('data-label', String(label));
      const icon = createSocialIconFromPaths(t, { size: 24, className: 'icon' });
      span.appendChild(icon);
      li.appendChild(span);
      toolsList.appendChild(li);
    }
  }

  // Thought
  const titleEl = frag.querySelector('.about-thought .headline-1');
  const textEl = frag.querySelector('.about-thought-text');
  if (titleEl && thoughtTitle != null) titleEl.textContent = String(thoughtTitle);
  if (textEl && thought != null) textEl.textContent = String(thought);

  container.textContent = '';
  container.appendChild(frag);

  return () => {};
}

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.mountAbout = mountAbout;
}
