export const EXHAUSTION_MESSAGES = [
  'Vous avez épuisé votre réserve de sang.',
  'Plus une goutte. Vos collègues sont achevés, et vous aussi.',
  'Votre banque du sang est à découvert.',
  'Le cercueil est vide : toutes les blagues sont sorties.',
  'Anémie sévère : vous avez tout bu.',
  'Le jour se lève, et il ne reste plus une seule blague.',
  'Vous êtes à sec. Revenez à la nuit tombée, de nouvelles victimes arrivent.',
];

export function pickExhaustion(previousIndex, rng) {
  const count = EXHAUSTION_MESSAGES.length;
  const excluded = Number.isInteger(previousIndex) && previousIndex >= 0 && previousIndex < count;
  const choices = excluded ? count - 1 : count;
  const index = Math.min(choices - 1, Math.floor(rng() * choices));
  return excluded && index >= previousIndex ? index + 1 : index;
}
