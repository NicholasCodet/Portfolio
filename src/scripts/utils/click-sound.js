import defaultSoundUrl from "../../assets/sounds/uwu.mp3?url";

export function initClickSound({
  src = defaultSoundUrl,
  volume = 0.35,
  selector = 'button, [role="button"], .btn, .btn-md, .btn-sm, .btn-lg, .btn-primary, .btn-secondary',
  respectUserPreference = true,
} = {}) {
  if (typeof window === "undefined") return () => {};

  let audioUrl;
  try {
    if (src === defaultSoundUrl || /^(?:https?:|data:)/i.test(src)) {
      audioUrl = src;
    } else {
      audioUrl = new URL(src, import.meta.url).href;
    }
  } catch {
    return () => {};
  }

  const baseAudio = new Audio(audioUrl);
  baseAudio.preload = "auto";
  baseAudio.crossOrigin = "anonymous";

  const pool = [baseAudio];
  let unlocked = false;

  const ensureUnlocked = () => {
    if (unlocked) return;
    try {
      const promise = baseAudio.play();
      if (promise && typeof promise.then === "function") {
        promise
          .then(() => {
            baseAudio.pause();
            try {
              baseAudio.currentTime = 0;
            } catch {}
            unlocked = true;
          })
          .catch(() => {});
      } else {
        unlocked = true;
      }
    } catch {
      // ignore unlock errors
    }
  };

  const getInstance = () => {
    const available = pool.find((audio) => audio.paused);
    if (available) return available;
    const instance = baseAudio.cloneNode(true);
    instance.preload = "auto";
    pool.push(instance);
    return instance;
  };

  const play = () => {
    ensureUnlocked();
    try {
      const audio = getInstance();
      audio.volume = volume;
      try {
        audio.currentTime = 0;
      } catch {}
      const promise = audio.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(() => {});
      }
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

  const onUserGesture = () => ensureUnlocked();
  const unlockOptions = { once: true, passive: true, capture: true };
  const addUnlockListeners = () => {
    document.addEventListener("pointerdown", onUserGesture, unlockOptions);
    document.addEventListener("keydown", onUserGesture, unlockOptions);
  };
  const removeUnlockListeners = () => {
    document.removeEventListener("pointerdown", onUserGesture, true);
    document.removeEventListener("keydown", onUserGesture, true);
  };
  addUnlockListeners();

  let cleaned = false;
  return () => {
    if (cleaned) return;
    cleaned = true;
    setListening(false);
    removePreferenceListener();
    removeUnlockListeners();
  };
}
