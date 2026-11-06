import { mountStorageBanner } from './ui/banner.js';
import { JOKES } from './data/jokes.js';
import { initState, probeStorage } from './ui/persistence.js';
import { createRouter } from './ui/router.js';
import { aboutScreen } from './ui/screens/about.js';
import { jokeScreen } from './ui/screens/joke.js';

const routes = {
  '/': () => jokeScreen(),
  '/a-propos': () => aboutScreen(),
};

const outlet = document.querySelector('#app');

probeStorage();
initState(JOKES.map(joke => joke.id));
mountStorageBanner(document.body, outlet);
createRouter({ routes, outlet }).start();
