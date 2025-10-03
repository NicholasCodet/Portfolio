import { onReady } from "./utils/ready.js";
import { mountUIFab } from "../components/ui-fab/ui-fab.js";

const styleModules = import.meta.glob("../styles/*.css");
const scriptModules = import.meta.glob("./*.js");

const page = document.body.dataset.page;
if (page) {
  const styleImport = styleModules[`../styles/${page}.css`];
  const scriptImport = scriptModules[`./${page}.js`];
  styleImport?.();
  scriptImport?.();
}

onReady(() => {
  // Mount FAB globally on all pages
  mountUIFab();
});
