import { fetchJSON } from "./utils/fetch-json.js";
import { getCaseBySlug } from "./utils/cases.js";
import { onReady } from "./utils/ready.js";

const CASE_ID_PATTERN = /^[a-z0-9-]+$/;

const ric = typeof window !== "undefined" ? window.requestIdleCallback : null;

function runWhenIdle(task) {
  if (typeof task !== "function") return;
  if (typeof ric === "function") {
    ric(() => task());
  } else {
    setTimeout(task, 1);
  }
}

function resolveCaseSlug(value, fallback) {
  const fallbackSlug = sanitizeCaseSlug(fallback) || "talers";
  const candidate = sanitizeCaseSlug(value);
  return candidate || fallbackSlug;
}

function sanitizeCaseSlug(value) {
  if (!value) return null;
  const slug = String(value).trim().toLowerCase();
  if (!CASE_ID_PATTERN.test(slug)) return null;
  const match = getCaseBySlug(slug);
  return match ? match.slug : null;
}

async function mountCaseSectionsFromData({
  dataParam = "id",
  defaultId = "talers",
  dataPath = "../data/cases/",
} = {}) {
  const params = new URLSearchParams(location.search);
  let id = params.get(dataParam);

  if (!id) {
    id = document.body.getAttribute("data-case-id") || id;
  }

  if (!id) {
    const last = (location.pathname.split("/").pop() || "").replace(/\.html?$/i, "");
    id = last || defaultId;
  }

  const safeId = resolveCaseSlug(id, defaultId);

  let content = null;
  const cached = getCaseBySlug(safeId);
  if (cached && cached.raw) {
    const raw = cached.raw;
    content = raw && raw.case ? raw.case : raw;
  }

  if (!content) {
    const url = new URL(`${dataPath}${safeId}.json`, import.meta.url).href;
    const data = (await fetchJSON(url)) || {};
    content = data && data.case ? data.case : data;
  }

  if (!content || typeof content !== "object") content = {};

  const [{ mountCaseHero }, { mountCaseBody }, { mountRelatedProjects }] =
    await Promise.all([
      import("../components/case-hero/case-hero.js"),
      import("../components/case-body/case-body.js"),
      import("../components/related-projects/related-projects.js"),
    ]);

  mountCaseHero({ selector: ".section.case-hero", data: content });
  mountCaseBody({ selector: ".section.case-body", data: content });
  mountRelatedProjects({ selector: ".section.related-projects" });

  const quoteObj = content && content.quote ? content.quote : null;
  if (quoteObj) {
    try {
      const { mountQuote } = await import("../components/quote/quote.js");
      mountQuote({ data: [quoteObj] });
    } catch {
      // ignore quote errors
    }
  }
}

onReady(async () => {
  await mountCaseSectionsFromData();
  runWhenIdle(() => {
    Promise.all([
      import("./utils/click-sound.js").then(({ initClickSound }) =>
        initClickSound()
      ),
      import("./utils/press-feedback.js").then(({ initPressFeedback }) =>
        initPressFeedback()
      ),
      import("../components/footer/footer.js").then(({ mountFooter }) =>
        mountFooter("footer.section.footer")
      ),
    ]).catch(() => {});
  });
});
