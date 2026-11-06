import { defaultState } from './reserve.js';

export const STORAGE_KEY = 'coudegrace:v1';

export function parseState(raw, knownIds) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return defaultState();
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return defaultState();
  }
  if (data.v !== 1 || !Array.isArray(data.seen)) {
    return defaultState();
  }
  const known = new Set(knownIds);
  const seen = [];
  for (const id of data.seen) {
    if (typeof id === 'string' && known.has(id) && !seen.includes(id)) {
      seen.push(id);
    }
  }
  return { seen, trash: data.trash === true, tutorial: data.tutorial !== false };
}

export function serializeState(state) {
  if (state.seen.length === 0 && state.trash !== true && state.tutorial !== false) {
    return null;
  }
  return JSON.stringify({ v: 1, seen: state.seen, trash: state.trash, tutorial: state.tutorial !== false });
}

export function readState(storage, knownIds) {
  return parseState(storage.getItem(STORAGE_KEY), knownIds);
}

export function writeState(storage, state) {
  const serialized = serializeState(state);
  if (serialized === null) {
    storage.removeItem(STORAGE_KEY);
  } else {
    storage.setItem(STORAGE_KEY, serialized);
  }
}
