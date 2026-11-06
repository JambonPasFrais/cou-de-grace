# Proposer une blague

Merci d'agrandir la banque. Chaque blague est relue par Armand avant d'entrer
dans le site : rien n'est publié sans validation.

## La charte

Une blague entre dans la banque si :

- c'est une blague de vampire, de Dracula ou de chauve-souris vampire ;
- elle est en français et a une **chute qui se comprend tout de suite**, sans
  référence à connaître ni lien à deviner ;
- elle ne vise aucun groupe de personnes (origine, religion, genre, orientation,
  handicap), même en mode trash ;
- elle est réécrite avec vos mots, sans copier-coller un livre ou un spectacle,
  et sa source est citée.

Une blague vulgaire, scatologique, grivoise ou gore est la bienvenue, mais elle
est marquée `trash` : elle n'apparaît que si le lecteur active l'interrupteur.

## Première façon : le formulaire

Ouvrez le formulaire
[« Proposer une blague »](https://github.com/JambonPasFrais/cou-de-grace/issues/new?template=blague.yml),
remplissez l'amorce, la chute, le registre et la source. GitHub demande un
compte pour ouvrir une issue. Armand s'occupe du reste.

## Seconde façon : la pull request

Ajoutez une entrée **à la fin** de `src/data/jokes.js` :

```js
{
  id: 'retrait-efs',
  setup: [
    "Un vampire se présente à l'Établissement français du sang. L'infirmière l'accueille :",
    '— Vous venez pour un don ?'
  ],
  punchline: ['— Non. Pour un retrait.'],
  trash: false,
  source: { name: 'Little Day Out', url: 'https://www.littledayout.com/vampire-jokes/' }
}
```

| Champ | Règle |
|---|---|
| `id` | kebab-case, 24 caractères au plus, unique. **Ne renommez ni ne réutilisez jamais un identifiant existant** : c'est lui que les navigateurs gardent en mémoire, et le changer fait revenir la blague chez tous ceux qui l'ont déjà vue. |
| `setup` | l'amorce, un paragraphe par élément. Une réplique de dialogue par paragraphe, qui commence par « — ». |
| `punchline` | la chute, même format. Elle reste cachée jusqu'à ce que le lecteur la révèle. |
| `trash` | `true` pour une blague vulgaire, scatologique, grivoise ou gore, sinon `false`. |
| `source` | `name` obligatoire ; `url` en `https`, ou pas d'`url` du tout pour une création originale (`name: 'Création originale'`). |

Écrivez avec des espaces ordinaires : les espaces fines avant `? ! : ;` et dans
les guillemets « » sont posées automatiquement à l'affichage.

Avant d'ouvrir la PR :

```bash
node tests/run.mjs
```

Les tests vérifient le format, l'unicité des identifiants et les champs
obligatoires. La GitHub Action les relance sur la PR.
