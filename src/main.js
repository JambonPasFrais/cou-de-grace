import { createRouter } from './ui/router.js';

const routes = {
  '/': () => document.createDocumentFragment(),
};

createRouter({ routes, outlet: document.querySelector('#app') }).start();
