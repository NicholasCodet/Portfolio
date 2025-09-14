let __toastEl = null;
let __toastTimer = null;

export function showToast(message = "Copied!", duration = 1600) {
  if (!__toastEl) {
    __toastEl = document.createElement("div");
    __toastEl.className = "toast";
    __toastEl.setAttribute("role", "status");
    __toastEl.setAttribute("aria-live", "polite");
    document.body.appendChild(__toastEl);
  }
  __toastEl.textContent = String(message);
  // force reflow to restart animation if already visible
  void __toastEl.offsetWidth;
  __toastEl.classList.add("show");
  clearTimeout(__toastTimer);
  __toastTimer = setTimeout(() => {
    __toastEl.classList.remove("show");
  }, duration);
}

