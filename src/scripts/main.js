import { onReady } from "./utils/ready.js";
import { mountUIFab } from "../components/ui-fab/ui-fab.js";

const styleModules = import.meta.glob("../styles/*.css");
const scriptModules = import.meta.glob("./*.js");

const commonStyles = [
  "../styles/reset.css",
  "../styles/tokens.css",
  "../styles/base.css",
  "../styles/layouts.css",
];

for (const key of commonStyles) {
  styleModules[key]?.();
}

const page = document.body.dataset.page;
if (page) {
  styleModules[`../styles/${page}.css`]?.();
  scriptModules[`./${page}.js`]?.();
}

onReady(() => {
  mountUIFab();
});
