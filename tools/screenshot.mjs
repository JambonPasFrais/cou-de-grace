import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const [url, widthArg, output, ...rest] = process.argv.slice(2);
if (!url || !widthArg || !output) {
  console.error('usage : node tools/screenshot.mjs <url> <largeur> <fichier.png> [hauteur] [sombre] [reduit]');
  process.exit(2);
}

const width = Number(widthArg);
const heightArg = rest.find(value => /^\d+$/.test(value));
const height = heightArg ? Number(heightArg) : 800;
const dark = rest.includes('sombre');
const reducedMotion = rest.includes('reduit');

const profile = await mkdtemp(join(tmpdir(), 'cou-de-grace-chrome-'));
const chrome = spawn(
  CHROME,
  ['--headless=new', '--hide-scrollbars', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'],
  { stdio: 'ignore' },
);

async function debuggingPort() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const [port] = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n');
      if (port) return port;
    } catch {}
    await sleep(100);
  }
  throw new Error('Chrome ne répond pas');
}

function connect(socketUrl) {
  const socket = new WebSocket(socketUrl);
  const pending = new Map();
  const listeners = new Map();
  let nextId = 0;

  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? reject(new Error(message.error.message)) : resolve(message.result);
    } else if (message.method && listeners.has(message.method)) {
      listeners.get(message.method)(message.params);
      listeners.delete(message.method);
    }
  });

  return new Promise((resolve, reject) => {
    socket.addEventListener('error', reject, { once: true });
    socket.addEventListener('open', () =>
      resolve({
        send: (method, params = {}) =>
          new Promise((done, fail) => {
            nextId += 1;
            pending.set(nextId, { resolve: done, reject: fail });
            socket.send(JSON.stringify({ id: nextId, method, params }));
          }),
        once: method => new Promise(done => listeners.set(method, done)),
        close: () => socket.close(),
      }),
    );
  });
}

try {
  const port = await debuggingPort();
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = targets.find(target => target.type === 'page');
  const cdp = await connect(page.webSocketDebuggerUrl);

  await cdp.send('Page.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 2,
    mobile: width < 600,
  });
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-color-scheme', value: dark ? 'dark' : 'light' },
      { name: 'prefers-reduced-motion', value: reducedMotion ? 'reduce' : 'no-preference' },
    ],
  });

  const loaded = cdp.once('Page.loadEventFired');
  await cdp.send('Page.navigate', { url });
  await loaded;
  await sleep(400);

  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
  await writeFile(output, Buffer.from(data, 'base64'));
  cdp.close();
  console.log(`${output} (${width}×${height}${dark ? ', sombre' : ''}${reducedMotion ? ', animations réduites' : ''})`);
} finally {
  const exited = new Promise(resolve => chrome.once('exit', resolve));
  chrome.kill();
  await exited;
  await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
}
