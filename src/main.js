import { mountStorageBanner } from './ui/banner.js';
import { probeStorage } from './ui/persistence.js';
import { createRouter } from './ui/router.js';
import { aboutScreen } from './ui/screens/about.js';
import { jokeScreen } from './ui/screens/joke.js';

const routes = {
  '/': () => jokeScreen(),
  '/a-propos': () => aboutScreen(),
};

const outlet = document.querySelector('#app');

probeStorage();
mountStorageBanner(document.body, outlet);
createRouter({ routes, outlet }).start();
