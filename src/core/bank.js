const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ID_MAX_LENGTH = 24;

function isFilledString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isFilledList(value) {
  return Array.isArray(value) && value.length > 0 && value.every(isFilledString);
}

export function validateBank(jokes) {
  const errors = [];
  const seen = new Set();

  jokes.forEach((joke, index) => {
    const label = joke && isFilledString(joke.id) ? joke.id : `#${index + 1}`;
    const fail = (message) => errors.push(`${label} : ${message}`);

    if (!joke || typeof joke !== 'object') {
      fail('la blague est absente ou n’est pas un objet.');
      return;
    }

    if (typeof joke.id !== 'string' || !ID_PATTERN.test(joke.id)) {
      fail('l’identifiant doit être en kebab-case (minuscules, chiffres, tirets).');
    } else {
      if (joke.id.length > ID_MAX_LENGTH) {
        fail(`l’identifiant dépasse ${ID_MAX_LENGTH} caractères.`);
      }
      if (seen.has(joke.id)) {
        fail('l’identifiant est en double.');
      }
      seen.add(joke.id);
    }

    if (!isFilledList(joke.setup)) {
      fail('le setup doit être un tableau non vide de chaînes non vides.');
    }

    if (!isFilledList(joke.punchline)) {
      fail('la punchline doit être un tableau non vide de chaînes non vides.');
    }

    if (typeof joke.trash !== 'boolean') {
      fail('trash doit être un booléen.');
    }

    if (!joke.source || typeof joke.source !== 'object') {
      fail('la source est absente.');
    } else {
      if (!isFilledString(joke.source.name)) {
        fail('source.name doit être une chaîne non vide.');
      }
      if (joke.source.url !== undefined && !(typeof joke.source.url === 'string' && joke.source.url.startsWith('https://'))) {
        fail('source.url doit commencer par https://.');
      }
    }
  });

  return errors;
}

export function allowedJokes(bank, trash) {
  return trash ? [...bank] : bank.filter((joke) => joke.trash === false);
}
