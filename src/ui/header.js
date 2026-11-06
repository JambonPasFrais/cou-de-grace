import { frenchSpacing } from '../core/typography.js';
import { el, text } from './dom.js';

export function createHeader() {
  return el('header', { class: 'entete' }, [
    text('h1', frenchSpacing('Le cou de grâce'), { class: 'entete__nom' }),
    text('p', frenchSpacing('Achevez vos collègues façon vampire'), { class: 'entete__devise' }),
  ]);
}
