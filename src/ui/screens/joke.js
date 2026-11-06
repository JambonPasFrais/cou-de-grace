import { allowedJokes } from '../../core/bank.js';
import { EXHAUSTION_MESSAGES, pickExhaustion } from '../../core/exhaustion.js';
import { drawJoke, gauge, reveal, setTrash, setTutorial, transfuse, trashLeft } from '../../core/reserve.js';
import { frenchSpacing } from '../../core/typography.js';
import { JOKES } from '../../data/jokes.js';
import { button, div, el, text } from '../dom.js';
import { createEmptyPouch, createGauge } from '../gauge.js';
import { createHeader } from '../header.js';
import { getState, saveState } from '../persistence.js';
import { svg } from '../svg.js';
import { createTour } from '../tour.js';

const CONTRIBUTE_URL = 'https://github.com/JambonPasFrais/cou-de-grace/issues/new?template=blague.yml';
const IGNORED_TARGETS = 'button, a, input, textarea, select, [role="switch"]';
const ORIGINAL_SOURCE = 'Création originale';
let lastExhaustion = null;
let tourLaunched = false;
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
  const name = frenchSpacing(source.name);
  const label = source.name === ORIGINAL_SOURCE ? null : 'Source : ';
  const content = source.url ? text('a', name, { href: source.url, target: '_blank', rel: 'noopener' }) : name;
  return el('p', { class: 'source' }, [label, content]);
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

function contributeLink() {
  return el('a', { class: 'lien', href: CONTRIBUTE_URL, target: '_blank', rel: 'noopener' }, [
    frenchSpacing('Proposer une blague'),
    arrow(),
  ]);
}

function trashLeftLine(count) {
  const plural = count > 1 ? 's' : '';
  return `Il reste ${count} blague${plural} pour les estomacs solides.`;
}

function trashDescription() {
  const plural = TRASH_COUNT > 1 ? 's' : '';
  return `Ajoute ${TRASH_COUNT} blague${plural} vulgaire${plural}. À éviter en réunion client.`;
}

export function jokeScreen() {
  let state = getState();
  let current = null;
  let revealed = false;
  let exhaustion = null;
  let builtFor = null;

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
  const switchState = text('span', '', { class: 'interrupteur__etat', 'aria-hidden': 'true' });
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
      div({ class: 'interrupteur__controle' }, [
        div({ class: 'interrupteur__piste', 'aria-hidden': 'true' }, [div({ class: 'interrupteur__pouce' })]),
        switchState,
      ]),
      div({ class: 'interrupteur__textes' }, [switchLabel, switchNote]),
    ],
  );

  const transfusionButton = button(
    { class: 'bouton-secondaire', 'data-testid': 'transfusion-footer', on: { click: () => openTransfusion() } },
    [frenchSpacing('Transfusion')],
  );

  const footer = el('footer', { class: 'pied' }, [
    transfusionButton,
    contributeLink(),
    button({ class: 'bouton-lien', 'data-testid': 'tour-replay', on: { click: () => tour.open() } }, [
      frenchSpacing('Revoir le tutoriel'),
    ]),
    text('a', frenchSpacing('À propos'), { class: 'lien', href: '#/a-propos' }),
  ]);

  const switchSlot = div({ class: 'interrupteur-emplacement' }, [trashSwitch]);

  const dialog = el('dialog', { class: 'dialogue', 'aria-labelledby': 'transfusion-titre' }, [
    text('h2', frenchSpacing('Transfusion ?'), { id: 'transfusion-titre', class: 'dialogue__titre' }),
    text('p', frenchSpacing('La réserve sera remise à plein. Les blagues déjà vues pourront revenir.'), {
      class: 'dialogue__texte',
    }),
    div({ class: 'dialogue__actions' }, [
      button({ class: 'bouton', 'data-testid': 'transfusion-confirm', on: { click: () => transfuseNow() } }, [
        frenchSpacing('Transfuser'),
      ]),
      button({ class: 'bouton-secondaire', autofocus: true, on: { click: () => dialog.close() } }, [
        frenchSpacing('Annuler'),
      ]),
    ]),
  ]);

  const actionsPinned = () => getComputedStyle(actions).position === 'fixed' && !actions.hidden;

  const tour = createTour({
    trashCount: TRASH_COUNT,
    targets: () => [
      () => (actionsPinned() ? [card] : [card, actions]),
      () => [reserve.node],
      () => [trashSwitch],
      () => [transfusionButton],
    ],
    bottomInset: () => (actionsPinned() ? window.innerHeight - actions.getBoundingClientRect().top : 0),
    onDisable: () => {
      state = setTutorial(state, false);
      saveState(state);
    },
    onClose: () => primary.focus(),
  });

  const root = div({ class: 'joke' }, [
    div({ class: 'centre' }, [
      div({ class: 'bloc' }, [createHeader(), card, actions, switchSlot]),
      reserve.node,
    ]),
    footer,
    dialog,
    tour.node,
  ]);

  const live = div({ class: 'chute__live', 'aria-live': 'polite' });

  function syncSwitch() {
    trashSwitch.setAttribute('aria-checked', String(state.trash));
    switchState.textContent = state.trash ? 'Activé' : 'Coupé';
  }

  const allowed = () => allowedJokes(JOKES, state.trash);
  const updateGauge = options => reserve.update(gauge(allowed(), state.seen), options);

  function renderCard() {
    switchSlot.append(trashSwitch);

    if (current === null) {
      const remaining = trashLeft(JOKES, state.seen);
      const showTrash = !state.trash && remaining > 0;
      card.dataset.state = 'exhausted';
      delete card.dataset.jokeId;
      builtFor = null;
      card.replaceChildren(
        fangs(),
        div({ class: 'carte__contenu' }, [
          div({ class: 'epuise' }, [
            createEmptyPouch(),
            text('p', frenchSpacing(exhaustion), { class: 'epuise__message' }),
            showTrash ? text('p', frenchSpacing(trashLeftLine(remaining)), { class: 'epuise__trash' }) : null,
            showTrash ? trashSwitch : null,
            div({ class: 'epuise__actions' }, [
              button(
                { class: 'bouton', 'data-testid': 'transfusion-card', on: { click: () => openTransfusion() } },
                [frenchSpacing('Transfusion')],
              ),
              contributeLink(),
            ]),
          ]),
        ]),
      );
      actions.hidden = true;
      return;
    }

    actions.hidden = false;
    card.dataset.state = revealed ? 'revealed' : 'setup';
    card.dataset.jokeId = current.id;

    const slot = revealed
      ? div({ class: 'chute__revelee' }, [
          div({ class: 'chute__texte' }, paragraphs(current.punchline)),
          sourceLine(current.source),
        ])
      : text('p', frenchSpacing('Prêt à achever vos collègues ?'), { class: 'chute__invite', 'aria-hidden': 'true' });

    if (builtFor !== current.id) {
      const sizer = div({ class: 'chute__mesure', 'aria-hidden': 'true' }, [
        div({ class: 'chute__texte' }, paragraphs(current.punchline)),
        sourceLine(current.source),
      ]);
      live.replaceChildren(slot);
      card.replaceChildren(
        fangs(),
        div({ class: 'carte__contenu' }, [
          div({ class: 'amorce' }, paragraphs(current.setup)),
          div({ class: 'chute' }, [sizer, live]),
        ]),
      );
      builtFor = current.id;
    } else {
      live.replaceChildren(slot);
    }

    primary.replaceChildren(frenchSpacing(revealed ? 'Victime suivante' : 'Achever'));
    return slot;
  }

  function draw() {
    current = drawJoke(allowed(), state.seen, Math.random);
    revealed = false;
    if (current === null && exhaustion === null) {
      lastExhaustion = pickExhaustion(lastExhaustion, Math.random);
      exhaustion = EXHAUSTION_MESSAGES[lastExhaustion];
    } else if (current !== null) {
      exhaustion = null;
    }
    renderCard();
  }

  function act() {
    if (current === null) {
      openTransfusion();
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

  function openTransfusion() {
    if (!dialog.open) {
      dialog.showModal();
    }
  }

  function transfuseNow() {
    dialog.close();
    state = transfuse(state);
    saveState(state);
    syncSwitch();
    draw();
    updateGauge({ rise: true });
    primary.focus();
  }

  function toggleTrash() {
    state = setTrash(state, !state.trash);
    saveState(state);
    syncSwitch();
    const cut = current !== null && !revealed && current.trash && !state.trash;
    if (cut || current === null) {
      draw();
    }
    updateGauge();
    trashSwitch.focus();
  }

  document.addEventListener('keydown', function onKey(event) {
    if (!root.isConnected) {
      document.removeEventListener('keydown', onKey);
      return;
    }
    if (dialog.open || tour.isOpen()) {
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
    event.preventDefault();
    act();
  });

  syncSwitch();
  draw();
  updateGauge();

  if (!tourLaunched) {
    tourLaunched = true;
    if (state.tutorial && current !== null) {
      requestAnimationFrame(() => {
        if (root.isConnected) {
          tour.open();
        }
      });
    }
  }
  return root;
}
