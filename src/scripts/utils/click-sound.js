export function initClickSound({
  src = "../../assets/sounds/arcade.m4a",
  volume = 0.35,
  selector = 'button, [role="button"], .btn, .btn-md, .btn-primary, .btn-secondary',
} = {}) {
  try {
    const audioUrl = new URL(src, import.meta.url).href;
    const base = new Audio(audioUrl);
    base.preload = "auto";
    base.volume = volume;

    const play = () => {
      const a = base.cloneNode();
      a.volume = volume;
      // Fire and forget; ignore promise rejections (autoplay policies etc.)
      a.play?.().catch(() => {});
    };

    document.addEventListener(
      "click",
      (e) => {
        const target = e.target && (e.target.closest?.(selector) || null);
        if (!target) return;
        if (target.dataset && target.dataset.noClickSound === "true") return;
        play();
      },
      true
    );
  } catch {
    // Fail silently if Audio cannot be constructed
  }
}
