import tplHTML from './case-body.html?raw';
import './case-body.css';
import { escape } from '../../scripts/utils/dom.js';
import { resolveAssetPath } from '../../scripts/utils/assets.js';

let __tpl;
function getTemplate() {
  if (!__tpl) {
    const doc = new DOMParser().parseFromString(tplHTML, 'text/html');
    const t = doc.querySelector('template');
    if (!t) throw new Error('case-body: <template> missing');
    __tpl = t;
  }
  return __tpl;
}

const baseUrl = import.meta.url;

export function mountCaseBody({ selector = '.section.case-body', data = {} } = {}) {
  const section = document.querySelector(selector);
  if (!section) return () => {};
  const container = section.querySelector('.container');
  if (!container) return () => {};

  const tpl = getTemplate();
  const frag = tpl.content.cloneNode(true);
  const root = frag.querySelector('.case-body-root');
  if (!root) return () => {};

  // Pull data from JSON once at the top
  const sections = Array.isArray(data.sections) ? data.sections : [];

  const hasStructured = !!(data && (data.context || data.problems || data.approach || data.solution || data.impact));

  // Helpers
  const idx = (pred) => sections.findIndex(pred);
  const after = (start, type) => sections.slice(start + 1).find((s) => s.type === type) || null;
  const nextOfTypeAfter = (start, type) => {
    const i = sections.findIndex((s, k) => k > start && s.type === type);
    return i >= 0 ? sections[i] : null;
  };

  const renderImage = (img) => {
    if (!img) return '';
    const alt = escape(img.alt || '');
    const caption = escape(img.caption || '');
    const src = resolveAssetPath(img.src || '', baseUrl) || '';
    return `
      <figure class="case-media case-section">
        ${
          src
            ? `<img src="${escape(src)}" alt="${alt}" loading="lazy" />`
            : `<div class="img-placeholder" role="img" aria-label="${alt}"></div>`
        }
        ${caption ? `<figcaption class=\"text-xs\">${caption}</figcaption>` : ''}
      </figure>`;
  };

  if (!hasStructured) {
    // Legacy path: extract content from flat `sections` list
    const firstImage = sections.find((s) => s.type === 'image') || null;

    const iLandscape = idx((s) => s.type === 'subheading');
    const titleLandscape = escape(sections[iLandscape]?.text || '');
    const textLandscape = escape(after(iLandscape, 'paragraph')?.text || '');

    const iProblems = idx((s) => s.type === 'subheading' && /problems/i.test(s.text || ''));
    const titleProblems = escape(sections[iProblems]?.text || '');
    const textProblems = escape(after(iProblems, 'paragraph')?.text || '');

    const iApproach = idx((s) => s.type === 'subheading' && /approach/i.test(s.text || ''));
    const titleApproach = escape(sections[iApproach]?.text || '');
    const textApproach = escape(after(iApproach, 'paragraph')?.text || '');
    const secondImage = nextOfTypeAfter(iApproach, 'image');

    const iSolution = idx((s) => s.type === 'heading' && /solution/i.test(s.text || ''));
    const titleSolution = escape(sections[iSolution]?.text || '');
    const textSolution = escape(after(iSolution, 'paragraph')?.text || '');

    const iImpact = idx((s) => s.type === 'heading' && /impact/i.test(s.text || ''));
    const titleImpact = escape(sections[iImpact]?.text || '');
    const textImpact = escape(after(iImpact, 'paragraph')?.text || '');
    const thirdImage = nextOfTypeAfter(iImpact, 'image');

    root.innerHTML = `
      ${renderImage(firstImage)}
      ${titleLandscape ? `<h3 class=\"heading-3 case-section\">${titleLandscape}</h3>` : ''}
      ${textLandscape ? `<p class=\"text-md case-paragraph\">${textLandscape}</p>` : ''}

      ${titleProblems ? `<h3 class=\"heading-3 case-section\">${titleProblems}</h3>` : ''}
      ${textProblems ? `<p class=\"text-md case-paragraph\">${textProblems}</p>` : ''}

      ${titleApproach ? `<h3 class=\"heading-3 case-section\">${titleApproach}</h3>` : ''}
      ${textApproach ? `<p class=\"text-md case-paragraph\">${textApproach}</p>` : ''}
      ${renderImage(secondImage)}

      ${titleSolution ? `<h3 class=\"heading-3 case-section\">${titleSolution}</h3>` : ''}
      ${textSolution ? `<p class=\"text-md case-paragraph\">${textSolution}</p>` : ''}

      ${titleImpact ? `<h3 class=\"heading-3 case-section\">${titleImpact}</h3>` : ''}
      ${textImpact ? `<p class=\"text-md case-paragraph\">${textImpact}</p>` : ''}
      ${renderImage(thirdImage)}
    `;
  } else {
    // Structured path
    const ctx = data.context || {};
    const prb = data.problems || {};
    const apr = data.approach || {};
    const sol = data.solution || {};
    const imp = data.impact || {};

    const block = (title, text, image) => {
      const tt = escape(title || '');
      const tx = escape(text || '');
      return `${tt ? `<h3 class=\"heading-3 case-section\">${tt}</h3>` : ''}
              ${tx ? `<p class=\"text-md case-paragraph\">${tx}</p>` : ''}
              ${renderImage(image)}`;
    };

    root.innerHTML = `
      ${renderImage(ctx.image)}
      ${block(ctx.title, ctx.text, null)}
      ${block(prb.title, prb.text, null)}
      ${block(apr.title, apr.text, apr.image)}
      ${block(sol.title, sol.text, null)}
      ${block(imp.title, imp.text, imp.image)}
    `;
  }

  container.textContent = '';
  container.appendChild(frag);

  return () => {};
}

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.mountCaseBody = mountCaseBody;
}
