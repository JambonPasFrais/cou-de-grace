# Le cou de grâce — direction artistique

Statut : **validée** par Armand le 05/11/2026. Va avec
[`SPEC.md`](./SPEC.md).

## 1. Concept : la banque du sang de Transylvanie

Un mélange de deux univers :

- **La crypte** : velours bordeaux, nuit noire, lueur de bougie, titres en
  capitales à fort contraste comme sur une affiche de film d'épouvante des
  années 1930.
- **La banque du sang** : la réserve de blagues est une **poche de transfusion**
  graduée, avec son étiquette. Chaque chute révélée la vide un peu, et le bouton
  « Transfusion » la remplit.

Le ton est celui d'un humour noir assumé, mais jamais méchant envers celui qui
lit : on achève les collègues, pas le lecteur.

Règle de couleur qui en découle :
- **rouge sang** = l'action, la blague, la réserve ;
- **or de bougie** = le focus et les petits détails (étiquette, filets
  d'ornement) ;
- tout le reste est en velours et parchemin, sans information.

## 2. Couleurs

Jetons CSS déclarés avec `light-dark()`, comme dans geo-train. Le thème suit
celui du système. Il n'y a pas de bouton de thème : il faudrait stocker un
choix de plus (SPEC §5).

- Le **thème sombre** est la crypte, la version de référence.
- Le **thème clair** est la même crypte au lever du jour : parchemin et encre
  sang séché.

| Jeton | Clair (jour) | Sombre (crypte) | Usage |
|---|---|---|---|
| `--nuit` | `#f6efe8` | `#14090c` | fond de page |
| `--velours` | `#fffaf5` | `#22121a` | carte de la blague, dialogue, bandeaux |
| `--velours-enfonce` | `#ece0d6` | `#0d0507` | intérieur de la poche vide, fond de l'interrupteur |
| `--filet` | `#c9b3a8` | `#4a2a33` | bordures décoratives |
| `--encre` | `#2a0f14` | `#f2e6dc` | texte |
| `--encre-pale` | `#6e4a4f` | `#b9a39a` | texte secondaire, sources, raccourcis clavier |
| `--sang` | `#9e1622` | `#e0525c` | bouton principal, liens, tiret de dialogue de la chute |
| `--sang-ink` | `#fffaf5` | `#14090c` | texte posé sur `--sang` |
| `--poche` | `#b3121f` | `#c21d2b` | sang dans la jauge, gouttes |
| `--or` | `#8a6416` | `#e3b55b` | focus, étiquette de la poche, ornements, contour de l'élément désigné par le tutoriel |
| `--voile` | `rgb(20 9 12 / 0.55)` | `rgb(0 0 0 / 0.65)` | voile du tutoriel, autour de l'élément désigné |

Aucune valeur hexadécimale en dehors de `styles/base.css`.

## 3. La poche de sang (jauge « Réserve »)

- Une **poche de transfusion** en SVG en ligne : un rectangle aux coins arrondis,
  un œillet en haut et une tubulure en bas, avec un contour `--encre` de 1,5 px.
- Le sang (`--poche`) monte du bas selon la part de blagues restantes. Le vide
  est en `--velours-enfonce`.
- Elle porte **10 graduations** à droite, en traits courts `--encre-pale`, comme
  sur une vraie poche.
- Une **étiquette** est collée dessus : un rectangle `--velours` à filet `--or`,
  avec « RÉSERVE » en petites capitales et « 27 / 34 » en chiffres tabulaires.
  L'étiquette porte le nombre exact : la couleur n'est jamais la seule
  information.
- Quand la poche est vide, il reste seulement un fond de 2 px au bas de la
  poche. La tubulure pend, sans goutte.

## 4. Typographie

Il n'y a aucun fichier de police à charger. On utilise deux piles système :

- **Titres** (nom du site, messages d'épuisement) : une didone à fort contraste,
  pour l'esprit affiche de cinéma.
  `"Bodoni 72", Didot, "Bodoni MT", "Iowan Old Style", Georgia, serif`
  - Le nom du site est en capitales, espacé de 0,12 em.
  - Les messages d'épuisement sont en romain.
- **Texte des blagues et interface** : la pile de geo-train.
  `"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, ui-serif, serif`
- Le **nombre de la jauge** est en chiffres tabulaires
  (`font-variant-numeric: tabular-nums lining-nums`).

Échelle :

| Élément | Taille |
|---|---|
| Interface | 1 rem |
| Amorce | 1,375 rem sur ordinateur, 1,125 rem sur téléphone |
| Chute | 1,625 rem, en gras, sur ordinateur ; 1,25 rem sur téléphone |
| Message d'épuisement | 2,25 rem sur ordinateur, 1,75 rem sur téléphone |
| Nom du site | 1,5 rem |

- **Dialogues** : chaque paragraphe qui commence par « — » est une réplique.
  Le tiret reste collé au texte par une espace insécable, et les répliques de la
  chute ont leur tiret en `--sang`.
- **Typographie française** : espace insécable fine avant « ? », « ! », « : »,
  « ; », et à l'intérieur des guillemets « ». Une fonction du cœur la pose au
  rendu, pour que personne n'ait à la saisir en contribuant.

## 5. Composants

| Composant | Description |
|---|---|
| En-tête | nom du site en didone capitales, et la devise « Achevez vos collègues façon vampire » en `--encre-pale` |
| Carte de la blague | fond `--velours`, filet `--filet` de 1 px, coins de 4 px, et un petit ornement `--or` (deux crocs stylisés) centré sur le filet du haut. Largeur maximale de 40 rem. Elle contient l'amorce, puis la chute, puis la source |
| Chute cachée | avant la révélation, la place de la chute est réservée (pas de saut de mise en page), avec un filet pointillé `--filet` et l'invitation « Prêt à achever vos collègues ? » en `--encre-pale` |
| Bouton principal | fond `--sang`, texte `--sang-ink`, coins de 6 px, 3,25 rem de haut. « Achever » avant la chute, « Victime suivante » après. Le raccourci est indiqué à côté, en `--encre-pale` : touche « Espace » dessinée en cartouche |
| Source | sous la chute, en `--encre-pale` et 0,875 rem : « Source : Bored Panda », avec un lien qui s'ouvre dans un nouvel onglet. Elle n'apparaît qu'après la chute |
| Interrupteur trash | interrupteur à glissière, coupé par défaut. Son libellé est « Âmes sensibles s'abstenir », avec en dessous « Ajoute N blagues vulgaires. À éviter en réunion client. », N étant calculé sur la banque. Un mot « Coupé » ou « Activé » en `--encre-pale` suit la piste : l'état est porté par la position et par le texte, pas seulement par la couleur |
| Poche de sang | §3 |
| Pied de page | « Transfusion » (bouton secondaire), « Proposer une blague » (lien externe, avec une icône de flèche sortante), « Revoir le tutoriel » et « À propos » |
| Tutoriel (visite guidée) | la page est couverte d'un voile `--voile`, percé autour de l'élément désigné, qui garde ses vraies couleurs et un contour `--or` de 2 px, avec 8 px de marge et des coins de 6 px. À côté, une bulle `--velours` à filet `--filet`, de 22 rem de large au plus, avec une petite flèche vers l'élément. Dans la bulle : « 1 / 4 » en `--encre-pale` et en chiffres tabulaires, le titre en didone, le texte, puis une rangée « Passer » (lien) · « Précédent » (secondaire, dès l'étape 2) · « Suivant » (principal, « C'est parti » à l'étape 4). En dessous, séparé par un filet, le bouton-lien « Ne plus afficher » en `--encre-pale`. Sur ordinateur, la bulle se place à gauche de la poche, sous la carte, au-dessus de l'interrupteur et au-dessus du pied de page. Sous 900 px, elle prend toute la largeur moins 1 rem de marge, au-dessus ou au-dessous de l'élément selon la place, sans jamais passer sous le bouton collé en bas |
| Bouton secondaire | contour `--encre` de 1,5 px, fond transparent |
| Dialogue de transfusion | `<dialog>` natif sur `--velours` : le titre « Transfusion ? », puis le texte « La réserve sera remise à plein. Les blagues déjà vues pourront revenir. », et les boutons « Transfuser » (principal) et « Annuler » (secondaire, qui reçoit le focus à l'ouverture). Échap annule |
| Écran d'épuisement | dans la carte de la blague : la poche vide en grand, le message en didone, puis au besoin la ligne « Il reste 4 blagues pour les estomacs solides » avec l'interrupteur juste en dessous, puis « Transfusion » en bouton principal et « Proposer une blague » |
| Bandeau de stockage | bande fine en haut de page, sur fond `--velours` avec un filet `--or` : « Vos blagues vues ne seront pas gardées dans ce navigateur. » |
| Icône du site | `favicon.svg` : une goutte `--poche` sur un carré arrondi `--nuit`, avec deux points de morsure en `--velours`. Le même dessin, à fond perdu, sert de `apple-touch-icon.png` (180 px) |
| Icônes | SVG en ligne, trait de 1,5 px couleur encre. Pas d'emoji |

## 6. Mouvement et réactions

| Événement | Visuel | Durée |
|---|---|---|
| Révélation de la chute | la chute monte de 8 px en apparaissant en fondu. Une goutte tombe de la tubulure de la poche, et le niveau de sang baisse | 220 ms ; goutte 400 ms ; niveau 400 ms |
| Victime suivante | fondu enchaîné de la carte | 150 ms |
| Dernière blague révélée | la poche se vide de sa dernière goutte, puis l'écran d'épuisement apparaît en fondu au clic suivant | 400 ms |
| Transfusion | le sang remonte dans la poche, de bas en haut | 700 ms |
| Tutoriel, d'une étape à l'autre | le trou du voile glisse vers le nouvel élément, la bulle apparaît en fondu | 200 ms |

Avec `prefers-reduced-motion`, il n'y a ni goutte, ni montée, ni remplissage
animé, ni glissement du tutoriel. Le niveau, la chute et chaque étape s'affichent
directement.

Pas de son en v1.

## 7. Ton et textes

Vouvoiement, phrases courtes, humour noir, jamais d'insulte envers le lecteur.

| Situation | Texte |
|---|---|
| Devise | « Achevez vos collègues façon vampire » |
| Révéler la chute | « Achever » |
| Passer à la suivante | « Victime suivante » |
| Chute pas encore révélée | « Prêt à achever vos collègues ? » |
| Jauge | « Réserve » et « 27 / 34 » |
| Interrupteur trash | « Âmes sensibles s'abstenir », « Ajoute 4 blagues vulgaires. À éviter en réunion client. » (nombre calculé, singulier à 1), et l'état « Coupé » ou « Activé » |
| Blagues trash restantes | « Il reste 4 blagues pour les estomacs solides. » (« Il reste 1 blague… » au singulier) |
| Remise à zéro | « Transfusion » |
| Dialogue de transfusion | « Transfusion ? », puis « La réserve sera remise à plein. Les blagues déjà vues pourront revenir. », puis « Transfuser » et « Annuler » |
| Contribution | « Proposer une blague » |
| Stockage indisponible | « Vos blagues vues ne seront pas gardées dans ce navigateur. » |
| Source | « Source : Bored Panda » ; « Création originale » sans lien |
| Tutoriel, étape 1 / 4 | « Achevez vos collègues », puis « Lisez l'amorce, puis appuyez sur « Achever » ou sur Espace pour révéler la chute. « Victime suivante » passe à la blague d'après. » |
| Tutoriel, étape 2 / 4 | « La réserve de sang », puis « La poche compte les blagues que vous n'avez pas encore vues. Chaque chute révélée la vide un peu : le site ne vous ressert jamais une blague déjà vue dans ce navigateur. » |
| Tutoriel, étape 3 / 4 | « Âmes sensibles s'abstenir », puis « Coupé par défaut. Activé, il ajoute 4 blagues vulgaires à la réserve. À éviter en réunion client. » (nombre calculé, singulier à 1) |
| Tutoriel, étape 4 / 4 | « La transfusion », puis « Poche vide ? La transfusion la remplit, et toutes les blagues peuvent revenir. Votre historique reste dans ce navigateur, sans compte. » |
| Tutoriel, boutons | « Passer », « Précédent », « Suivant », « C'est parti », « Ne plus afficher » ; dans le pied de page, « Revoir le tutoriel » |
| À propos, « Vos données » | « Le site garde seulement la liste des blagues que vous avez vues, l'état de l'interrupteur et votre choix sur le tutoriel, dans votre navigateur. Rien n'est envoyé nulle part. La transfusion remet la réserve à plein. » |

Messages d'épuisement : 7 variantes, jamais la même deux fois de suite.

1. « Vous avez épuisé votre réserve de sang. »
2. « Plus une goutte. Vos collègues sont achevés, et vous aussi. »
3. « Votre banque du sang est à découvert. »
4. « Le cercueil est vide : toutes les blagues sont sorties. »
5. « Anémie sévère : vous avez tout bu. »
6. « Le jour se lève, et il ne reste plus une seule blague. »
7. « Vous êtes à sec. Revenez à la nuit tombée, de nouvelles victimes
   arrivent. »

## 8. Mise en page

- **Conception pour l'ordinateur d'abord**, de 1280 à 1920 px de large.
  - Une colonne centrale de 40 rem porte l'en-tête, la carte de la blague, le
    bouton principal et l'interrupteur.
  - La poche de sang (8 rem de large, 60 % de la hauteur de l'écran) est à
    droite de la colonne et centrée verticalement.
  - Le pied de page est en bas.
  - Tout tient sans défilement à 1280 × 720.
- **Sous 900 px** :
  - la poche devient une jauge horizontale fine sous l'en-tête, avec la même
    étiquette « Réserve · 27 / 34 » ;
  - le bouton principal est collé en bas de l'écran, sur toute la largeur ;
  - les blagues longues font défiler la carte, jamais le bouton.
- Le site reste utilisable jusqu'à 360 px de large.

## 9. Accessibilité — contrastes mesurés

Ces contrastes ont été mesurés avec la formule WCAG 2 le 04/11/2026.

| Paire | Clair | Sombre |
|---|---|---|
| `--encre` sur `--velours` | 17,20:1 | 14,65:1 |
| `--encre` sur `--nuit` | 15,66:1 | 15,95:1 |
| `--encre-pale` sur `--velours` | 7,35:1 | 7,50:1 |
| `--encre-pale` sur `--nuit` | 6,69:1 | 8,16:1 |
| `--sang` sur `--velours` (liens) | 7,81:1 | 4,73:1 |
| `--sang` sur `--nuit` | 7,11:1 | 5,15:1 |
| `--sang-ink` sur `--sang` | 7,81:1 | 5,15:1 |
| `--or` sur `--nuit` (focus) | 4,71:1 | 10,27:1 |
| `--poche` sur `--velours-enfonce` (jauge) | 5,36:1 | 3,36:1 |

- Tous les textes dépassent 4,5:1.
- La jauge dépasse 3:1, et son étiquette donne le nombre exact.
- Les filets (`--filet`) sont décoratifs et ne portent aucune information.
- Le focus est visible : contour `--or` de 2 px, décalé de 2 px.
- La chute est annoncée aux lecteurs d'écran à sa révélation
  (`aria-live="polite"`). La poche est un `role="meter"` avec sa valeur et son
  libellé.
- La barre d'espace sur un bouton qui a le focus ne déclenche l'action qu'une
  seule fois : le raccourci global ignore les touches qui arrivent d'un bouton,
  d'un lien ou de l'interrupteur.
- Le tutoriel est un dialogue modal (`<dialog>` et `showModal()`) : le focus y
  reste enfermé et arrive sur « Suivant ». Le titre et le texte lui servent de
  nom et de description (`aria-labelledby`, `aria-describedby`), et le
  raccourci des blagues est suspendu tant qu'il est ouvert. La bulle reprend les
  couples déjà mesurés (`--encre` et `--encre-pale` sur `--velours`).
