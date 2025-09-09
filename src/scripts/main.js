const page = document.body.dataset.page;
if (page) {
  import(`../styles/${page}.css`);
  import(`../scripts/${page}.js`);
}
