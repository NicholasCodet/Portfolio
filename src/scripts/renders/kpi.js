export function mountKPI({
  selector = "section.kpi",
  items = [
    { value: "200+", label: "Experiences crafted" },
    { value: "40%", label: "Faster dev handoff" },
    { value: "4.8", label: "Review rate" },
  ],
} = {}) {
  const section = document.querySelector(selector);
  if (!section) return;
  const container = section.querySelector(".container");
  if (!container) return;

  container.innerHTML = `
    <ul class="kpi-list" role="list" aria-label="Key performance indicators">
      ${items
        .map(
          (i) => `
        <li class="kpi-item">
          <span class="kpi-value heading-1">${i.value}</span>
          <span class="kpi-label text-md">${i.label}</span>
        </li>
      `
        )
        .join("")}
    </ul>
  `;
}
