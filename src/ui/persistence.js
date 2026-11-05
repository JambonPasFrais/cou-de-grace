import { readState, writeState } from '../core/storage.js';
import { defaultState } from '../core/reserve.js';

let available = true;

export function isStorageAvailable() {
  return available;
}

export function loadState(knownIds) {
  try {
    return readState(window.localStorage, knownIds);
  } catch {
    available = false;
    return defaultState();
  }
}

export function saveState(state) {
  try {
    writeState(window.localStorage, state);
    return true;
  } catch {
    available = false;
    return false;
  }
}
