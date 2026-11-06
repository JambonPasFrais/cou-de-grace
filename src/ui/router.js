const DEFAULT_PATH = '/';

export function parseHash(hash) {
  const raw = hash.replace(/^#/, '');
  const [path, query = ''] = raw.split('?');
  return { path: path || DEFAULT_PATH, params: new URLSearchParams(query) };
}

export function toHash(path, params = {}) {
  const entries = Object.entries(params)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => [key, String(value)]);

  const query = new URLSearchParams(entries).toString();
  return `#${path}${query ? `?${query}` : ''}`;
}

export function createRouter({ routes, outlet }) {
  const navigate = (path, params) => {
    window.location.hash = toHash(path, params);
  };

  const render = () => {
    const { path, params } = parseHash(window.location.hash);
    const screen = routes[path] ?? routes[DEFAULT_PATH];

    outlet.replaceChildren(screen({ params, navigate }));
    window.scrollTo({ top: 0 });
  };

  return {
    start() {
      window.addEventListener('hashchange', render);
      render();
    },
  };
}
