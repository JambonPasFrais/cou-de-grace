# Le cou de grâce

Site statique qui sert des blagues de vampire à la demande, pour achever ses
collègues de gêne ou de rire. Il ne ressert jamais une blague déjà vue dans le
navigateur, sans compte. Open source : la banque grandit par contributions.
Hébergé sur GitHub Pages, il reprend l'architecture de `geo-train`, du même
auteur.

Le contrat est dans trois fichiers, à lire avant toute modification :

| Fichier | Contenu |
|---|---|
| [`SPEC.md`](./SPEC.md) | format d'une blague, déroulé, stockage, contribution, critères d'acceptation |
| [`DA.md`](./DA.md) | direction artistique : couleurs mesurées, poche de sang, composants, textes |
| [`PLAN.md`](./PLAN.md) | étapes de la v1, avancement, vagues, commandes d'acceptation |

## Lancer et tester

```bash
python3 -m http.server 8000      # depuis la racine ; puis http://localhost:8000
node tests/run.mjs               # toutes les suites, code de sortie 1 si échec
node tests/run.mjs tests/x.test.js   # seulement les fichiers donnés
```

- Les suites sont aussi lisibles dans le navigateur, sur `http://localhost:8000/tests/`.
- Un serveur est obligatoire : les modules ES ne se chargent pas en `file://`.
- Il n'y a ni npm, ni `package.json`, ni build. Node ≥ 22.
- La GitHub Action `.github/workflows/tests.yml` lance les mêmes suites sur
  chaque PR.

Captures d'écran (Chrome sans interface, vrai mobile émulé) :

```bash
node tools/screenshot.mjs <url> <largeur> <fichier.png> [hauteur] [sombre] [reduit]
```

## Règles d'architecture

Découpage **cœur pur / coquille impérative**, comme geo-train :

- `src/core/` : les règles. Aucune référence au DOM, à `window`, au
  `localStorage` global, à une horloge ou à `Math.random()` implicite. L'aléa
  s'injecte en paramètre, et le stockage aussi (un objet `getItem` / `setItem` /
  `removeItem`). Tout y est testable sous Node.
- `src/ui/` : le rendu et les effets (DOM, vrai `localStorage`, clavier). Aucune
  règle métier.
- `src/data/jokes.js` : la banque. Contrairement à geo-train, ce fichier
  **s'édite à la main** : c'est là qu'arrivent les contributions.

Autres règles :

- **Aucun commentaire dans le code**, ni JSDoc. Le pourquoi va dans le message
  de commit.
- Aucune dépendance runtime, aucun framework, aucun bundler.
- Exports **nommés** uniquement.
- Jamais de `innerHTML` : tout passe par les helpers de `src/ui/dom.js`.
- Chemins **relatifs** partout : le site est servi sous `/cou-de-grace/`.
- Textes d'interface en français, au **vouvoiement** (DA §7).
- Stockage : une seule clé, `coudegrace:v1`, qui ne contient que les
  identifiants vus et l'interrupteur. Elle est purgée au chargement et supprimée
  quand elle revient à l'état par défaut. `localStorage.clear()` est interdit :
  l'origine `jambonpasfrais.github.io` est partagée avec geo-train et
  pkmon-training.
- Les couleurs passent par les jetons de `styles/base.css` (DA §2). Aucune
  valeur hexadécimale dans les autres feuilles.
- La typographie française (espaces fines avant `? ! : ;`, guillemets) est posée
  au rendu par `src/core/typography.js`. Les données gardent des espaces
  ordinaires.
- Un identifiant de blague n'est **jamais renommé ni réutilisé** : c'est lui qui
  est stocké.

## Carte des fichiers

| Chemin | Rôle |
|---|---|
| `index.html` | point d'entrée ; viewport `interactive-widget=resizes-content` |
| `src/main.js` | assemblage : associe les routes aux écrans |
| `src/ui/router.js`, `src/ui/dom.js` | routage par ancre, helpers DOM |
| `src/core/random.js` | mélange et tirage, avec aléa injecté |
| `src/core/bank.js` | validation de la banque, filtre trash |
| `src/core/typography.js` | typographie française au rendu |
| `src/core/reserve.js` | tirage sans remise, révélation, jauge, blagues trash restantes |
| `src/core/exhaustion.js` | messages d'épuisement, jamais deux fois de suite le même |
| `src/core/storage.js` | seul module qui connaît le format stocké |
| `src/data/jokes.js` | la banque de blagues (CC BY 4.0) |
| `styles/` | `base.css` (jetons, polices), puis une feuille par écran |
| `tests/` | `runner.js` (`collect`, `run`), `suites.js` (seule liste des suites), `run.mjs` (Node) |
| `tools/` | `screenshot.mjs` ; jamais chargé par l'app |
| `.github/` | formulaire « Proposer une blague », modèle de PR, Action de tests |

Les modules à venir sont listés par étape dans `PLAN.md`.

## Git

- Le code se fait sur `feature/v1`, puis est fusionné dans `main` par une PR
  GitHub.
- On ne commite jamais sur `main` : le hook `git-guard` le refuse.
- Chaque push est validé par Armand.
- Identité git locale : l'adresse noreply GitHub, jamais l'e-mail Idéine.
- Déploiement : GitHub Pages sert la racine de `main`, sans GitHub Action. Le
  fichier `.nojekyll` désactive Jekyll.
