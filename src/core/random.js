export function shuffle(items, rng) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(rng() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }

  return shuffled;
}

export function pickWithoutRepeat(items, count, rng) {
  const size = Math.max(0, Math.min(Math.trunc(count), items.length));
  return shuffle(items, rng).slice(0, size);
}

export function pickWeighted(items, count, weightOf, rng) {
  const size = Math.max(0, Math.min(Math.trunc(count), items.length));
  const pool = items.map((item) => ({ item, weight: Math.max(0, weightOf(item)) }));
  const picked = [];

  while (picked.length < size) {
    const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
    let index = pool.length - 1;
    if (total > 0) {
      let threshold = rng() * total;
      index = pool.findIndex((entry) => {
        threshold -= entry.weight;
        return threshold < 0;
      });
      if (index === -1) {
        index = pool.length - 1;
      }
    } else {
      index = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
    }
    picked.push(pool[index].item);
    pool.splice(index, 1);
  }

  return picked;
}
