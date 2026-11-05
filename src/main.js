import { createRouter } from './ui/router.js';
import { jokeScreen } from './ui/screens/joke.js';

const routes = {
  '/': () => jokeScreen(),
};

createRouter({ routes, outlet: document.querySelector('#app') }).start();
