let iosActivePatched = false;

function ensureIOSActive() {
  if (iosActivePatched || typeof window === "undefined") return;
  try {
    window.addEventListener(
      "touchstart",
      () => {
        // no-op; required for iOS to apply :active styles
      },
      { passive: true }
    );
    iosActivePatched = true;
  } catch {
    // ignore errors from older browsers
  }
}

export function initPressFeedback({
  selector = ".btn, .btn-md, .btn-primary, .btn-secondary",
} = {}) {
  ensureIOSActive();

  const pressOn = (el) => el.classList.add("is-pressed");
  const pressOff = (el) => el.classList.remove("is-pressed");
  const getBtn = (target) => {
    if (!(target instanceof Element)) return null;
    const el = target.closest(selector);
    if (!el) return null;
    if (el.dataset && el.dataset.noPressFeedback === "true") return null;
    return el;
  };

  const downByPointer = new Map();
  const downByKey = new Set();

  const markPressed = (btn, key) => {
    if (!btn) return;
    pressOn(btn);
    if (key) {
      downByKey.add(btn);
    }
  };

  const releasePressed = (btn) => {
    if (!btn) return;
    pressOff(btn);
    downByKey.delete(btn);
  };

  const onPointerDown = (event) => {
    const btn = getBtn(event.target);
    if (!btn) return;
    const id = event.pointerId ?? "mouse";
    downByPointer.set(id, btn);
    pressOn(btn);
  };

  const onPointerUp = (event) => {
    const id = event.pointerId ?? "mouse";
    const btn = downByPointer.get(id) || getBtn(event.target);
    if (btn) pressOff(btn);
    downByPointer.delete(id);
  };

  const onPointerCancel = (event) => {
    const id = event.pointerId ?? "mouse";
    const btn = downByPointer.get(id);
    if (btn) pressOff(btn);
    downByPointer.delete(id);
  };

  const onKeyDown = (event) => {
    if (event.key !== " " && event.key !== "Enter") return;
    const btn = getBtn(event.target);
    if (!btn || downByKey.has(btn)) return;
    markPressed(btn, true);
  };

  const onKeyUp = (event) => {
    if (event.key !== " " && event.key !== "Enter") return;
    const btn = getBtn(event.target);
    releasePressed(btn);
  };

  const flushAll = () => {
    downByPointer.forEach((btn) => pressOff(btn));
    downByPointer.clear();
    downByKey.forEach((btn) => pressOff(btn));
    downByKey.clear();
  };

  const onWindowBlur = () => flushAll();
  const onElementBlur = (event) => {
    const btn = getBtn(event.target);
    if (btn) releasePressed(btn);
  };

  document.addEventListener("pointerdown", onPointerDown, {
    passive: true,
    capture: true,
  });
  document.addEventListener("pointerup", onPointerUp, {
    passive: true,
    capture: true,
  });
  document.addEventListener("pointercancel", onPointerCancel, {
    passive: true,
    capture: true,
  });

  document.addEventListener("keydown", onKeyDown, true);
  document.addEventListener("keyup", onKeyUp, true);
  document.addEventListener("blur", onElementBlur, true);
  window.addEventListener("blur", onWindowBlur);

  return () => {
    document.removeEventListener("pointerdown", onPointerDown, true);
    document.removeEventListener("pointerup", onPointerUp, true);
    document.removeEventListener("pointercancel", onPointerCancel, true);
    document.removeEventListener("keydown", onKeyDown, true);
    document.removeEventListener("keyup", onKeyUp, true);
    document.removeEventListener("blur", onElementBlur, true);
    window.removeEventListener("blur", onWindowBlur);
    flushAll();
  };
}
