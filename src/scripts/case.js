console.log("Case Script Loaded");

import { mountCSBody } from "./renders/cases/cs-body.js";
import { mountCSHero } from "./renders/cases/cs-hero.js";
import { mountCSMore } from "./renders/cases/cs-more.js";
import { mountCSQuote } from "./renders/cases/cs-quote.js";
import { mountFooter } from "./renders/footer.js";
import { initPressFeedback } from "./utils/buttons.js";
import { initClickSound } from "./utils/click-sound.js";
import { fetchJSON } from "./utils/fetch-json.js";
import { onReady } from "./utils/ready.js";

onReady(async () => {
  await mountCaseSectionsFromData();
  initClickSound();
  initPressFeedback();
  mountFooter();
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
  mountCSHero({ selector: ".section.case-hero", data });
  mountCSBody({ selector: ".section.case-body", data });
  mountCSQuote({ selector: ".section.case-quote", data });
  mountCSMore({ selector: ".section.more-projects", currentId: id });
}
