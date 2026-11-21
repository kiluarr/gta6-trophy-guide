// app.js — entry point. The real work lives in js/main.js; this file only
// starts it once the document is ready.
import { boot } from './js/main.js';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => boot().catch(showLoadError));
} else {
  boot().catch(showLoadError);
}

function showLoadError(error) {
  const pane = document.getElementById('detail-pane');
  if (pane) pane.textContent = `Could not load the trophy data: ${error.message}`;
  // eslint-disable-next-line no-console
  console.error(error);
}
