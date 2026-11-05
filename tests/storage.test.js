import { describe, test, assert, assertDeepEqual, assertEqual } from './runner.js';
import { defaultState, transfuse } from '../src/core/reserve.js';
import {
  STORAGE_KEY,
  parseState,
  serializeState,
  readState,
  writeState,
} from '../src/core/storage.js';

const known = ['a', 'b', 'c'];

function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  const calls = [];
  return {
    data,
    calls,
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => {
      calls.push(['setItem', key]);
      data.set(key, String(value));
    },
    removeItem: (key) => {
      calls.push(['removeItem', key]);
      data.delete(key);
    },
    clear: () => {
      calls.push(['clear']);
      data.clear();
    },
  };
}

describe('stockage : lecture', () => {
  test('null, JSON invalide et non-objets donnent l’état par défaut', () => {
    assertDeepEqual(parseState(null, known), defaultState());
    assertDeepEqual(parseState('{pas du json', known), defaultState());
    assertDeepEqual(parseState('42', known), defaultState());
    assertDeepEqual(parseState('[1]', known), defaultState());
    assertDeepEqual(parseState('null', known), defaultState());
  });

  test('v différent de 1 donne l’état par défaut', () => {
    assertDeepEqual(parseState('{"v":2,"seen":["a"],"trash":true}', known), defaultState());
  });

  test('seen qui n’est pas un tableau donne l’état par défaut', () => {
    assertDeepEqual(parseState('{"v":1,"seen":"a","trash":true}', known), defaultState());
  });

  test('purge les identifiants inconnus, non chaînes et doublons', () => {
    const state = parseState('{"v":1,"seen":["a","x","a",3,"b"],"trash":true}', known);
    assertDeepEqual(state, { seen: ['a', 'b'], trash: true });
  });

  test('accepte un Set d’identifiants connus', () => {
    const state = parseState('{"v":1,"seen":["a","z"],"trash":false}', new Set(known));
    assertDeepEqual(state, { seen: ['a'], trash: false });
  });

  test('trash vaut vrai seulement pour true', () => {
    assertEqual(parseState('{"v":1,"seen":[],"trash":"true"}', known).trash, false);
    assertEqual(parseState('{"v":1,"seen":[]}', known).trash, false);
    assertEqual(parseState('{"v":1,"seen":[],"trash":true}', known).trash, true);
  });

  test('readState sur un stockage vide rend l’état par défaut', () => {
    assertDeepEqual(readState(fakeStorage(), known), defaultState());
  });
});

describe('stockage : écriture', () => {
  test('la clé commence par coudegrace:', () => {
    assert(STORAGE_KEY.startsWith('coudegrace:'));
    assertEqual(STORAGE_KEY, 'coudegrace:v1');
  });

  test('l’état par défaut sérialise en null', () => {
    assertEqual(serializeState(defaultState()), null);
  });

  test('sérialise au format attendu', () => {
    assertEqual(serializeState({ seen: ['a'], trash: false }), '{"v":1,"seen":["a"],"trash":false}');
    assertEqual(serializeState({ seen: [], trash: true }), '{"v":1,"seen":[],"trash":true}');
  });

  test('écriture puis lecture redonnent l’état', () => {
    const storage = fakeStorage();
    writeState(storage, { seen: ['b', 'a'], trash: true });
    assertDeepEqual(readState(storage, known), { seen: ['b', 'a'], trash: true });
  });

  test('transfuse supprime seulement coudegrace:v1', () => {
    const storage = fakeStorage({
      [STORAGE_KEY]: '{"v":1,"seen":["a"],"trash":false}',
      'geotrain:v1': 'g',
      pkmon: 'p',
    });
    writeState(storage, transfuse());
    assertEqual(storage.getItem(STORAGE_KEY), null);
    assertEqual(storage.getItem('geotrain:v1'), 'g');
    assertEqual(storage.getItem('pkmon'), 'p');
    assertDeepEqual(storage.calls, [['removeItem', STORAGE_KEY]]);
  });
});
