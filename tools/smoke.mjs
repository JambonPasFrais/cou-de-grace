import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { EXHAUSTION_MESSAGES } from '../src/core/exhaustion.js';
import { JOKES } from '../src/data/jokes.js';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const STORAGE_KEY = 'coudegrace:v1';
const SCREENSHOT = '/tmp/cou-de-grace/smoke-revealed.png';
const OUTPUT = '/tmp/cou-de-grace';
const FOREIGN_KEY = 'geotrain:v1';
const PROBE_KEY = 'coudegrace:test';
const MAX_PRESSES = 2 * 44 + 5;
const plain = value => value.replace(/[\u00a0\u202f]/g, ' ');

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

  const pressEnter = async () => {
    const key = { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 };
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', text: '\r', ...key });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...key });
  };

  const close = async () => {
    cdp.close();
    const exited = new Promise(resolve => chrome.once('exit', resolve));
    chrome.kill();
    await exited;
    await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  };

  return { cdp, evaluate, waitFor, navigate, pressSpace, pressEnter, close };
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

  const stored = key => browser.evaluate(`localStorage.getItem(${JSON.stringify(key)})`);
  const viewport = (width, height, mobile = false) =>
    browser.cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  const media = (dark, reduced) =>
    browser.cdp.send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'prefers-color-scheme', value: dark ? 'dark' : 'light' },
        { name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' },
      ],
    });
  const capture = async name => {
    await sleep(600);
    const { data } = await browser.cdp.send('Page.captureScreenshot', { format: 'png' });
    await writeFile(`${OUTPUT}/${name}.png`, Buffer.from(data, 'base64'));
    report(true, 'capture', `${OUTPUT}/${name}.png`);
  };
  const exhaust = async () => {
    for (let presses = 0; presses < MAX_PRESSES; presses += 1) {
      if (await browser.evaluate(cardState('exhausted'))) return presses;
      await browser.pressSpace();
    }
    await browser.waitFor(cardState('exhausted'), 1000);
    return MAX_PRESSES;
  };
  const click = selector => browser.evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const text = selector => browser.evaluate(`document.querySelector(${JSON.stringify(selector)})?.textContent ?? null`);

  try {
    await mkdir(OUTPUT, { recursive: true });
    await browser.navigate(base);
    await browser.evaluate(`localStorage.removeItem(${JSON.stringify(STORAGE_KEY)})`);
    await browser.evaluate(`localStorage.setItem(${JSON.stringify(FOREIGN_KEY)}, '{"x":1}')`);
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

    const saved = JSON.parse((await stored(STORAGE_KEY)) ?? 'null');
    report(
      saved !== null && revealed.every(id => saved.seen.includes(id)) && saved.seen.length === 3,
      'stockage',
      JSON.stringify(saved),
    );

    await browser.navigate(base);
    await browser.waitFor(cardState('setup'));
    const afterReload = await cardId(browser);
    report(!revealed.includes(afterReload), 'rechargement sans doublon', afterReload);

    await browser.navigate(base);
    await browser.waitFor(cardState('setup'));
    const unrevealed = await cardId(browser);
    await browser.navigate(base);
    await browser.waitFor(cardState('setup'));
    const afterSecondReload = JSON.parse((await stored(STORAGE_KEY)) ?? 'null');
    report(
      afterSecondReload !== null && afterSecondReload.seen.length === 3 && !afterSecondReload.seen.includes(unrevealed),
      'chute non révélée non comptée',
      `${unrevealed} · ${JSON.stringify(afterSecondReload?.seen)}`,
    );

    const gauge = await browser.evaluate("document.querySelector('[role=\"meter\"]')?.getAttribute('aria-valuenow')");
    report(gauge === '37', 'jauge', `aria-valuenow = ${gauge}`);
    report(true, 'capture', SCREENSHOT);

    const presses = await exhaust();
    const message = plain((await text('.epuise__message')) ?? '');
    report(
      EXHAUSTION_MESSAGES.some(candidate => plain(candidate) === message),
      'épuisement',
      `${presses} appuis · « ${message} »`,
    );
    const line = plain((await text('.epuise__trash')) ?? '');
    report(line === 'Il reste 4 blagues pour les estomacs solides.', 'ligne trash', `« ${line} »`);
    const shownAfterExhaustion = await browser.evaluate(
      "!document.querySelector('.carte .interrupteur') ? 'absent' : 'sous la ligne'",
    );
    report(shownAfterExhaustion === 'sous la ligne', 'interrupteur dans la carte', shownAfterExhaustion);
    await media(false, false);
    await capture('epuisement-1440-clair');
    await media(true, false);
    await capture('epuisement-1440-sombre');
    await media(false, false);

    const beforeEnter = await stored(STORAGE_KEY);
    await browser.evaluate('document.activeElement.blur()');
    await browser.pressEnter();
    await sleep(200);
    const dialogState = await browser.evaluate(
      '({ open: document.querySelector("dialog").open, label: document.activeElement?.textContent ?? null })',
    );
    report(
      dialogState.open === true && plain(dialogState.label ?? '') === 'Annuler' && (await stored(STORAGE_KEY)) === beforeEnter,
      'Entrée ouvre le dialogue sans transfuser',
      `ouvert = ${dialogState.open} · focus « ${dialogState.label} » · stockage inchangé = ${(await stored(STORAGE_KEY)) === beforeEnter}`,
    );
    await browser.evaluate('document.querySelector("dialog").close()');
    await browser.evaluate('document.activeElement.blur()');

    const stateWord = await text('.interrupteur__etat');
    report(stateWord === 'Coupé', 'état visible de l\'interrupteur', `« ${stateWord} »`);

    await click('[role="switch"]');
    await browser.evaluate('document.activeElement.blur()');
    await browser.waitFor(cardState('setup'));
    const trashId = await cardId(browser);
    report(JOKES.find(joke => joke.id === trashId)?.trash === true, 'blague trash après activation', trashId);
    await exhaust();
    const goneLine = await text('.epuise__trash');
    report(goneLine === null, 'ligne trash disparue', String(goneLine));

    const stateWordOn = await text('.interrupteur__etat');
    report(stateWordOn === 'Activé', 'état visible activé', `« ${stateWordOn} »`);
    const messageBefore = plain((await text('.epuise__message')) ?? '');

    await click('[data-testid="transfusion-footer"]');
    await browser.waitFor('document.querySelector("dialog")?.open === true');
    await capture('transfusion-1440');
    const title = plain((await text('dialog h2')) ?? '');
    report(title === 'Transfusion ?', 'dialogue', `« ${title} »`);
    await click('[data-testid="transfusion-confirm"]');
    await browser.waitFor(cardState('setup'));
    const meter = await browser.evaluate("document.querySelector('[role=\"meter\"]').getAttribute('aria-valuenow')");
    report(meter === '40', 'jauge après transfusion', `aria-valuenow = ${meter}`);
    report((await stored(STORAGE_KEY)) === null, 'clé coudegrace:v1 absente', String(await stored(STORAGE_KEY)));
    report((await stored(FOREIGN_KEY)) === '{"x":1}', 'clé geotrain:v1 intacte', String(await stored(FOREIGN_KEY)));
    report((await stored(PROBE_KEY)) === null, 'aucune clé coudegrace:test', String(await stored(PROBE_KEY)));
    await exhaust();
    const messageAfter = plain((await text('.epuise__message')) ?? '');
    report(
      messageAfter !== '' && messageAfter !== messageBefore,
      'message d\'épuisement différent du précédent',
      `« ${messageBefore} » puis « ${messageAfter} »`,
    );

    await browser.evaluate("location.hash = '#/a-propos'");
    await browser.waitFor("document.querySelector('.apropos') !== null");
    const formLink = await browser.evaluate(
      "document.querySelector('a[href=\"https://github.com/JambonPasFrais/cou-de-grace/issues/new?template=blague.yml\"]') !== null",
    );
    report(formLink, 'lien du formulaire', String(formLink));
    const sources = await text('.apropos__sources');
    report(sources?.includes('Phortail') === true, 'Phortail dans les sources', String(sources));
    const back = await browser.evaluate(
      "[...document.querySelectorAll('a')].some(a => a.textContent === 'Retour aux blagues' && a.getAttribute('href') === '#/')",
    );
    report(back, 'lien Retour aux blagues', String(back));
    await capture('a-propos-1440');
    await viewport(390, 844, true);
    await capture('a-propos-390');
    await viewport(1440, 900);

    const longest = JOKES.filter(joke => !joke.trash).sort(
      (a, b) => [...b.setup, ...b.punchline].join(' ').length - [...a.setup, ...a.punchline].join(' ').length,
    )[0];
    const others = JOKES.filter(joke => !joke.trash && joke.id !== longest.id).map(joke => joke.id);
    await browser.evaluate("location.hash = '#/'");
    await browser.evaluate(
      `localStorage.setItem(${JSON.stringify(STORAGE_KEY)}, ${JSON.stringify(JSON.stringify({ v: 1, seen: others, trash: false }))})`,
    );
    await viewport(1280, 720);
    await browser.navigate(base);
    await browser.waitFor(cardState('setup'));
    await browser.pressSpace();
    await browser.waitFor(cardState('revealed'));
    await sleep(600);
    const metrics = await browser.evaluate(
      '({ scroll: document.scrollingElement.scrollHeight, inner: innerHeight, id: document.querySelector(".carte").dataset.jokeId })',
    );
    report(
      metrics.id === longest.id && metrics.scroll <= metrics.inner,
      'longue blague sans défilement à 1280×720',
      `${metrics.id} · scrollHeight ${metrics.scroll} <= innerHeight ${metrics.inner}`,
    );
    await viewport(390, 844, true);
    await capture('principal-revele-390');
    await viewport(1440, 900);

    await browser.evaluate(`localStorage.removeItem(${JSON.stringify(STORAGE_KEY)})`);
    await browser.navigate(base);
    await browser.waitFor(cardState('setup'));
    await media(false, true);
    await browser.pressSpace();
    await browser.waitFor(cardState('revealed'));
    await sleep(100);
    const animations = await browser.evaluate('document.getAnimations().length');
    report(animations === 0, 'sans animation', `document.getAnimations().length = ${animations}`);
    await media(false, false);

    const keys = JSON.parse(await browser.evaluate('JSON.stringify(Object.keys(localStorage))'));
    report(
      keys.every(key => key === FOREIGN_KEY || key === STORAGE_KEY) && keys.includes(FOREIGN_KEY),
      'clés du localStorage',
      keys.join(', '),
    );

    const blocker = await browser.cdp.send('Page.addScriptToEvaluateOnNewDocument', {
      source: "Storage.prototype.setItem = function () { throw new DOMException('bloqué', 'QuotaExceededError'); };",
    });
    await browser.navigate(base);
    await browser.waitFor(cardState('setup'));
    const bannerText = plain((await text('.bandeau')) ?? '');
    const bannerShown = await browser.evaluate("document.querySelector('.bandeau')?.hidden === false");
    report(
      bannerShown && bannerText === 'Vos blagues vues ne seront pas gardées dans ce navigateur.',
      'stockage bloqué : bandeau',
      `« ${bannerText} » · visible = ${bannerShown}`,
    );
    await browser.pressSpace();
    const usable = await browser
      .waitFor(cardState('revealed'))
      .then(() => true)
      .catch(() => false);
    report(usable, 'stockage bloqué : révélation possible', String(usable));
    await browser.cdp.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: blocker.identifier });
    await browser.navigate(base);
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
