import { describe, test, assert, assertDeepEqual, assertEqual } from './runner.js';
import {
  defaultState,
  drawJoke,
  reveal,
  gauge,
  trashLeft,
  setTrash,
  setTutorial,
  transfuse,
} from '../src/core/reserve.js';

function mulberry32(seed) {
  let a = seed;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeBank(clean, trash) {
  const bank = [];
  for (let index = 0; index < clean; index += 1) {
    bank.push({ id: `c${index}`, setup: 's', punchline: 'p', trash: false, source: null });
  }
  for (let index = 0; index < trash; index += 1) {
    bank.push({ id: `t${index}`, setup: 's', punchline: 'p', trash: true, source: null });
  }
  return bank;
}

const filterBank = (bank, trash) => bank.filter((joke) => trash || !joke.trash);

describe('réserve : tirage', () => {
  test('N tirages suivis de reveal montrent chaque blague une fois, puis null', () => {
    const bank = makeBank(8, 3);
    const rng = mulberry32(123);
    let state = defaultState();
    const shown = [];
    for (let run = 0; run < bank.length; run += 1) {
      const joke = drawJoke(bank, state.seen, rng);
      assert(joke !== null, 'tirage inattendu à null');
      shown.push(joke.id);
      state = reveal(state, joke.id);
    }
    assertEqual(new Set(shown).size, bank.length);
    assertEqual(drawJoke(bank, state.seen, rng), null);
  });

  test('rend null sur une banque vide', () => {
    assertEqual(drawJoke([], [], mulberry32(1)), null);
  });

  test('supporte un aléa à la limite haute', () => {
    const bank = makeBank(3, 0);
    assert(drawJoke(bank, [], () => 0.9999999) !== null);
  });
});

describe('réserve : interrupteur', () => {
  test('coupé, aucune blague trash n’est tirée', () => {
    const bank = makeBank(10, 6);
    const allowed = filterBank(bank, false);
    const rng = mulberry32(7);
    for (let run = 0; run < 200; run += 1) {
      assertEqual(drawJoke(allowed, [], rng).trash, false);
    }
  });

  test('activé, des blagues trash peuvent sortir et le total augmente', () => {
    const bank = makeBank(10, 6);
    const off = filterBank(bank, false);
    const on = filterBank(bank, true);
    const rng = mulberry32(7);
    let trashSeen = 0;
    for (let run = 0; run < 200; run += 1) {
      if (drawJoke(on, [], rng).trash) {
        trashSeen += 1;
      }
    }
    assert(trashSeen > 0, 'aucune blague trash tirée');
    assertEqual(gauge(off, []).total, 10);
    assertEqual(gauge(on, []).total, 16);
  });

  test('setTrash change seulement trash, sans mutation', () => {
    const state = { seen: ['a'], trash: false, tutorial: false };
    const next = setTrash(state, true);
    assertDeepEqual(next, { seen: ['a'], trash: true, tutorial: false });
    assertDeepEqual(state, { seen: ['a'], trash: false, tutorial: false });
  });

  test('setTutorial change seulement tutorial, sans mutation', () => {
    const state = { seen: ['a'], trash: true, tutorial: true };
    const next = setTutorial(state, false);
    assertDeepEqual(next, { seen: ['a'], trash: true, tutorial: false });
    assertDeepEqual(state, { seen: ['a'], trash: true, tutorial: true });
  });
});

describe('réserve : vue', () => {
  test('drawJoke ne change ni seen ni la jauge', () => {
    const bank = makeBank(5, 0);
    const state = defaultState();
    const before = gauge(bank, state.seen);
    drawJoke(bank, state.seen, mulberry32(3));
    assertDeepEqual(state.seen, []);
    assertDeepEqual(gauge(bank, state.seen), before);
  });

  test('reveal ajoute l’id, une seule fois, sans mutation', () => {
    const bank = makeBank(5, 0);
    const state = defaultState();
    const once = reveal(state, 'c1');
    const twice = reveal(once, 'c1');
    assertDeepEqual(state.seen, []);
    assertDeepEqual(twice.seen, ['c1']);
    assertDeepEqual(gauge(bank, twice.seen), { left: 4, total: 5 });
  });

  test('reveal garde le choix du tutoriel', () => {
    const state = { seen: [], trash: false, tutorial: false };
    assertEqual(reveal(state, 'c1').tutorial, false);
    assertEqual(reveal(reveal(state, 'c1'), 'c1').tutorial, false);
  });

  test('l’état par défaut affiche le tutoriel', () => {
    assertDeepEqual(defaultState(), { seen: [], trash: false, tutorial: true });
  });

  test('transfuse rend l’état par défaut quand le tutoriel est affiché', () => {
    const state = { seen: ['c1'], trash: true, tutorial: true };
    assertDeepEqual(transfuse(state), defaultState());
  });

  test('transfuse garde tutorial: false', () => {
    const state = { seen: ['c1'], trash: true, tutorial: false };
    assertDeepEqual(transfuse(state), { seen: [], trash: false, tutorial: false });
    assertDeepEqual(state, { seen: ['c1'], trash: true, tutorial: false });
  });
});

describe('réserve : trashLeft', () => {
  test('compte les blagues trash non vues de la banque complète', () => {
    const bank = makeBank(4, 6);
    assertEqual(trashLeft(bank, []), 6);
    assertEqual(trashLeft(bank, ['t0', 't1', 'c0']), 4);
    assertEqual(trashLeft(bank, bank.map((joke) => joke.id)), 0);
  });
});
