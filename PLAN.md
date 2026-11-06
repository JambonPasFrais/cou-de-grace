# Le cou de grâce — plan d'implémentation v1

Statut : **validé** par Armand le 05/11/2026. Contrat :
[`SPEC.md`](./SPEC.md), accepté le 04/11/2026 sans relecture détaillée, avec
les propositions §12 a à e appliquées par défaut ; et [`DA.md`](./DA.md),
validée le 05/11/2026.

## Avancement

| Étape | État |
|---|---|
| 1 | faite le 05/11/2026, commit `c6fadb9` : 11 tests verts, serveur en `200`, captures claire et sombre conformes ; `tests/index.html` garde les couleurs en dur de geo-train, comme outil de développement |
| 2 | faite le 05/11/2026, commit `93ce42f` ; CLAUDE.md, README.md et CONTRIBUTING.md à relire par Armand |
| 3 | faite les 04 et 05/11/2026 : trois collectes (environ 100 candidates), puis des calembours français et des créations originales, faute de stock suffisant |
| 4 | faite le 05/11/2026 : 44 blagues validées une par une par Armand (40 + 4 trash) dans `src/data/jokes.js`, format contrôlé sous Node, commit `1adb9c6` |
| 5 | faite le 05/11/2026, commit `3955c55` |
| 6 | faite le 05/11/2026, commit `fb50d9d` : 58 tests verts au total |
| 9 | faite le 05/11/2026, commit `09a9f78` ; le label `blague` est à créer par Armand sur GitHub |
| 7 | faite le 05/11/2026, commit `e58c62c` : smoke vert (trois révélations à la barre d'espace, aucune redite après rechargement) ; vide entre la carte et le bouton corrigé à l'étape 8 |
| 8 | faite le 05/11/2026, commit `07b48e7` : smoke de 29 contrôles verts (épuisement, ligne trash, transfusion qui laisse `geotrain:v1` intact, À propos, longue blague sans défilement à 1280 × 720, sans animation) ; bandeau de stockage non vérifié en rendu |
| 11 | contrôle du verifier le 05/11/2026 : 1 bloquant (Entrée sur l'épuisement transfusait sans confirmation), 1 important (`aria-live` recréé à chaque rendu) et 10 mineurs. Tous corrigés (commits `b1d2d00` et `53097f5`), smoke de 37 contrôles verts |
| 12 | faite le 06/11/2026, commit `35ed1eb` : 67 tests, smoke étendu aux 4 étapes à 1440 et 390 px |
| 13 | contrôle du verifier le 06/11/2026 : aucun bloquant, 1 important (focus rendu en retard à la fermeture d'une visite relancée) et 8 mineurs, corrigés ou notés dans la SPEC et la DA ; smoke de 74 contrôles verts |
| 10 | PR #1 ouverte le 05/11/2026, Action verte. Site publié le 05/11/2026 sur GitHub Pages depuis `feature/v1` (https://jambonpasfrais.github.io/cou-de-grace/) : smoke en ligne de 37 contrôles verts, après le correctif du focus après transfusion (`948ed30`). Restent les scénarios manuels d'Armand, puis la bascule de Pages sur `main` après la fusion |

## Branches, commits, push

- `feature/v1-specs` contient SPEC.md, DA.md et ce plan. Elle est fusionnée dans
  `main` par une PR GitHub une fois le plan validé.
- Le code se fait ensuite sur `feature/v1`, créée depuis `feature/v1-specs` :
  - un commit par étape, une fois son critère d'acceptation atteint ;
  - chaque push est soumis à la validation d'Armand ;
  - fusion dans `main` par une PR GitHub en fin de plan.
- Aucun commit directement sur `main` : le hook `git-guard` le refuse.
- Identité git locale : l'adresse noreply GitHub, comme geo-train.

## Commandes d'acceptation communes

| Quoi | Commande | Attendu |
|---|---|---|
| Tests | `node tests/run.mjs` | code de sortie 0, « 0 échec » |
| Serveur local | `python3 -m http.server 8000`, puis `curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/` | `200` |
| Parcours | `node tools/smoke.mjs http://localhost:8000/` | code de sortie 0 |
| Captures | `node tools/screenshot.mjs <url> <largeur> <fichier.png> [hauteur] [sombre] [reduit]` | PNG à 390 px et 1440 px, en clair et en sombre, relus face à DA.md |

## Étapes

Routes : `[H]` mechanic, `[S]` implementer, `[O]` architect, `[F]` session
principale. Le `verifier` contrôle en contexte neuf, sans avoir participé au
code.

| # | Étape | Route | Dépend de | Acceptation |
|---|---|---|---|---|
| 1 | **Base du dépôt.** Copier depuis geo-train puis adapter : `index.html`, `.nojekyll`, `.gitignore`, `src/ui/dom.js`, `src/ui/router.js`, `src/core/random.js`, `tests/runner.js`, `tests/run.mjs`, `tests/suites.js`, `tests/index.html`, `tools/screenshot.mjs`. Reporter les jetons de DA §2 dans `styles/base.css`. Ajouter `LICENSE` (MIT) et `LICENSE-JOKES` (CC BY 4.0) | [S] implementer | — | tests verts (suite d'essai) ; serveur local en `200` ; une capture de la page vide en clair et en sombre |
| 2 | **Documentation du dépôt** : `CLAUDE.md` (cœur pur et coquille, carte des fichiers, stockage, conventions reprises de geo-train), `README.md` (pitch, lancer, tester, licences) et `CONTRIBUTING.md` (format d'une blague, charte, règle des identifiants, typographie posée au rendu) | [F] session | 1 | relu par Armand |
| 3 | **Collecte** d'environ 60 blagues candidates sur le web, avec la preuve de popularité, la source et la tenue de la chute en français | [S] general-purpose | — | `/tmp/cou-de-grace/candidates.md` : chaque entrée a sa source et sa preuve de popularité, ou « aucune » |
| 4 | **Adaptation et sélection** : réécrire en français les meilleures candidates, les présenter à Armand par lots, puis écrire les 30 à 40 blagues retenues dans `src/data/jokes.js` | [F] session + Armand | 3, 5 | chaque blague validée par Armand ; tests de la banque verts |
| 5 | **Cœur banque et typographie** : `src/core/bank.js` (`validateBank`, `allowedJokes(bank, trash)`) et `src/core/typography.js` (espaces insécables fines, DA §4) | [S] implementer | 1 | tests de la banque (SPEC §11, point 1) et de la typographie verts ; une banque volontairement cassée (identifiant en double, chute vide, `url` en http) les fait échouer |
| 6 | **Cœur réserve et stockage** : `src/core/reserve.js` (tirage sans remise avec aléa injecté, révélation qui marque la blague vue, restantes, épuisement, blagues trash restantes, variante d'épuisement différente de la précédente) et `src/core/storage.js` (format `{ v, seen, trash }`, purge des identifiants inconnus, état par défaut → suppression de la clé, données illisibles → état vide) | [S] implementer | 1 | tests de SPEC §11, points 2 à 6, verts, y compris la transfusion sur un stockage factice qui contient aussi `geotrain:v1` |
| 7 | **Écran principal** : `src/main.js`, `src/ui/persistence.js` (lecture unique au démarrage, écriture à chaque changement, `removeItem`, détection du stockage indisponible), `src/ui/screens/joke.js` (amorce, chute, bouton « Achever » puis « Victime suivante », barre d'espace et Entrée), `src/ui/gauge.js` (poche de sang, DA §3), interrupteur trash. Une petite banque de démonstration sert tant que l'étape 4 n'est pas finie | [S] implementer | 5, 6 | `tools/smoke.mjs` révèle trois blagues à la seule barre d'espace, recharge la page et vérifie qu'aucune ne revient ; captures 390 et 1440 px, en clair et en sombre |
| 8 | **Épuisement, transfusion, à propos** : écran d'épuisement (variantes, blagues trash restantes), dialogue de transfusion, route `#/a-propos`, bandeau de stockage indisponible, `favicon.svg` et `apple-touch-icon.png`, version sans animation | [S] implementer | 7 | le smoke épuise la banque, vérifie le message, transfuse et retrouve la jauge pleine ; avec `prefers-reduced-motion`, aucune animation de mouvement ; captures |
| 9 | **Contribution sur GitHub** : `.github/ISSUE_TEMPLATE/blague.yml` (amorce, chute, trash, source), `.github/pull_request_template.md`, `.github/workflows/tests.yml` (Node 22, `node tests/run.mjs` sur chaque PR) | [S] implementer | 1 | `node tests/run.mjs` vert ; le formulaire et l'Action se contrôlent sur GitHub après le premier push (étape 10) |
| 10 | **Assemblage et essais** : les 5 scénarios manuels de SPEC §11, sur ordinateur et téléphone ; l'Action passe au vert sur la PR de `feature/v1` | [F] session + Armand | 4, 8, 9 | scénarios cochés par Armand |
| 11 | **Contrôle final** contre SPEC.md et DA.md : relit le diff, relance les tests et le smoke, compare les captures | verifier | 10 | rapport sans écart bloquant |
| 12 | **Tutoriel en visite guidée** (SPEC §3 « Le tutoriel », §5, §11 point 7 ; DA §2 `--voile`, §5, §6, §7, §9), ajouté le 06/11/2026 pour la v1 : champ `tutorial` dans le stockage, transfusion qui le garde, module `src/ui/tour.js`, lien « Revoir le tutoriel », texte « Vos données » d'À propos | [S] implementer | 11 | tests du stockage verts ; smoke étendu au tutoriel ; captures des 4 étapes à 1440 et 390 px |
| 13 | **Contrôle du tutoriel** contre SPEC et DA | verifier | 12 | rapport sans écart bloquant ; push sur `feature/v1` ensuite (accord d'Armand du 06/11/2026) |

## Parallélisme

Les étapes avancent par vagues. Celles d'une même vague tournent en parallèle,
directement dans le dépôt, chacune sur ses propres fichiers. La session
principale intègre et commite. Comme pour geo-train, on n'utilise pas de copie
isolée (`isolation: worktree`) : elle partirait de `main`, sans le travail de
`feature/v1`.

| Vague | Étapes |
|---|---|
| 1 | 1 (base du dépôt), 3 (collecte, déjà lancée) |
| 2 | 2, 5, 6, 9 |
| 3 | 4 (avec Armand), 7 |
| 4 | 8 |
| 5 | 10 |
| 6 | 11 |

- Les agents d'une même vague ne modifient pas `tests/suites.js`. Ils lancent
  leurs suites avec `node tests/run.mjs <fichiers de test>`, et la session
  principale les ajoute à `tests/suites.js` en intégrant.
- Contrat entre les étapes 5 et 6, fixé avant la vague 2 : une blague a la forme
  de SPEC §2 ; `allowedJokes(bank, trash)` rend un tableau de blagues ;
  `reserve.js` ne reçoit que ce tableau et l'ensemble `seen`.

## Risques

| Risque | Parade |
|---|---|
| Des blagues qui tombent à plat en français | étape 4 : environ 60 candidates pour 30 à 40 retenues, validation une par une par Armand, sources gardées pour comparer avec l'original |
| La barre d'espace fait défiler la page, ou déclenche deux fois l'action sur un bouton qui a le focus | `preventDefault` sur le raccourci global, qui ignore les touches venues d'un bouton, d'un lien ou de l'interrupteur (DA §9) ; vérifié par le smoke |
| Une contribution renomme un identifiant existant | case à cocher dans le modèle de PR (« aucun identifiant existant renommé ») et relecture d'Armand ; une liste figée des identifiants publiés, contrôlée par un test, reste possible si ça arrive |
| Un proposant sans compte GitHub | accepté (SPEC §12 d) : `CONTRIBUTING.md` donne aussi l'adresse de contact d'Armand, s'il la fournit |
| Origine partagée avec geo-train et pkmon-training | une seule clé, `removeItem` et jamais `clear()`, vérifié par un test sur un stockage factice |

## Ce que fait Armand

1. Valider DA.md et ce plan, puis le push de `feature/v1-specs` et la PR vers
   `main`.
2. Valider les blagues, lot par lot (étape 4).
3. Relire `CLAUDE.md`, `README.md` et `CONTRIBUTING.md` (étape 2).
4. Valider chaque push de `feature/v1`, et tester sur ordinateur et téléphone
   (étape 10).
5. Activer GitHub Pages en fin de plan : Settings → Pages → *Deploy from branch*
   → `main` / `/ (root)`.
