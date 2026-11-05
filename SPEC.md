# Le cou de grâce — spécifications v1

Brouillon du 30/10/2026, accepté par Armand le 04/11/2026 sans relecture
détaillée. Les propositions §12 a à e s'appliquent par défaut. Va avec
[`DA.md`](./DA.md) et [`PLAN.md`](./PLAN.md).

## 1. But

Achever ses collègues, de gêne ou de rire, avec une blague de vampire à la
demande.

- Le site pioche dans une banque de blagues choisies une par une.
- Il ne ressert jamais une blague déjà vue dans ce navigateur, sans compte.
- Quand la réserve est vide, il le dit, avec une variante différente à chaque
  fois.
- Le dépôt est open source : la banque grandit grâce aux contributions.

## 2. La banque de blagues

- **Au lancement : 44 blagues**, dont 4 trash, validées une par une par Armand le
  05/11/2026. Elles viennent des sites les mieux notés (Bored Panda, Upjoke,
  sites français notés), réécrites en français avec nos mots en gardant une
  chute qui se comprend tout de suite. S'y ajoutent des calembours français et
  quelques créations originales.
- Celles déjà testées sur les collègues et validées en font partie d'office : la
  chauve-souris (« Eh ben moi, je l'avais pas vu ») et Franck (« T'es censé leur
  donner des bonbons »).
- Une seule source de vérité : `src/data/jokes.js`. Contrairement à geo-train,
  ce fichier s'édite **à la main**, puisque c'est là qu'arrivent les
  contributions.

Format d'une blague :

```js
{
  id: "chauve-souris",
  setup: [
    "Une chauve-souris vampire rentre à la grotte, le museau couvert de sang.",
    "— Où est-ce que t'as trouvé tout ce sang ?!"
  ],
  punchline: ["— Eh ben moi, je l'avais pas vu."],
  trash: false,
  source: { name: "Phortail", url: "https://phortail.org/blagues/animaux-0921.html" }
}
```

| Champ | Règle |
|---|---|
| `id` | kebab-case, 24 caractères au plus, unique. **Jamais renommé ni réutilisé** : c'est lui qui est stocké, et le renommer fait revenir la blague chez ceux qui l'ont déjà vue. |
| `setup` | un paragraphe ou plus, rien de vide. Une ligne de dialogue par paragraphe. |
| `punchline` | un paragraphe ou plus, rien de vide. Il reste caché jusqu'à ce qu'on le révèle. |
| `trash` | booléen. `true` pour une blague vulgaire, scatologique, grivoise ou gore. |
| `source` | `name` est obligatoire. `url` est en `https`, et peut être omis pour une création originale (`name: "Création originale"`). |

## 3. Déroulé

### Une blague

1. L'écran affiche l'**amorce**.
2. Un bouton, la barre d'espace ou Entrée révèle la **chute**.
3. La même action passe ensuite à la blague suivante.

On peut tout faire au clavier : c'est surtout sur ordinateur que le site sert.

- Une blague compte comme **vue au moment où sa chute est révélée**, pas quand
  l'amorce s'affiche. Recharger la page avant la chute ne consomme pas la
  blague.
- Au chargement, une blague est tirée parmi celles qui n'ont pas été vues. La
  blague en cours n'est pas gardée en mémoire.

### Tirage

- Le tirage se fait **au hasard, sans remise**, parmi les blagues non vues et
  autorisées par l'interrupteur (§4).
- Aucune blague ne revient tant qu'il en reste une non vue.
- L'aléa est injecté en paramètre, comme dans geo-train.

### La jauge « Réserve de sang »

Elle affiche le nombre de blagues encore disponibles sur le total autorisé, par
exemple « 27 / 34 ». Sa forme visuelle est décrite dans la DA.

### Épuisement

Quand il ne reste plus aucune blague autorisée non vue, l'écran d'épuisement
remplace la blague :

- Un message tiré parmi **6 à 8 variantes**, jamais deux fois de suite le même
  pendant la visite. Premières propositions, à finaliser dans la DA :
  1. « Vous avez épuisé votre réserve de sang. »
  2. « Plus une goutte. Vos collègues sont achevés, et vous aussi. »
  3. « Votre banque du sang est à découvert. »
  4. « Le cercueil est vide : toutes les blagues sont sorties. »
  5. « Anémie sévère : vous avez tout bu. »
  6. « Le jour se lève, et il ne reste plus une seule blague. »
  7. « Vous êtes à sec. Revenez à la nuit tombée, de nouvelles victimes
     arrivent. »
- Si l'interrupteur est coupé et qu'il reste des blagues trash non vues, une
  ligne l'indique : « Il reste 4 blagues pour les estomacs solides », avec
  l'interrupteur à portée de main.
- Le bouton **« Transfusion »** remet la réserve à plein (§5).
- Le lien **« Proposer une blague »** mène à la contribution (§7).
- Les blagues ajoutées à la banque après l'épuisement deviennent disponibles
  dès la visite suivante, sans rien faire.

## 4. L'interrupteur « blagues trash »

- Il est **désactivé par défaut**. Son libellé prévient du registre (humour
  vulgaire, à éviter en réunion client).
- Activé, les blagues `trash: true` entrent dans le tirage et dans le total de
  la jauge.
- Désactivé, elles en sortent. Celles déjà vues restent comptées comme vues.

## 5. Stockage

Le stockage se fait dans le `localStorage` du navigateur, et il est réduit au
strict minimum.

- **Origine partagée** : geo-train et pkmon-training sont servis eux aussi
  depuis `jambonpasfrais.github.io`. Il n'y a donc qu'**une seule clé**,
  `coudegrace:v1`, et `localStorage.clear()` est interdit.
- **Contenu** : les identifiants des blagues vues et l'état de l'interrupteur.
  Rien d'autre : ni date, ni ordre de passage, ni texte de blague, ni compteur
  (il se calcule).

  ```json
  { "v": 1, "seen": ["chauve-souris", "franck"], "trash": false }
  ```

- **Taille bornée** : au chargement, les identifiants qui ne sont plus dans la
  banque sont retirés. La clé ne dépasse donc jamais la taille de la banque :
  environ 1 Ko pour 40 blagues, 25 Ko pour 1 000, pour un quota d'environ 5 Mo.
- **Peu d'accès** : la clé est lue une fois au démarrage. Elle n'est écrite que
  lorsque quelque chose change : une chute révélée, l'interrupteur, une
  transfusion.
- **État par défaut** (aucune blague vue, interrupteur coupé) : la clé est
  supprimée plutôt qu'écrite.
- **Transfusion** : le bouton est toujours accessible en pied de page, et aussi
  sur l'écran d'épuisement. Après confirmation, il fait
  `localStorage.removeItem("coudegrace:v1")`. Seule cette clé disparaît :
  geo-train et pkmon-training gardent leur progression.
- **Données illisibles** (JSON invalide, version inconnue) : le site démarre
  avec un état vide, sans planter.
- **Stockage indisponible** (navigation privée, stockage bloqué) : le site
  fonctionne, mais l'historique ne survit pas au rechargement. Un bandeau
  discret le signale.
- L'historique est propre à chaque navigateur : rien n'est synchronisé entre
  deux ordinateurs.

## 6. Écrans et routes

| Route | Contenu |
|---|---|
| `#/` | la blague en cours, ou l'écran d'épuisement ; la jauge ; l'interrupteur ; en pied de page « Transfusion », « Proposer une blague », « À propos » |
| `#/a-propos` | le pitch, comment contribuer, les licences, les sources créditées |

- La conception part de l'ordinateur (1280 à 1920 px de large). Le site reste
  lisible et utilisable jusqu'à 360 px.
- Textes d'interface en français, au **vouvoiement**.

## 7. Contribution

Il y a deux façons de proposer une blague :

1. **Le formulaire** : le lien « Proposer une blague » ouvre un formulaire
   d'issue GitHub (`.github/ISSUE_TEMPLATE/blague.yml`), avec les champs amorce,
   chute, trash oui ou non, et source. Il est pensé pour les non-développeurs,
   mais GitHub demande un compte pour ouvrir une issue.
2. **La pull request** : on ajoute une entrée dans `src/data/jokes.js` en
   suivant `CONTRIBUTING.md`.

Dans les deux cas :

- Armand relit chaque blague et décide de l'ajouter. Rien n'entre sans
  validation.
- Une GitHub Action (`.github/workflows/tests.yml`) lance `node tests/run.mjs`
  sur chaque PR, pour vérifier le format, l'unicité des identifiants et les
  champs obligatoires. Le déploiement reste sans Action : GitHub Pages sert la
  racine de `main`.
- **Charte** :
  - une blague de vampire, de Dracula ou de chauve-souris vampire, en français,
    avec une chute ;
  - aucune blague qui vise un groupe de personnes (origine, religion, genre,
    orientation, handicap), même avec l'interrupteur trash ;
  - réécrire la blague avec ses mots et citer la source, sans copier-coller un
    livre ou un spectacle.

## 8. Licences

- Le code est sous **MIT** (`LICENSE`).
- La banque de blagues (`src/data/jokes.js`) est sous **CC BY 4.0**
  (`LICENSE-JOKES`) : chacun peut la reprendre en citant le projet.
- Les sources d'origine sont créditées blague par blague (champ `source`) et sur
  `#/a-propos`.

## 9. Technique

On reprend les règles de geo-train :

- HTML, CSS et JavaScript en modules ES natifs. Aucune dépendance, aucun build,
  aucun npm.
- **Cœur pur, coquille impérative** :
  - `src/core/` contient les règles (tirage, épuisement, validation de la
    banque, format stocké), sans DOM, sans `localStorage`, sans aléa implicite ;
  - `src/ui/` contient le rendu et les effets ;
  - `src/data/jokes.js` contient la banque.
- `src/core/storage.js` est le seul module qui connaît le format stocké.
- Modules à copier depuis geo-train puis adapter, sans partage de code :
  `dom.js`, `router.js`, `random.js`, `tests/runner.js`, `tests/run.mjs`,
  `tests/suites.js`, `tools/screenshot.mjs`.
- Exports nommés, jamais de `innerHTML`, aucun commentaire dans le code.
- Chemins relatifs, puisque le site est servi sous `/cou-de-grace/`.
- Déploiement : GitHub Pages sert la racine de `main`, avec un fichier
  `.nojekyll`.

## 10. Hors périmètre v1

| Sujet | Quand |
|---|---|
| Votes ou « j'aime » partagés entre visiteurs | non prévu : il faudrait un serveur |
| Synchronisation entre appareils, export de l'historique | v2, si le besoin apparaît |
| Mode projection pour lire en réunion | v2 |
| Lien vers une blague précise (`#/blague/franck`) | v2 |
| Blagues dans d'autres langues | non prévu |
| Comptes | non prévus |

## 11. Critères d'acceptation v1

**Automatiques** : `node tests/run.mjs` est vert, en local et dans la GitHub
Action. Les tests couvrent :

1. **Banque** :
   - identifiants uniques, en kebab-case, de 24 caractères au plus ;
   - amorce et chute non vides ;
   - `trash` booléen ;
   - `source.name` présent, et `url` en `https` quand il est fourni ;
   - au moins 30 blagues, dont au moins 25 non trash.
2. **Tirage** : à graine fixe, N révélations sur une banque de N blagues
   montrent chaque blague exactement une fois, puis mènent à l'épuisement.
3. **Interrupteur** : coupé, aucune blague trash n'est tirée. Activé, elles
   entrent dans le tirage et dans le total.
4. **Vue** : une blague n'est marquée vue qu'au moment où sa chute est révélée.
5. **Épuisement** :
   - au moins 6 variantes, jamais la même deux fois de suite ;
   - le nombre de blagues trash restantes annoncé est exact.
6. **Stockage** :
   - un JSON invalide ou une version inconnue donnent un état vide ;
   - les identifiants inconnus sont purgés ;
   - l'état par défaut supprime la clé ;
   - toute clé écrite commence par `coudegrace:` ;
   - la transfusion laisse intactes les clés `geotrain:` et pkmon d'un stockage
     factice.

**Manuels**, sur ordinateur (1440 px) et sur téléphone (390 px) :

1. Révéler la chute et enchaîner trois blagues avec la seule barre d'espace.
2. Après un rechargement, aucune blague déjà vue ne revient.
3. Épuiser la banque : un message d'épuisement s'affiche. Après une
   transfusion, la jauge est pleine. geo-train, ouvert dans le même navigateur,
   n'a rien perdu.
4. Le lien « Proposer une blague » ouvre le formulaire GitHub.
5. En navigation privée, le site fonctionne et affiche le bandeau.

## 12. Décisions

**Prises par Armand le 30/10/2026** :

- un site statique sur le modèle de geo-train, avec SPEC, DA et PLAN validés
  avant le code ;
- surtout sur ordinateur, dans le navigateur, avec une version responsive ;
- 30 à 40 blagues, parmi les mieux notées du web, validées une par une ;
- les blagues trash derrière un interrupteur désactivé par défaut ;
- le nom `cou-de-grace`, et le vouvoiement ;
- l'open source, avec une contribution par PR et par formulaire ;
- le code sous MIT et les blagues sous CC BY 4.0 ;
- un bouton qui remet la session à zéro et vide le stockage du site ;
- un stockage minimal, avec des identifiants courts.

**Proposées, à valider** :

- a. Une blague compte comme vue à la révélation de sa chute, pas à l'affichage
  de l'amorce (§3).
- b. Une seule action enchaîne révéler puis suivante, à la barre d'espace (§3).
- c. La charte de contenu (§7), qui interdit les blagues visant un groupe,
  trash compris.
- d. Le formulaire demande un compte GitHub au contributeur. Le « sans compte »
  vaut pour les lecteurs (§7).
- e. Deux routes seulement, `#/` et `#/a-propos` (§6).
