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
    assertDeepEqual(state, { seen: ['a', 'b'], trash: true, tutorial: true });
  });

  test('accepte un Set d’identifiants connus', () => {
    const state = parseState('{"v":1,"seen":["a","z"],"trash":false}', new Set(known));
    assertDeepEqual(state, { seen: ['a'], trash: false, tutorial: true });
  });

  test('trash vaut vrai seulement pour true', () => {
    assertEqual(parseState('{"v":1,"seen":[],"trash":"true"}', known).trash, false);
    assertEqual(parseState('{"v":1,"seen":[]}', known).trash, false);
    assertEqual(parseState('{"v":1,"seen":[],"trash":true}', known).trash, true);
  });

  test('une clé sans champ tutorial se lit avec le tutoriel affiché', () => {
    assertEqual(parseState('{"v":1,"seen":["a"],"trash":true}', known).tutorial, true);
    assertEqual(parseState('{"v":1,"seen":[],"trash":false,"tutorial":true}', known).tutorial, true);
  });

  test('tutorial vaut faux seulement pour false', () => {
    assertEqual(parseState('{"v":1,"seen":[],"trash":false,"tutorial":false}', known).tutorial, false);
    assertEqual(parseState('{"v":1,"seen":[],"trash":false,"tutorial":0}', known).tutorial, true);
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

  test('tutoriel désactivé : l’état n’est plus l’état par défaut', () => {
    assertEqual(
      serializeState({ seen: [], trash: false, tutorial: false }),
      '{"v":1,"seen":[],"trash":false,"tutorial":false}',
    );
  });

  test('sérialise au format attendu', () => {
    assertEqual(
      serializeState({ seen: ['a'], trash: false, tutorial: true }),
      '{"v":1,"seen":["a"],"trash":false,"tutorial":true}',
    );
    assertEqual(
      serializeState({ seen: [], trash: true, tutorial: true }),
      '{"v":1,"seen":[],"trash":true,"tutorial":true}',
    );
  });

  test('écriture puis lecture redonnent l’état', () => {
    const storage = fakeStorage();
    writeState(storage, { seen: ['b', 'a'], trash: true, tutorial: false });
    assertDeepEqual(readState(storage, known), { seen: ['b', 'a'], trash: true, tutorial: false });
  });

  test('transfuse supprime seulement coudegrace:v1', () => {
    const storage = fakeStorage({
      [STORAGE_KEY]: '{"v":1,"seen":["a"],"trash":false}',
      'geotrain:v1': 'g',
      pkmon: 'p',
    });
    writeState(storage, transfuse({ seen: ['a'], trash: false, tutorial: true }));
    assertEqual(storage.getItem(STORAGE_KEY), null);
    assertEqual(storage.getItem('geotrain:v1'), 'g');
    assertEqual(storage.getItem('pkmon'), 'p');
    assertDeepEqual(storage.calls, [['removeItem', STORAGE_KEY]]);
  });

  test('transfuse garde tutorial: false et écrit la clé', () => {
    const storage = fakeStorage({
      [STORAGE_KEY]: '{"v":1,"seen":["a"],"trash":true,"tutorial":false}',
      'geotrain:v1': 'g',
    });
    writeState(storage, transfuse(readState(storage, known)));
    assertEqual(storage.getItem(STORAGE_KEY), '{"v":1,"seen":[],"trash":false,"tutorial":false}');
    assertEqual(storage.getItem('geotrain:v1'), 'g');
  });

  test('l’état par défaut supprime toujours la clé', () => {
    const storage = fakeStorage({ [STORAGE_KEY]: '{"v":1,"seen":[],"trash":true,"tutorial":true}' });
    writeState(storage, defaultState());
    assertEqual(storage.getItem(STORAGE_KEY), null);
    assertDeepEqual(storage.calls, [['removeItem', STORAGE_KEY]]);
  });
});
