console.log("Case Script Loaded");

import { mountFooter } from "./renders/footer.js";
import { initPressFeedback } from "./utils/buttons.js";
import { onReady } from "./utils/ready.js";

onReady(() => {
  initPressFeedback();
  mountFooter();
});
