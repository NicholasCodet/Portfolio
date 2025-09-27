console.log("Case Script Loaded");

import { mountCaseBody } from "../components/case-body/case-body.js";
import { mountCaseHero } from "../components/case-hero/case-hero.js";
import { mountRelatedProjects } from "../components/related-projects/related-projects.js";
import { mountQuote as mountCaseQuote } from "../components/quote/quote.js";
import { mountFooter } from "../components/footer/footer.js";
import { initPressFeedback } from "./utils/press-feedback.js";
import { initClickSound } from "./utils/click-sound.js";
import { fetchJSON } from "./utils/fetch-json.js";
import { onReady } from "./utils/ready.js";

onReady(async () => {
  await mountCaseSectionsFromData();
  initClickSound();
  initPressFeedback();
  // Mount footer component (footer tag on case pages)
  mountFooter("footer.section.footer");
});

async function mountCaseSectionsFromData({
  dataParam = "id",
  defaultId = "talers",
  dataPath = "../data/cases/",
} = {}) {
  const params = new URLSearchParams(location.search);
  let id = params.get(dataParam);

  // Allow overriding via data attribute if set
  if (!id) {
    id = document.body.getAttribute("data-case-id") || id;
  }

  // Fallback to filename-based slug
  if (!id) {
    const last = (location.pathname.split("/").pop() || "").replace(
      /\.html?$/i,
      ""
    );
    id = last || defaultId;
  }
  const url = new URL(`${dataPath}${id}.json`, import.meta.url).href;
  const data = (await fetchJSON(url)) || {};
  const content = data && data.case ? data.case : data;
  mountCaseHero({ selector: ".section.case-hero", data: content });
  mountCaseBody({ selector: ".section.case-body", data: content });
  const quoteObj = content && content.quote ? content.quote : null;
  if (quoteObj) {
    // Mount the new Quote component using the updated section class
    // Use default 'testimony' class prefix for styling via testimony.css
    mountCaseQuote({ selector: ".section.quote", data: [quoteObj], headlineClass: 'headline-2' });
  }
  // Mount Related Projects on the updated section class
  mountRelatedProjects({ selector: ".section.related-projects" });
}
