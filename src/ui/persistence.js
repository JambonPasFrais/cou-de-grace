import { defaultState } from '../core/reserve.js';
import { parseState, serializeState, STORAGE_KEY, writeState } from '../core/storage.js';

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

let shared = defaultState();

export function initState(knownIds) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    shared = parseState(raw, knownIds);
    if (serializeState(shared) !== raw) {
      writeState(window.localStorage, shared);
    }
  } catch {
    markUnavailable();
    shared = defaultState();
  }
  return shared;
}

export function getState() {
  return shared;
}

export function saveState(state) {
  shared = state;
  try {
    writeState(window.localStorage, state);
    return true;
  } catch {
    markUnavailable();
    return false;
  }
}
