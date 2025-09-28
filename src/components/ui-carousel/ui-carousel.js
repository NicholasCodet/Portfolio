import './ui-carousel.css';

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

export function mountCarousel(rootOrSelector, options = {}) {
  const root = typeof rootOrSelector === 'string' ? document.querySelector(rootOrSelector) : rootOrSelector;
  if (!root) return () => {};

  const track = root; // we treat the provided element as the scroll container/track
  track.setAttribute('data-ui-carousel', '');
  const slides = () => Array.from(track.children);

  const cfg = {
    type: options.type || 'snap',
    loop: !!options.loop,
    keyboard: options.keyboard !== false,
    draggable: options.draggable !== false,
    autoplay: {
      enabled: !!(options.autoplay && (options.autoplay === true || options.autoplay.enabled)),
      interval: (options.autoplay && (options.autoplay.interval ?? 3000)) || 3000,
      pauseOnHover: options.autoplay && options.autoplay.pauseOnHover !== false,
      pauseOnVisibility: options.autoplay && options.autoplay.pauseOnVisibility !== false,
      mode: (options.autoplay && options.autoplay.mode) || 'step', // 'step' | 'continuous' | 'marquee'
      speed: (options.autoplay && options.autoplay.speed) || 40, // px/s for continuous/marquee
    },
  };

  let destroyed = false;
  let autoplayTimer = null;
  let rafId = 0;
  let lastTs = 0;
  let paused = false;

  const getSlideIndexNear = () => {
    const list = slides();
    if (!list.length) return 0;
    const left = track.scrollLeft + track.clientWidth / 2;
    let best = 0; let bestDist = Infinity;
    list.forEach((el, i) => {
      const x = el.offsetLeft + el.clientWidth / 2;
      const d = Math.abs(x - left);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  };

  const goTo = (index) => {
    const list = slides();
    if (!list.length) return;
    const i = clamp(index, 0, list.length - 1);
    const el = list[i];
    if (!el) return;
    track.scrollTo({ left: el.offsetLeft, behavior: 'smooth' });
  };

  const next = () => {
    const list = slides();
    if (!list.length) return;
    const cur = getSlideIndexNear();
    const i = cur + 1;
    if (i < list.length) goTo(i);
    else if (cfg.loop) goTo(0);
  };
  const prev = () => {
    const list = slides();
    if (!list.length) return;
    const cur = getSlideIndexNear();
    const i = cur - 1;
    if (i >= 0) goTo(i);
    else if (cfg.loop) goTo(list.length - 1);
  };

  // Keyboard
  const onKey = (e) => {
    if (!cfg.keyboard) return;
    // only when focus is within the carousel
    const active = document.activeElement;
    if (active && (active === track || track.contains(active))) {
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    }
  };
  document.addEventListener('keydown', onKey);

  // Dragging
  let dragging = false; let startX = 0; let startScroll = 0;
  const onPointerDown = (e) => {
    if (!cfg.draggable) return;
    dragging = true; startX = e.clientX; startScroll = track.scrollLeft;
    track.classList.add('is-dragging');
    track.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    track.scrollLeft = startScroll - dx;
  };
  const onPointerUp = (e) => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('is-dragging');
  };
  track.addEventListener('pointerdown', onPointerDown, { passive: true });
  track.addEventListener('pointermove', onPointerMove, { passive: true });
  track.addEventListener('pointerup', onPointerUp, { passive: true });
  track.addEventListener('pointercancel', onPointerUp, { passive: true });
  track.addEventListener('pointerleave', onPointerUp, { passive: true });

  // Autoplay
  const clearTimer = () => { if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; } };
  const clearRaf = () => { if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } lastTs = 0; };
  const startStep = () => {
    if (!cfg.autoplay.enabled) return;
    clearTimer();
    autoplayTimer = setInterval(() => { if (!paused) next(); }, Math.max(1000, cfg.autoplay.interval));
  };
  const startContinuous = () => {
    if (!cfg.autoplay.enabled) return;
    clearRaf();
    const tick = (ts) => {
      if (!lastTs) lastTs = ts;
      const dt = Math.max(0, (ts - lastTs) / 1000);
      lastTs = ts;
      if (!paused) {
        const max = track.scrollWidth - track.clientWidth;
        let nx = track.scrollLeft + cfg.autoplay.speed * dt;
        if (nx >= max - 1) nx = 0;
        track.scrollLeft = nx;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  };
  const startMarquee = () => {
    if (!cfg.autoplay.enabled) return;
    // Animate the track using CSS keyframes transform from 0 to -distance
    // Assume the content is duplicated back-to-back for seamless loop
    const firstChild = track.firstElementChild;
    const childWidth = firstChild
      ? firstChild.getBoundingClientRect().width
      : track.scrollWidth / 2;
    const distance = Math.max(1, childWidth);
    // Preserve progress
    let offsetPx = 0;
    try {
      const tr = getComputedStyle(track).transform;
      if (tr && tr !== 'none') {
        const m = new DOMMatrixReadOnly(tr);
        offsetPx = Math.abs(m.m41);
      }
    } catch {}
    const name = `ui_marq_${Math.random().toString(36).slice(2)}`;
    const styleEl = document.createElement('style');
    styleEl.textContent = `@keyframes ${name} { from { transform: translateX(0); } to { transform: translateX(-${distance}px); } }`;
    document.head.appendChild(styleEl);
    track._uiMarqStyle = styleEl;

    const seconds = Math.max(6, distance / Math.max(1, cfg.autoplay.speed));
    const progress = distance > 0 ? (offsetPx % distance) / distance : 0;
    const delay = progress * seconds;
    track.style.animation = `${name} ${seconds.toFixed(2)}s linear infinite`;
    track.style.animationDelay = `-${delay.toFixed(2)}s`;

    const onEnter = () => { if (cfg.autoplay.pauseOnHover) track.style.animationPlayState = 'paused'; };
    const onLeave = () => { if (cfg.autoplay.pauseOnHover) track.style.animationPlayState = 'running'; };
    const onVis = () => { if (cfg.autoplay.pauseOnVisibility) track.style.animationPlayState = document.hidden ? 'paused' : 'running'; };
    track.addEventListener('mouseenter', onEnter);
    track.addEventListener('mouseleave', onLeave);
    document.addEventListener('visibilitychange', onVis);
    track._uiMarqCleanup = () => {
      track.removeEventListener('mouseenter', onEnter);
      track.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('visibilitychange', onVis);
      if (track._uiMarqStyle) { try { track._uiMarqStyle.remove(); } catch {} track._uiMarqStyle = null; }
      track.style.animation = '';
    };
  };
  const startAutoplay = () => {
    if (!cfg.autoplay.enabled) return;
    if (cfg.autoplay.mode === 'marquee') startMarquee();
    else if (cfg.autoplay.mode === 'continuous') startContinuous();
    else startStep();
  };

  // Pause on hover
  const onEnter = () => { if (cfg.autoplay.pauseOnHover) { paused = true; } };
  const onLeave = () => { if (cfg.autoplay.pauseOnHover) { paused = false; } };
  track.addEventListener('mouseenter', onEnter);
  track.addEventListener('mouseleave', onLeave);

  // Pause on visibility
  const onVis = () => {
    if (!cfg.autoplay.pauseOnVisibility) return;
    paused = document.hidden;
  };
  document.addEventListener('visibilitychange', onVis);

  // Pause when out of viewport
  let io = null;
  try {
    io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (cfg.autoplay.mode === 'continuous') {
          paused = !entry.isIntersecting;
        } else if (cfg.autoplay.mode === 'marquee') {
          if (cfg.autoplay.pauseOnVisibility) track.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
        } else {
          if (entry.isIntersecting) startStep();
          else clearTimer();
        }
      });
    }, { threshold: 0.1 });
    io.observe(track);
  } catch {}

  // Start autoplay if enabled
  startAutoplay();

  const destroy = () => {
    if (destroyed) return; destroyed = true;
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVis);
    track.removeEventListener('pointerdown', onPointerDown);
    track.removeEventListener('pointermove', onPointerMove);
    track.removeEventListener('pointerup', onPointerUp);
    track.removeEventListener('pointercancel', onPointerUp);
    track.removeEventListener('pointerleave', onPointerUp);
    track.removeEventListener('mouseenter', onEnter);
    track.removeEventListener('mouseleave', onLeave);
    if (io) io.disconnect();
    clearTimer();
    clearRaf();
    if (track._uiMarqCleanup) { try { track._uiMarqCleanup(); } catch {} track._uiMarqCleanup = null; }
    track.removeAttribute('data-ui-carousel');
  };

  return { next, prev, goTo, destroy };
}

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.mountCarousel = mountCarousel;
}
