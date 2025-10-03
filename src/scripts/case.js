console.log("Case Script Loaded");

import { mountCaseBody } from "../components/case-body/case-body.js";
import { mountCaseHero } from "../components/case-hero/case-hero.js";
import { mountFooter } from "../components/footer/footer.js";
import { mountQuote as mountCaseQuote } from "../components/quote/quote.js";
import { mountRelatedProjects } from "../components/related-projects/related-projects.js";

import { initClickSound } from "./utils/click-sound.js";
import { fetchJSON } from "./utils/fetch-json.js";
import { getCaseBySlug } from "./utils/cases.js";
import { initPressFeedback } from "./utils/press-feedback.js";
import { onReady } from "./utils/ready.js";

const CASE_ID_PATTERN = /^[a-z0-9-]+$/;

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
  const url = new URL(`${dataPath}${safeId}.json`, import.meta.url).href;
  const data = (await fetchJSON(url)) || {};
  const content = data && data.case ? data.case : data;

  mountCaseHero({ selector: ".section.case-hero", data: content });
  mountCaseBody({ selector: ".section.case-body", data: content });

  const quoteObj = content && content.quote ? content.quote : null;
  if (quoteObj) {
    mountCaseQuote({ data: [quoteObj] });
  }

  mountRelatedProjects({ selector: ".section.related-projects" });
}

onReady(async () => {
  await mountCaseSectionsFromData();
  initClickSound();
  initPressFeedback();
  mountFooter("footer.section.footer");
});
