import { describe, test, assertEqual } from './runner.js';
import { frenchSpacing } from '../src/core/typography.js';

const FINE = ' ';
const NBSP = ' ';

describe('frenchSpacing', () => {
  test('espace fine avant ? ! : ; »', () => {
    assertEqual(frenchSpacing('Quoi ? Oui ! Non : peut-être ; fin »'), `Quoi${FINE}? Oui${FINE}! Non${FINE}: peut-être${FINE}; fin${FINE}»`);
  });

  test('remplace aussi une espace insécable', () => {
    assertEqual(frenchSpacing(`Quoi${NBSP}?`), `Quoi${FINE}?`);
  });

  test('« sang ?! » ne reçoit qu’une espace fine', () => {
    assertEqual(frenchSpacing('du sang ?!'), `du sang${FINE}?!`);
  });

  test('espace fine après «', () => {
    assertEqual(frenchSpacing('« Bien cou-rdialement. »'), `«${FINE}Bien cou-rdialement.${FINE}»`);
  });

  test('tiret cadratin de dialogue suivi d’une insécable', () => {
    assertEqual(frenchSpacing('— Où ça ?'), `—${NBSP}Où ça${FINE}?`);
  });

  test('ne touche pas un tiret cadratin hors début de texte', () => {
    assertEqual(frenchSpacing('Il dit — non.'), 'Il dit — non.');
  });

  test('n’insère rien là où il n’y a pas d’espace', () => {
    assertEqual(frenchSpacing('https://exemple.fr/a?b=1'), 'https://exemple.fr/a?b=1');
    assertEqual(frenchSpacing('4 h du matin'), '4 h du matin');
    assertEqual(frenchSpacing('Quoi?!'), 'Quoi?!');
  });

  test('est idempotente', () => {
    const text = '— « Du sang ?! » dit-il : « Oui ; bien sûr ! »';
    const once = frenchSpacing(text);
    assertEqual(frenchSpacing(once), once);
  });
});
