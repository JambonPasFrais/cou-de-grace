import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { collect } from './runner.js';

const files = process.argv.slice(2);
if (files.length === 0) {
  await import('./suites.js');
} else {
  for (const file of files) {
    await import(pathToFileURL(resolve(file)).href);
  }
}

const { passed, failed, suites } = collect();

for (const suite of suites) {
  for (const { name, ok, message } of suite.results) {
    if (!ok) {
      console.error(`❌ ${suite.name} › ${name} — ${message}`);
    }
  }
}

console.log(`${passed} réussis, ${failed} échec(s), ${passed + failed} tests.`);
process.exit(failed === 0 ? 0 : 1);
