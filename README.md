# Creature Match

A mobile-first creature collection and match-three battle game built with HTML, CSS, and JavaScript.

## Run locally

Serve this folder using a static web server, for example:

```sh
python -m http.server 8000
```

Open http://localhost:8000. Keep the asset folders beside `index.html` when deploying.

## Code layout

- `index.html`: page structure and the remaining game script, including combat, progression, menus, and startup.
- `styles.css`: the stylesheet formerly embedded in the page.
- `save.js`: save validation, migrations, browser persistence, and portable save-code encoding/decoding.
- `data/creatures.js`: creature species and evolution names.
- `data/abilities.js`: attacks, passives, and ability charge/unlock settings.
- `data/world.js`: story encounters, floor themes, tutorial content, and story text.
- `data/balance.js`: combat multipliers, XP/evolution/merge/bond costs, shop skill definitions, reward tables, energy, summon odds, and mode settings.
- `tests/`: regression checks that run with Node.js without additional packages.

The data files load first in the order listed in `index.html`, followed by `save.js` and the main game script. They are synchronous classic scripts sharing the same global scope; `data/balance.js` initializes constants used by the other data files. Keep this order when adding scripts. Data files contain definitions only and do not access the DOM or mutate live game state.

`save.js` is a classic script loaded before the main game script. Its functions resolve shared game state at call time; do not make either script asynchronous or call save functions before the game declarations initialize. Save import dialogs and the import application flow remain with the interface code in `index.html` for now.

The storage key (`creatureMatchGame`) and backup format (`CMB1.`) remain unchanged. Existing browser saves use the same origin and storage as before.

## Checks

```sh
node tests/save-validation.cjs
node tests/script-loading.cjs
```

Before releasing, also check starter selection, a battle, renaming, saving/reloading, and save export/import in a browser and on a phone.

## Android direction

Styles, save handling, and static game data have been extracted. Battle rules, progression logic, and interface code can follow in small changes. The game still uses browser storage and shared globals; native packaging, lifecycle handling, and Android device testing are future work.

