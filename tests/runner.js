const registry = [];

let openSuite = null;

class AssertionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AssertionError';
  }
}

function format(value) {
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
}

export function describe(name, body) {
  openSuite = { name, tests: [] };
  registry.push(openSuite);
  body();
  openSuite = null;
}

export function test(name, body) {
  if (!openSuite) {
    throw new Error('test() doit être appelé à l’intérieur d’un describe().');
  }
  openSuite.tests.push({ name, body });
}

export function assert(condition, message = 'condition fausse') {
  if (!condition) {
    throw new AssertionError(message);
  }
}

export function assertEqual(actual, expected, message = 'valeurs différentes') {
  if (!Object.is(actual, expected)) {
    throw new AssertionError(`${message} — attendu ${format(expected)}, reçu ${format(actual)}`);
  }
}

export function assertDeepEqual(actual, expected, message = 'structures différentes') {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new AssertionError(`${message} — attendu ${right}, reçu ${left}`);
  }
}

export function assertThrows(body, message = 'une erreur était attendue') {
  try {
    body();
  } catch {
    return;
  }
  throw new AssertionError(message);
}

export function collect() {
  let passed = 0;
  let failed = 0;
  const suites = [];

  for (const suite of registry) {
    const results = [];

    for (const { name, body } of suite.tests) {
      try {
        body();
        passed += 1;
        results.push({ name, ok: true, message: '' });
      } catch (error) {
        failed += 1;
        results.push({ name, ok: false, message: error.message });
      }
    }

    suites.push({ name: suite.name, results });
  }

  return { passed, failed, suites };
}

export function run(root) {
  const { passed, failed, suites } = collect();
  const report = document.createDocumentFragment();

  for (const suite of suites) {
    const section = document.createElement('section');
    section.className = 'suite';

    const title = document.createElement('h2');
    title.textContent = suite.name;
    section.append(title);

    const list = document.createElement('ul');

    for (const { name, ok, message } of suite.results) {
      const item = document.createElement('li');
      item.className = ok ? 'pass' : 'fail';
      item.textContent = ok ? `✅ ${name}` : `❌ ${name} — ${message}`;
      list.append(item);
    }

    section.append(list);
    report.append(section);
  }

  const summary = document.createElement('p');
  summary.className = failed === 0 ? 'summary pass' : 'summary fail';
  summary.textContent =
    failed === 0
      ? `${passed} tests au vert.`
      : `${failed} échec(s) sur ${passed + failed} tests.`;

  root.replaceChildren(summary, report);
  return { passed, failed };
}
