console.log("Home Script Loaded");

import { mountFooter } from "./renders/footer.js";
import { mountHero } from "./renders/hero.js";
import { mountReferences } from "./renders/references.js";
import { mountTestimony } from "./renders/testimony.js";
import { initPressFeedback } from "./utils/buttons.js";
import { onReady } from "./utils/ready.js";

onReady(() => {
  initPressFeedback();
  mountHero();
  mountReferences();
  mountTestimony();
  mountFooter();
});
