export function initClickSound({
  src = "../../assets/sounds/uwu.mp3",
  volume = 0.35,
  selector = 'button, [role="button"], .btn, .btn-md, .btn-sm, .btn-lg, .btn-primary, .btn-secondary',
  respectUserPreference = true,
} = {}) {
  if (typeof window === "undefined") return () => {};

  let audioUrl;
  try {
    audioUrl = new URL(src, import.meta.url).href;
  } catch {
    return () => {};
  }

  const play = () => {
    try {
      const instance = new Audio(audioUrl);
      instance.volume = volume;
      instance.play?.().catch(() => {});
    } catch {
      // ignore playback errors (autoplay policies, etc.)
    }
  };

  const onClick = (event) => {
    const target = event.target && event.target.closest?.(selector);
    if (!target) return;
    if (target.dataset?.noClickSound === "true") return;
    play();
  };

  const mediaQuery = respectUserPreference
    ? window.matchMedia?.("(prefers-reduced-motion: reduce)")
    : null;

  if (mediaQuery?.matches) {
    return () => {};
  }

  let listening = false;
  const setListening = (next) => {
    if (next && !listening) {
      document.addEventListener("click", onClick, true);
      listening = true;
    } else if (!next && listening) {
      document.removeEventListener("click", onClick, true);
      listening = false;
    }
  };

  setListening(true);

  const onPreferenceChange = (event) => {
    setListening(!event.matches);
  };

  const addPreferenceListener = () => {
    if (!mediaQuery) return;
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", onPreferenceChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(onPreferenceChange);
    }
  };

  const removePreferenceListener = () => {
    if (!mediaQuery) return;
    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener("change", onPreferenceChange);
    } else if (mediaQuery.removeListener) {
      mediaQuery.removeListener(onPreferenceChange);
    }
  };

  addPreferenceListener();

  let cleaned = false;
  return () => {
    if (cleaned) return;
    cleaned = true;
    setListening(false);
    removePreferenceListener();
  };
}
