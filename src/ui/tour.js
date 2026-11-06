import { frenchSpacing } from '../core/typography.js';
import { button, div, text } from './dom.js';

const HOLE_MARGIN = 8;
const GAP = 14;
const EDGE = 16;
const ARROW = 12;
const FADE_MS = 200;
const TOTAL = 4;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isNarrow = () => window.matchMedia('(max-width: 899px)').matches;

function plural(count, one, many) {
  return count > 1 ? many : one;
}

function stepTexts(trashCount) {
  return [
    {
      title: 'Achevez vos collègues',
      body: "Lisez l'amorce, puis appuyez sur « Achever » ou sur Espace pour révéler la chute. « Victime suivante » passe à la blague d'après.",
      sides: ['below', 'above', 'left', 'right'],
    },
    {
      title: 'La réserve de sang',
      body: "La poche compte les blagues que vous n'avez pas encore vues. Chaque chute révélée la vide un peu : le site ne vous ressert jamais une blague déjà vue dans ce navigateur.",
      sides: ['left', 'right', 'below', 'above'],
    },
    {
      title: "Âmes sensibles s'abstenir",
      body: `Coupé par défaut. Activé, il ajoute ${trashCount} ${plural(trashCount, 'blague vulgaire', 'blagues vulgaires')} à la réserve. À éviter en réunion client.`,
      sides: ['above', 'below', 'left', 'right'],
    },
    {
      title: 'La transfusion',
      body: 'Poche vide ? La transfusion la remplit, et toutes les blagues peuvent revenir. Votre historique reste dans ce navigateur, sans compte.',
      sides: ['above', 'below', 'left', 'right'],
    },
  ];
}

function union(elements) {
  const rects = elements
    .map(element => element.getBoundingClientRect())
    .filter(rect => rect.width > 0 && rect.height > 0);
  if (rects.length === 0) {
    return null;
  }
  return {
    left: Math.min(...rects.map(rect => rect.left)),
    top: Math.min(...rects.map(rect => rect.top)),
    right: Math.max(...rects.map(rect => rect.right)),
    bottom: Math.max(...rects.map(rect => rect.bottom)),
  };
}

const clamp = (value, min, max) => Math.max(min, Math.min(value, Math.max(min, max)));

export function createTour({ trashCount, targets, bottomInset, onDisable, onClose }) {
  const steps = stepTexts(trashCount);
  let index = 0;
  let frame = 0;
  let active = false;

  const counter = text('p', '', { class: 'tour__compteur' });
  const title = text('h2', '', { id: 'tour-titre', class: 'tour__titre' });
  const body = text('p', '', { id: 'tour-texte', class: 'tour__texte' });
  const skip = button({ class: 'bouton-lien', on: { click: () => finish() } }, [frenchSpacing('Passer')]);
  const previous = button({ class: 'bouton-secondaire', on: { click: () => go(index - 1) } }, [
    frenchSpacing('Précédent'),
  ]);
  const next = button({ class: 'bouton tour__suivant', on: { click: () => advance() } });
  const never = button({ class: 'bouton-lien bouton-lien--pale', on: { click: () => disable() } }, [
    frenchSpacing('Ne plus afficher'),
  ]);
  const arrow = div({ class: 'tour__fleche', 'aria-hidden': 'true' });
  const veil = div({ class: 'tour__voile', 'aria-hidden': 'true' });
  const bubble = div({ class: 'tour__bulle' }, [
    arrow,
    counter,
    title,
    body,
    div({ class: 'tour__actions' }, [skip, previous, next]),
    div({ class: 'tour__pied' }, [never]),
  ]);
  const node = document.createElement('dialog');
  node.className = 'tour';
  node.setAttribute('aria-labelledby', 'tour-titre');
  node.setAttribute('aria-describedby', 'tour-texte');
  node.append(veil, bubble);

  function place() {
    frame = 0;
    const hole = union(targets()[index]());
    if (hole === null) {
      return;
    }
    hole.left -= HOLE_MARGIN;
    hole.top -= HOLE_MARGIN;
    hole.right += HOLE_MARGIN;
    hole.bottom += HOLE_MARGIN;

    veil.style.left = `${hole.left}px`;
    veil.style.top = `${hole.top}px`;
    veil.style.width = `${hole.right - hole.left}px`;
    veil.style.height = `${hole.bottom - hole.top}px`;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const limitBottom = height - bottomInset();
    bubble.style.maxHeight = '';
    bubble.style.overflowY = '';
    const bubbleWidth = bubble.offsetWidth;
    const bubbleHeight = bubble.offsetHeight;

    const room = {
      above: hole.top - EDGE,
      below: limitBottom - hole.bottom - EDGE,
      left: hole.left - EDGE,
      right: width - hole.right - EDGE,
    };
    const need = {
      above: bubbleHeight + GAP,
      below: bubbleHeight + GAP,
      left: bubbleWidth + GAP,
      right: bubbleWidth + GAP,
    };

    let order = steps[index].sides;
    if (isNarrow()) {
      order = room.below >= room.above ? ['below', 'above'] : ['above', 'below'];
      const preferred = steps[index].sides.find(side => side === 'above' || side === 'below');
      if (room[preferred] >= need[preferred]) {
        order = [preferred, ...order.filter(side => side !== preferred)];
      }
    }
    let side = order.find(candidate => room[candidate] >= need[candidate]);
    let squeezed = false;
    if (side === undefined) {
      side = [...order].sort((a, b) => room[b] / need[b] - room[a] / need[a])[0];
      squeezed = true;
    }

    let top;
    let left;
    if (side === 'above' || side === 'below') {
      if (squeezed) {
        bubble.style.maxHeight = `${Math.max(120, room[side] - GAP)}px`;
        bubble.style.overflowY = 'auto';
      }
      const usedHeight = bubble.offsetHeight;
      top = side === 'above' ? hole.top - GAP - usedHeight : hole.bottom + GAP;
      left = clamp((hole.left + hole.right) / 2 - bubbleWidth / 2, EDGE, width - bubbleWidth - EDGE);
    } else {
      top = clamp((hole.top + hole.bottom) / 2 - bubbleHeight / 2, EDGE, limitBottom - bubbleHeight - EDGE);
      left = side === 'left' ? hole.left - GAP - bubbleWidth : hole.right + GAP;
    }
    bubble.style.left = `${left}px`;
    bubble.style.top = `${top}px`;
    bubble.dataset.side = side;

    const usedHeight = bubble.offsetHeight;
    if (side === 'above' || side === 'below') {
      const offset = clamp((hole.left + hole.right) / 2 - left, EDGE, bubbleWidth - EDGE);
      arrow.style.left = `${offset - ARROW / 2}px`;
      arrow.style.top = '';
    } else {
      const offset = clamp((hole.top + hole.bottom) / 2 - top, EDGE, usedHeight - EDGE);
      arrow.style.top = `${offset - ARROW / 2}px`;
      arrow.style.left = '';
    }
  }

  function schedule() {
    if (frame === 0) {
      frame = requestAnimationFrame(place);
    }
  }

  function render(options = {}) {
    const step = steps[index];
    counter.textContent = `${index + 1} / ${TOTAL}`;
    title.textContent = frenchSpacing(step.title);
    body.textContent = frenchSpacing(step.body);
    next.textContent = frenchSpacing(index === TOTAL - 1 ? "C'est parti" : 'Suivant');
    previous.hidden = index === 0;

    const elements = targets()[index]();
    if (elements.length > 0) {
      elements[0].scrollIntoView({
        block: 'center',
        inline: 'center',
        behavior: prefersReducedMotion() ? 'instant' : 'smooth',
      });
    }

    if (options.initial) {
      veil.style.transition = 'none';
    }
    place();
    if (options.initial) {
      void veil.offsetWidth;
      veil.style.transition = '';
    } else if (!prefersReducedMotion()) {
      bubble.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_MS });
    }

    if (!node.contains(document.activeElement) || (document.activeElement === previous && previous.hidden)) {
      next.focus();
    }
  }

  function go(target) {
    if (target < 0 || target >= TOTAL) {
      return;
    }
    index = target;
    render();
  }

  function advance() {
    if (index === TOTAL - 1) {
      finish();
      return;
    }
    go(index + 1);
  }

  function disable() {
    onDisable();
    finish();
  }

  function release() {
    if (!active) {
      return false;
    }
    active = false;
    window.removeEventListener('resize', schedule);
    window.removeEventListener('scroll', schedule, true);
    window.removeEventListener('hashchange', finish);
    if (frame !== 0) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    return true;
  }

  function finish() {
    if (node.open) {
      node.close();
    }
    if (release()) {
      onClose();
    }
  }

  function onKey(event) {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      advance();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(index - 1);
    }
  }

  node.addEventListener('keydown', onKey);
  node.addEventListener('close', () => {
    if (release()) {
      onClose();
    }
  });

  function open() {
    if (node.open) {
      return;
    }
    index = 0;
    active = true;
    node.showModal();
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('hashchange', finish);
    render({ initial: true });
    next.focus();
  }

  return { node, open, isOpen: () => node.open };
}
