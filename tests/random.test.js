import { describe, test, assert, assertDeepEqual, assertEqual } from './runner.js';
import { shuffle, pickWithoutRepeat, pickWeighted } from '../src/core/random.js';

const zero = () => 0;

describe('shuffle', () => {
  test('est déterministe avec un aléa injecté', () => {
    assertDeepEqual(shuffle([1, 2, 3, 4], zero), [2, 3, 4, 1]);
  });

  test('ne modifie pas le tableau reçu', () => {
    const items = [1, 2, 3];
    shuffle(items, zero);
    assertDeepEqual(items, [1, 2, 3]);
  });

  test('conserve les mêmes éléments', () => {
    assertDeepEqual([...shuffle([3, 1, 2], () => 0.5)].sort(), [1, 2, 3]);
  });
});

describe('pickWithoutRepeat', () => {
  test('tire le nombre demandé d’éléments distincts', () => {
    const picked = pickWithoutRepeat([1, 2, 3, 4, 5], 3, zero);
    assertEqual(picked.length, 3);
    assertEqual(new Set(picked).size, 3);
  });

  test('rend tout ce qui existe si la source est plus courte', () => {
    assertEqual(pickWithoutRepeat([1, 2], 5, zero).length, 2);
  });

  test('un nombre négatif donne une liste vide', () => {
    assertDeepEqual(pickWithoutRepeat([1, 2], -1, zero), []);
  });
});

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

describe('pickWeighted', () => {
  test('tire des éléments distincts, au plus la taille de la source', () => {
    const rng = mulberry32(1);
    const picked = pickWeighted([1, 2, 3, 4], 10, () => 1, rng);
    assertEqual(picked.length, 4);
    assertEqual(new Set(picked).size, 4);
  });

  test('favorise les poids forts sur de nombreux tirages', () => {
    const rng = mulberry32(42);
    const counts = { heavy: 0, light: 0 };
    for (let run = 0; run < 2000; run += 1) {
      const [first] = pickWeighted(['heavy', 'light'], 1, (item) => (item === 'heavy' ? 8 : 1), rng);
      counts[first] += 1;
    }
    assert(counts.heavy > counts.light * 4, `heavy ${counts.heavy} / light ${counts.light}`);
  });

  test('ignore un élément de poids nul tant qu’il reste du choix', () => {
    const picked = pickWeighted(['a', 'b', 'c'], 2, (item) => (item === 'c' ? 0 : 1), mulberry32(7));
    assertDeepEqual([...picked].sort(), ['a', 'b']);
  });

  test('est déterministe avec une même graine', () => {
    const first = pickWeighted([1, 2, 3, 4, 5], 3, (item) => item, mulberry32(9));
    const second = pickWeighted([1, 2, 3, 4, 5], 3, (item) => item, mulberry32(9));
    assertDeepEqual(first, second);
  });

  test('un nombre négatif donne une liste vide', () => {
    assertDeepEqual(pickWeighted([1, 2], -1, () => 1, zero), []);
  });
});
