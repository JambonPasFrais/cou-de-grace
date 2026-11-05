# Le cou de grâce

Achevez vos collègues façon vampire, de gêne ou de rire.

Le site sert une blague de vampire à la demande : l'amorce d'abord, puis la
chute quand vous décidez d'achever. Il ne ressert jamais une blague déjà vue
dans votre navigateur, sans compte ni inscription. Quand la réserve de sang est
vide, il vous le dit. Les blagues trash restent derrière un interrupteur, coupé
par défaut.

## Lancer en local

```bash
python3 -m http.server 8000
```

Puis <http://localhost:8000>. Rien à installer : ni npm, ni build.

## Tests

```bash
node tests/run.mjs
```

Les mêmes suites sont visibles dans le navigateur sur <http://localhost:8000/tests/>.

## Proposer une blague

La banque grandit grâce à vous :

- sans écrire de code, avec le formulaire
  [« Proposer une blague »](https://github.com/JambonPasFrais/cou-de-grace/issues/new?template=blague.yml)
  (un compte GitHub est nécessaire) ;
- ou par une pull request sur `src/data/jokes.js`.

Le format, la charte et la marche à suivre sont dans
[`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Licences

- Le code est sous licence MIT ([`LICENSE`](./LICENSE)).
- La banque de blagues (`src/data/jokes.js`) est sous licence CC BY 4.0
  ([`LICENSE-JOKES`](./LICENSE-JOKES)). Vous pouvez la reprendre en citant
  « Le cou de grâce ».
- La source d'origine de chaque blague est créditée dans son champ `source`.

## Documentation

- [`SPEC.md`](./SPEC.md) : les règles du site.
- [`DA.md`](./DA.md) : la direction artistique.
- [`PLAN.md`](./PLAN.md) : le plan de la v1.
- [`CLAUDE.md`](./CLAUDE.md) : l'architecture et les conventions.

Armand DEFFRENNES
