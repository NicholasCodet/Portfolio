import { onReady } from './utils/ready.js';
import { mountUIFab } from '../components/ui-fab/ui-fab.js';

const page = document.body.dataset.page;
if (page) {
  import(`../styles/${page}.css`);
  import(`../scripts/${page}.js`);
}

onReady(() => {
  // Mount FAB globally on all pages
  mountUIFab();
});
