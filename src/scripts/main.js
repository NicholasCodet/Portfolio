import "../styles/reset.css";
import "../styles/tokens.css";
import "../styles/base.css";
import "../styles/layouts.css";

import { onReady } from "./utils/ready.js";
import { mountUIFab } from "../components/ui-fab/ui-fab.js";

const scriptModules = import.meta.glob("./*.js");

const page = document.body.dataset.page;
if (page) {
  scriptModules[`./${page}.js`]?.();
}

onReady(() => {
  mountUIFab();
});
