export function defaultState() {
  return { seen: [], trash: false };
}

export function drawJoke(allowed, seen, rng) {
  const seenIds = new Set(seen);
  const remaining = allowed.filter((joke) => !seenIds.has(joke.id));
  if (remaining.length === 0) {
    return null;
  }
  const index = Math.min(remaining.length - 1, Math.floor(rng() * remaining.length));
  return remaining[index];
}

export function reveal(state, id) {
  if (state.seen.includes(id)) {
    return { seen: [...state.seen], trash: state.trash };
  }
  return { seen: [...state.seen, id], trash: state.trash };
}

export function gauge(allowed, seen) {
  const seenIds = new Set(seen);
  const left = allowed.filter((joke) => !seenIds.has(joke.id)).length;
  return { left, total: allowed.length };
}

export function trashLeft(bank, seen) {
  const seenIds = new Set(seen);
  return bank.filter((joke) => joke.trash === true && !seenIds.has(joke.id)).length;
}

export function setTrash(state, on) {
  return { seen: [...state.seen], trash: on };
}

export function transfuse() {
  return defaultState();
}
