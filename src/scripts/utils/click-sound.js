export function initClickSound({
  src = "../../assets/sounds/arcade.m4a",
  volume = 0.35,
  selector = 'button, [role="button"], .btn, .btn-md, .btn-sm, .btn-lg, .btn-primary, .btn-secondary',
  respectUserPreference = true,
} = {}) {
  if (typeof window === "undefined") return () => {};

  const useCapture = true;

  let baseAudio;
  try {
    const audioUrl = new URL(src, import.meta.url).href;
    baseAudio = new Audio(audioUrl);
    baseAudio.preload = "auto";
    baseAudio.volume = volume;
  } catch {
    return () => {};
  }

  const play = () => {
    const instance = baseAudio.cloneNode();
    instance.volume = volume;
    instance.play?.().catch(() => {});
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
      document.addEventListener("click", onClick, useCapture);
      listening = true;
    } else if (!next && listening) {
      document.removeEventListener("click", onClick, useCapture);
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
