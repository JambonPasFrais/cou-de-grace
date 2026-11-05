import { readState, writeState } from '../core/storage.js';
import { defaultState } from '../core/reserve.js';

const PROBE_KEY = 'coudegrace:test';

let available = true;
const listeners = new Set();

function markUnavailable() {
  if (!available) {
    return;
  }
  available = false;
  listeners.forEach(listener => listener());
}

export function isStorageAvailable() {
  return available;
}

export function onStorageUnavailable(listener) {
  listeners.add(listener);
  if (!available) {
    listener();
  }
}

export function probeStorage() {
  try {
    window.localStorage.setItem(PROBE_KEY, '1');
    window.localStorage.removeItem(PROBE_KEY);
  } catch {
    markUnavailable();
  }
  return available;
}

export function loadState(knownIds) {
  try {
    return readState(window.localStorage, knownIds);
  } catch {
    markUnavailable();
    return defaultState();
  }
}

export function saveState(state) {
  try {
    writeState(window.localStorage, state);
    return true;
  } catch {
    markUnavailable();
    return false;
  }
}
