import { describe, test, assert, assertEqual } from './runner.js';
import { EXHAUSTION_MESSAGES, pickExhaustion } from '../src/core/exhaustion.js';

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

describe('épuisement', () => {
  test('au moins 6 messages, tous non vides et distincts', () => {
    assert(EXHAUSTION_MESSAGES.length >= 6);
    assertEqual(new Set(EXHAUSTION_MESSAGES).size, EXHAUSTION_MESSAGES.length);
    assert(EXHAUSTION_MESSAGES.every((message) => message.length > 0));
  });

  test('500 appels enchaînés ne répètent jamais l’indice précédent', () => {
    const rng = mulberry32(2024);
    let previous = null;
    for (let run = 0; run < 500; run += 1) {
      const index = pickExhaustion(previous, rng);
      assert(Number.isInteger(index) && index >= 0 && index < EXHAUSTION_MESSAGES.length);
      assert(index !== previous, `répétition de ${index} à l’appel ${run}`);
      previous = index;
    }
  });

  test('chaque indice reste atteignable, aux bornes de l’aléa', () => {
    const reached = new Set();
    const rng = mulberry32(5);
    for (let run = 0; run < 300; run += 1) {
      reached.add(pickExhaustion(null, rng));
    }
    assertEqual(reached.size, EXHAUSTION_MESSAGES.length);
    assert(pickExhaustion(0, () => 0) !== 0);
    assert(pickExhaustion(EXHAUSTION_MESSAGES.length - 1, () => 0.9999999) !== EXHAUSTION_MESSAGES.length - 1);
  });
});
