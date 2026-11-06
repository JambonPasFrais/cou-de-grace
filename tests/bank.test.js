import { describe, test, assert, assertEqual, assertDeepEqual } from './runner.js';
import { JOKES } from '../src/data/jokes.js';
import { validateBank, allowedJokes } from '../src/core/bank.js';

function valid(overrides = {}) {
  return {
    id: 'exemple',
    setup: ['Une question ?'],
    punchline: ['Une réponse.'],
    trash: false,
    source: { name: 'Source', url: 'https://exemple.fr' },
    ...overrides
  };
}

function errorsFor(jokes) {
  return validateBank(jokes);
}

describe('banque réelle', () => {
  test('passe validateBank sans erreur', () => {
    assertDeepEqual(validateBank(JOKES), []);
  });

  test('compte au moins 30 blagues dont 25 non trash', () => {
    assert(JOKES.length >= 30, `${JOKES.length} blagues`);
    assert(JOKES.filter((joke) => !joke.trash).length >= 25, 'moins de 25 blagues non trash');
  });
});

describe('validateBank', () => {
  test('accepte une blague valide, avec ou sans url', () => {
    assertDeepEqual(errorsFor([valid(), valid({ id: 'autre', source: { name: 'Source' } })]), []);
  });

  test('signale un identifiant en double', () => {
    const errors = errorsFor([valid(), valid()]);
    assertEqual(errors.length, 1);
    assert(errors[0].startsWith('exemple'), errors[0]);
  });

  test('signale une chute vide', () => {
    assertEqual(errorsFor([valid({ punchline: [] })]).length, 1);
    assertEqual(errorsFor([valid({ punchline: ['  '] })]).length, 1);
  });

  test('signale une url en http://', () => {
    assertEqual(errorsFor([valid({ source: { name: 'S', url: 'http://exemple.fr' } })]).length, 1);
  });

  test('signale un identifiant de 25 caractères', () => {
    assertEqual(errorsFor([valid({ id: 'a'.repeat(25) })]).length, 1);
    assertEqual(errorsFor([valid({ id: 'a'.repeat(24) })]).length, 0);
  });

  test('signale un identifiant avec une majuscule', () => {
    assertEqual(errorsFor([valid({ id: 'Exemple' })]).length, 1);
  });

  test('signale un trash qui n’est pas un booléen', () => {
    assertEqual(errorsFor([valid({ trash: 'non' })]).length, 1);
  });

  test('signale un source.name manquant', () => {
    assertEqual(errorsFor([valid({ source: { url: 'https://exemple.fr' } })]).length, 1);
  });

  test('signale un setup vide', () => {
    assertEqual(errorsFor([valid({ setup: [] })]).length, 1);
  });

  test('désigne la blague par sa position si l’identifiant manque', () => {
    const errors = errorsFor([valid(), valid({ id: undefined })]);
    assert(errors.length >= 1 && errors[0].startsWith('#2'), errors[0]);
  });
});

describe('allowedJokes', () => {
  const bank = [valid({ id: 'a' }), valid({ id: 'b', trash: true }), valid({ id: 'c' })];

  test('rend toute la banque si trash est vrai', () => {
    assertDeepEqual(allowedJokes(bank, true).map((joke) => joke.id), ['a', 'b', 'c']);
  });

  test('ne garde que les blagues non trash, dans l’ordre', () => {
    assertDeepEqual(allowedJokes(bank, false).map((joke) => joke.id), ['a', 'c']);
  });
});
