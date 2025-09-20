console.log("Case Script Loaded");

import { mountCSHero } from "./renders/cases/cs-hero.js";
import { mountCSBody } from "./renders/cases/cs-body.js";
import { mountFooter } from "./renders/footer.js";
import { mountCSQuote } from "./renders/cases/cs-quote.js";
import { mountCSMore } from "./renders/cases/cs-more.js";
import { initPressFeedback } from "./utils/buttons.js";
import { fetchJSON } from "./utils/fetch-json.js";
import { onReady } from "./utils/ready.js";

onReady(async () => {
  await mountCaseSectionsFromData();
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
  await mountCSMore({ selector: ".section.more-projects", currentId: id });
}
