import { frenchSpacing } from '../../core/typography.js';
import { JOKES } from '../../data/jokes.js';
import { div, el, text } from '../dom.js';
import { createHeader } from '../header.js';

const REPOSITORY_URL = 'https://github.com/JambonPasFrais/cou-de-grace';
const FORM_URL = `${REPOSITORY_URL}/issues/new?template=blague.yml`;
const CONTRIBUTING_URL = `${REPOSITORY_URL}/blob/main/CONTRIBUTING.md`;

const external = (content, href) =>
  text('a', frenchSpacing(content), { href, target: '_blank', rel: 'noopener' });

function credits() {
  const sources = new Map();
  for (const { source } of JOKES) {
    if (source.url && !sources.has(source.name)) {
      sources.set(source.name, source.url);
    }
  }
  return [...sources].map(([name, url]) => el('li', {}, [external(name, url)]));
}

function section(title, children) {
  return el('section', { class: 'apropos__section' }, [text('h2', frenchSpacing(title)), ...children]);
}

export function aboutScreen() {
  return div({ class: 'apropos' }, [
    createHeader(),
    div({ class: 'apropos__contenu' }, [
      text(
        'p',
        frenchSpacing(
          'Le cou de grâce sert des blagues de vampire pour achever vos collègues, de gêne ou de rire. Il ne vous ressert jamais une blague déjà vue dans ce navigateur, sans compte ni inscription.',
        ),
      ),
      section('Proposer une blague', [
        text(
          'p',
          frenchSpacing(
            'La banque grandit grâce à vous. Sans écrire de code, avec le formulaire Proposer une blague (un compte GitHub est nécessaire). Pour les développeurs, par une pull request sur src/data/jokes.js, en suivant CONTRIBUTING.md. Chaque blague est relue avant d\'entrer.',
          ),
        ),
        el('ul', { class: 'apropos__liens' }, [
          el('li', {}, [external('Proposer une blague', FORM_URL)]),
          el('li', {}, [external('CONTRIBUTING.md', CONTRIBUTING_URL)]),
        ]),
      ]),
      section('Vos données', [
        text(
          'p',
          frenchSpacing(
            'Le site garde seulement la liste des blagues que vous avez vues et l\'état de l\'interrupteur, dans votre navigateur. Rien n\'est envoyé nulle part. La transfusion efface tout.',
          ),
        ),
      ]),
      section('Licences', [
        text(
          'p',
          frenchSpacing(
            'Le code est sous licence MIT. Les blagues sont sous licence CC BY 4.0 : vous pouvez les reprendre en citant Le cou de grâce.',
          ),
        ),
        el('ul', { class: 'apropos__liens' }, [el('li', {}, [external('Le code sur GitHub', REPOSITORY_URL)])]),
      ]),
      section('Sources', [
        text('p', frenchSpacing('Merci aux sites dont viennent nos blagues :')),
        el('ul', { class: 'apropos__sources' }, credits()),
        text('p', frenchSpacing('et quelques créations originales.')),
      ]),
      text('a', frenchSpacing('Retour aux blagues'), { class: 'lien apropos__retour', href: '#/' }),
    ]),
  ]);
}
