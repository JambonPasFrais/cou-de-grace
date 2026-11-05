import { div, text } from './dom.js';
import { svg } from './svg.js';
import { frenchSpacing } from '../core/typography.js';

const BODY_Y = 14;
const BODY_HEIGHT = 320;
const EMPTY_FLOOR = 2;
const DROP_MS = 400;
const RISE_MS = 700;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function graduations() {
  return Array.from({ length: 10 }, (_, index) =>
    svg('line', { class: 'jauge__graduation', x1: 100, x2: 108, y1: 30 + index * 30, y2: 30 + index * 30 }),
  );
}

export function createEmptyPouch() {
  return svg('svg', { class: 'poche-vide', viewBox: '0 0 120 380', 'aria-hidden': 'true', focusable: 'false' }, [
    svg('defs', {}, [
      svg('clipPath', { id: 'poche-vide-clip' }, [
        svg('rect', { x: 20, y: BODY_Y, width: 80, height: BODY_HEIGHT, rx: 14 }),
      ]),
    ]),
    svg('rect', { class: 'jauge__vide', x: 20, y: BODY_Y, width: 80, height: BODY_HEIGHT, rx: 14 }),
    svg('g', { 'clip-path': 'url(#poche-vide-clip)' }, [
      svg('rect', { class: 'jauge__sang', x: 20, y: BODY_Y + BODY_HEIGHT - EMPTY_FLOOR, width: 80, height: EMPTY_FLOOR }),
    ]),
    svg('rect', { class: 'jauge__contour', x: 20, y: BODY_Y, width: 80, height: BODY_HEIGHT, rx: 14 }),
    svg('rect', { class: 'jauge__contour', x: 48, y: 2, width: 24, height: 12, rx: 6 }),
    svg('path', { class: 'jauge__contour', d: 'M60 334 V362' }),
    ...graduations(),
  ]);
}

export function createGauge() {
  const blood = svg('rect', { class: 'jauge__sang', x: 20, y: BODY_Y, width: 80, height: BODY_HEIGHT });
  const drop = svg('circle', { class: 'jauge__goutte', cx: 60, cy: 346, r: 5 });
  const count = svg('text', { class: 'jauge__nombre', x: 60, y: 176, 'text-anchor': 'middle' });

  const pouch = svg('svg', { class: 'jauge__poche', viewBox: '0 0 120 380', 'aria-hidden': 'true', focusable: 'false' }, [
    svg('defs', {}, [
      svg('clipPath', { id: 'jauge-poche-clip' }, [
        svg('rect', { x: 20, y: BODY_Y, width: 80, height: BODY_HEIGHT, rx: 14 }),
      ]),
    ]),
    svg('rect', { class: 'jauge__vide', x: 20, y: BODY_Y, width: 80, height: BODY_HEIGHT, rx: 14 }),
    svg('g', { 'clip-path': 'url(#jauge-poche-clip)' }, [blood]),
    svg('rect', { class: 'jauge__contour', x: 20, y: BODY_Y, width: 80, height: BODY_HEIGHT, rx: 14 }),
    svg('rect', { class: 'jauge__contour', x: 48, y: 2, width: 24, height: 12, rx: 6 }),
    svg('path', { class: 'jauge__contour', d: 'M60 334 V362' }),
    ...graduations(),
    svg('rect', { class: 'jauge__etiquette', x: 26, y: 140, width: 68, height: 52, rx: 3 }),
    svg('text', { class: 'jauge__titre', x: 60, y: 158, 'text-anchor': 'middle' }, [frenchSpacing('RÉSERVE')]),
    count,
    drop,
  ]);

  const label = text('span', '', { class: 'jauge__texte' });
  const level = div({ class: 'jauge__niveau' });
  const flat = div({ class: 'jauge__horizontale', 'aria-hidden': 'true' }, [
    label,
    div({ class: 'jauge__piste' }, [level]),
  ]);

  const node = div({ class: 'jauge', role: 'meter', 'aria-valuemin': 0 }, [pouch, flat]);

  const update = ({ left, total }, { drop: dropping = false, rise = false } = {}) => {
    const ratio = total === 0 ? 0 : left / total;
    const offset = left === 0 ? BODY_HEIGHT - EMPTY_FLOOR : (1 - ratio) * BODY_HEIGHT;
    blood.style.transform = `translateY(${offset}px)`;
    level.style.width = `${ratio * 100}%`;
    count.textContent = `${left} / ${total}`;
    label.textContent = `Réserve · ${left} / ${total}`;
    node.setAttribute('aria-valuenow', left);
    node.setAttribute('aria-valuemax', total);
    node.setAttribute('aria-label', `Réserve de blagues : ${left} sur ${total}`);

    if (rise && !prefersReducedMotion()) {
      node.classList.add('jauge--remplissage');
      setTimeout(() => node.classList.remove('jauge--remplissage'), RISE_MS);
    }

    if (dropping && !prefersReducedMotion()) {
      drop.animate(
        [
          { opacity: 1, transform: 'translateY(0)' },
          { opacity: 1, transform: 'translateY(0)', offset: 0.15 },
          { opacity: 0, transform: 'translateY(26px)' },
        ],
        { duration: DROP_MS, easing: 'ease-in' },
      );
    }
  };

  return { node, update };
}
