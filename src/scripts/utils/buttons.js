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
    // ignore
  }
}

export function initPressFeedback({
  selector = ".btn-primary, .btn-secondary",
} = {}) {
  ensureIOSActive();

  const pressOn = (el) => el.classList.add("is-pressed");
  const pressOff = (el) => el.classList.remove("is-pressed");
  const getBtn = (t) => (t instanceof Element ? t.closest(selector) : null);

  const onDown = (e) => {
    const btn = getBtn(e.target);
    if (btn) pressOn(btn);
  };
  const onUp = (e) => {
    const btn = getBtn(e.target);
    if (btn) pressOff(btn);
  };
  const onCancel = onUp;
  const onLeave = onUp;

  document.addEventListener("pointerdown", onDown, { passive: true });
  document.addEventListener("pointerup", onUp, { passive: true });
  document.addEventListener("pointercancel", onCancel, { passive: true });
  document.addEventListener("pointerleave", onLeave, { passive: true });

  // Return cleanup to remove listeners if needed later
  return () => {
    document.removeEventListener("pointerdown", onDown);
    document.removeEventListener("pointerup", onUp);
    document.removeEventListener("pointercancel", onCancel);
    document.removeEventListener("pointerleave", onLeave);
  };
}
