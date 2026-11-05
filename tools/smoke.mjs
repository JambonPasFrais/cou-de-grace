import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const STORAGE_KEY = 'coudegrace:v1';
const SCREENSHOT = '/tmp/cou-de-grace/smoke-revealed.png';

async function debuggingPort(profile) {
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

async function launch() {
  const profile = await mkdtemp(join(tmpdir(), 'cou-de-grace-smoke-'));
  const chrome = spawn(
    CHROME,
    ['--headless=new', '--hide-scrollbars', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'],
    { stdio: 'ignore' },
  );
  const port = await debuggingPort(profile);
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = targets.find(target => target.type === 'page');
  const cdp = await connect(page.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  const evaluate = async expression => {
    const { result, exceptionDetails } = await cdp.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (exceptionDetails) {
      throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
    }
    return result.value;
  };

  const waitFor = async (expression, timeout = 5000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const value = await evaluate(expression);
      if (value) return value;
      await sleep(50);
    }
    throw new Error(`délai dépassé : ${expression}`);
  };

  const navigate = async url => {
    const loaded = cdp.once('Page.loadEventFired');
    await cdp.send('Page.navigate', { url });
    await loaded;
  };

  const pressSpace = async () => {
    const key = { key: ' ', code: 'Space', windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32 };
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', text: ' ', ...key });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...key });
  };

  const close = async () => {
    cdp.close();
    const exited = new Promise(resolve => chrome.once('exit', resolve));
    chrome.kill();
    await exited;
    await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  };

  return { cdp, evaluate, waitFor, navigate, pressSpace, close };
}

const cardState = state => `document.querySelector('.carte')?.dataset.state === ${JSON.stringify(state)}`;
const cardId = browser => browser.evaluate("document.querySelector('.carte')?.dataset.jokeId ?? null");

async function main(base) {
  const browser = await launch();
  const failures = [];
  const report = (ok, label, detail) => {
    console.log(`${ok ? 'OK ' : 'KO '} ${label}  ${detail}`);
    if (!ok) failures.push(label);
  };

  try {
    await browser.navigate(base);
    await browser.evaluate(`localStorage.removeItem(${JSON.stringify(STORAGE_KEY)})`);
    await browser.navigate(base);
    await browser.waitFor(cardState('setup'));

    const revealed = [];
    for (let round = 0; round < 3; round += 1) {
      await browser.waitFor(cardState('setup'));
      await browser.pressSpace();
      await browser.waitFor(cardState('revealed'));
      revealed.push(await cardId(browser));
      const label = await browser.evaluate("document.querySelector('[data-testid=\"primary\"]').textContent");
      report(label === 'Victime suivante', `révélation ${round + 1}`, `${revealed[round]} · bouton « ${label} »`);

      if (round === 2) {
        await mkdir('/tmp/cou-de-grace', { recursive: true });
        await sleep(500);
        const { data } = await browser.cdp.send('Page.captureScreenshot', { format: 'png' });
        await writeFile(SCREENSHOT, Buffer.from(data, 'base64'));
      }

      await browser.pressSpace();
      await browser.waitFor(cardState('setup'));
    }

    report(new Set(revealed).size === 3, 'trois blagues différentes', revealed.join(', '));

    const stored = JSON.parse(await browser.evaluate(`localStorage.getItem(${JSON.stringify(STORAGE_KEY)})`) ?? 'null');
    report(
      stored !== null && revealed.every(id => stored.seen.includes(id)) && stored.seen.length === 3,
      'stockage',
      JSON.stringify(stored),
    );

    await browser.navigate(base);
    await browser.waitFor(cardState('setup'));
    const afterReload = await cardId(browser);
    report(!revealed.includes(afterReload), 'rechargement sans doublon', afterReload);

    const gauge = await browser.evaluate("document.querySelector('[role=\"meter\"]')?.getAttribute('aria-valuenow')");
    report(gauge === '37', 'jauge', `aria-valuenow = ${gauge}`);
    report(true, 'capture', SCREENSHOT);
  } catch (error) {
    report(false, 'parcours', error.message);
  } finally {
    await browser.close();
  }

  return failures.length === 0 ? 0 : 1;
}

const base = process.argv[2];
if (!base) {
  console.error('usage : node tools/smoke.mjs <url de base>');
  process.exit(2);
}
process.exit(await main(base));
