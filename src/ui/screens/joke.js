import { allowedJokes } from '../../core/bank.js';
import { drawJoke, gauge, reveal, setTrash } from '../../core/reserve.js';
import { frenchSpacing } from '../../core/typography.js';
import { JOKES } from '../../data/jokes.js';
import { button, div, el, text } from '../dom.js';
import { createGauge } from '../gauge.js';
import { loadState, saveState } from '../persistence.js';
import { svg } from '../svg.js';

const CONTRIBUTE_URL = 'https://github.com/JambonPasFrais/cou-de-grace/issues/new?template=blague.yml';
const IGNORED_TARGETS = 'button, a, input, textarea, select, [role="switch"]';
const TRASH_COUNT = JOKES.filter(joke => joke.trash).length;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function paragraph(content) {
  const shown = frenchSpacing(content);
  if (shown.startsWith('— ')) {
    return el('p', { class: 'replique' }, [text('span', '—', { class: 'replique__tiret' }), shown.slice(1)]);
  }
  return text('p', shown);
}

function paragraphs(list) {
  return list.map(paragraph);
}

function sourceLine(source) {
  if (!source.url) {
    return text('p', frenchSpacing(source.name), { class: 'source' });
  }
  return el('p', { class: 'source' }, [
    'Source : ',
    text('a', frenchSpacing(source.name), { href: source.url, target: '_blank', rel: 'noopener' }),
  ]);
}

function fangs() {
  return svg('svg', { class: 'carte__ornement', viewBox: '0 0 48 16', 'aria-hidden': 'true', focusable: 'false' }, [
    svg('path', { d: 'M6 2 L16 2 L11 14 Z' }),
    svg('path', { d: 'M32 2 L42 2 L37 14 Z' }),
  ]);
}

function arrow() {
  return svg('svg', { class: 'icone', viewBox: '0 0 16 16', 'aria-hidden': 'true', focusable: 'false' }, [
    svg('path', { d: 'M6 3 H13 V10 M13 3 L4 12' }),
  ]);
}

function trashDescription() {
  const plural = TRASH_COUNT > 1 ? 's' : '';
  return `Ajoute ${TRASH_COUNT} blague${plural} vulgaire${plural}. À éviter en réunion client.`;
}

export function jokeScreen() {
  const ids = JOKES.map(joke => joke.id);
  let state = loadState(ids);
  let current = null;
  let revealed = false;

  const reserve = createGauge();

  const card = div({ class: 'carte', 'data-state': 'setup' });
  const primary = button({ class: 'bouton', 'data-testid': 'primary', on: { click: () => act() } });
  const shortcut = text('kbd', 'Espace', { class: 'cartouche' });
  const actions = div({ class: 'actions' }, [primary, shortcut]);

  const switchLabel = text('span', frenchSpacing("Âmes sensibles s'abstenir"), {
    id: 'trash-label',
    class: 'interrupteur__libelle',
  });
  const switchNote = text('span', frenchSpacing(trashDescription()), {
    id: 'trash-note',
    class: 'interrupteur__note',
  });
  const trashSwitch = button(
    {
      class: 'interrupteur',
      role: 'switch',
      'aria-checked': String(state.trash),
      'aria-labelledby': 'trash-label',
      'aria-describedby': 'trash-note',
      on: { click: () => toggleTrash() },
    },
    [
      div({ class: 'interrupteur__piste', 'aria-hidden': 'true' }, [div({ class: 'interrupteur__pouce' })]),
      div({ class: 'interrupteur__textes' }, [switchLabel, switchNote]),
    ],
  );

  const footer = el('footer', { class: 'pied' }, [
    button({ class: 'bouton-secondaire' }, [frenchSpacing('Transfusion')]),
    el('a', { class: 'lien', href: CONTRIBUTE_URL, target: '_blank', rel: 'noopener' }, [
      frenchSpacing('Proposer une blague'),
      arrow(),
    ]),
    text('a', frenchSpacing('À propos'), { class: 'lien', href: '#/a-propos' }),
  ]);

  const root = div({ class: 'joke' }, [
    el('header', { class: 'entete' }, [
      text('h1', frenchSpacing('Le cou de grâce'), { class: 'entete__nom' }),
      text('p', frenchSpacing('Achevez vos collègues façon vampire'), { class: 'entete__devise' }),
    ]),
    card,
    actions,
    trashSwitch,
    reserve.node,
    footer,
  ]);

  const allowed = () => allowedJokes(JOKES, state.trash);
  const updateGauge = options => reserve.update(gauge(allowed(), state.seen), options);

  function renderCard() {
    if (current === null) {
      card.dataset.state = 'empty';
      delete card.dataset.jokeId;
      card.replaceChildren(
        fangs(),
        div({ class: 'carte__contenu' }, [text('p', frenchSpacing('Plus aucune blague.'), { class: 'vide' })]),
      );
      actions.hidden = true;
      return;
    }

    actions.hidden = false;
    card.dataset.state = revealed ? 'revealed' : 'setup';
    card.dataset.jokeId = current.id;

    const sizer = div({ class: 'chute__mesure', 'aria-hidden': 'true' }, [
      div({ class: 'chute__texte' }, paragraphs(current.punchline)),
      sourceLine(current.source),
    ]);

    const slot = revealed
      ? div({ class: 'chute__revelee' }, [
          div({ class: 'chute__texte' }, paragraphs(current.punchline)),
          sourceLine(current.source),
        ])
      : text('p', frenchSpacing('Prêt à achever vos collègues ?'), { class: 'chute__invite', 'aria-hidden': 'true' });

    card.replaceChildren(
      fangs(),
      div({ class: 'carte__contenu' }, [
        div({ class: 'amorce' }, paragraphs(current.setup)),
        div({ class: 'chute', 'aria-live': 'polite' }, [sizer, slot]),
      ]),
    );

    primary.replaceChildren(frenchSpacing(revealed ? 'Victime suivante' : 'Achever'));
    return slot;
  }

  function draw() {
    current = drawJoke(allowed(), state.seen, Math.random);
    revealed = false;
    renderCard();
  }

  function act() {
    if (current === null) {
      return;
    }
    if (!revealed) {
      state = reveal(state, current.id);
      saveState(state);
      revealed = true;
      const slot = renderCard();
      updateGauge({ drop: true });
      if (!prefersReducedMotion()) {
        slot.animate(
          [
            { opacity: 0, transform: 'translateY(8px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          { duration: 220, easing: 'ease-out' },
        );
      }
      return;
    }
    draw();
    updateGauge();
    if (!prefersReducedMotion()) {
      card.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 });
    }
  }

  function toggleTrash() {
    state = setTrash(state, !state.trash);
    saveState(state);
    trashSwitch.setAttribute('aria-checked', String(state.trash));
    const cut = current !== null && !revealed && current.trash && !state.trash;
    if (cut || current === null) {
      draw();
    }
    updateGauge();
  }

  document.addEventListener('keydown', function onKey(event) {
    if (!root.isConnected) {
      document.removeEventListener('keydown', onKey);
      return;
    }
    const isSpace = event.key === ' ' || event.code === 'Space';
    if (!isSpace && event.key !== 'Enter') {
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) {
      return;
    }
    if (event.target instanceof Element && event.target.closest(IGNORED_TARGETS)) {
      return;
    }
    if (isSpace) {
      event.preventDefault();
    }
    act();
  });

  draw();
  updateGauge();
  return root;
}
