# Velvet Vault — a museum heist

![make.fun competition](https://make.fun/badge/best-stealth-game-20261121-1759.svg)
![rank](https://make.fun/badge/best-stealth-game-20261121-1759/DavidQlla06/best-stealth-game-20261121-1759-v2/rank.svg)
![reward](https://make.fun/badge/best-stealth-game-20261121-1759/DavidQlla06/best-stealth-game-20261121-1759-v2/reward.svg)

Entry for the [make.fun best stealth game bounty](https://make.fun/bounty/best-stealth-game-20261121-1759).

You are a burglar in a dark museum. Three wings, patrolling guards with
flashlight vision cones, crates and walls for cover. Steal every gem in
the wing, then slip out the EXIT unseen. Vision cones are raycast-clipped
by cover, so hiding behind a crate really does break line of sight.
Sneaking and hugging cover slow the Alert meter; breaking sight drains
it. Finish a wing barely noticed for the Ghost bonus. Guard footsteps
get louder as they approach, so your ears help you time a crossing.

## Controls

- **WASD / arrow keys** or **click** — move (click sets a walk-to target)
- **Shift** — sneak (slower, much harder to spot)
- **P / Esc** — pause · **R** — restart wing · **M** — mute · **Enter** — confirm
- Title, pause, caught and victory screens all have clickable buttons.

## Run it

Serve `game/` with any static file server and open `index.html`, or:

```sh
python3 -m http.server --directory game 8080
# then open http://localhost:8080
```

Fully offline: no network requests, no libraries, sound is WebAudio blips.

## Layout

- `game/index.html`, `game/style.css` — page shell
- `game/src/config.js` — sizes, speeds, detection tuning, colours
- `game/src/levels.js` — the three museum wings as data
- `game/src/engine.js` — pure simulation (movement, patrols, raycast vision, detection)
- `game/src/render.js` — canvas drawing (floor, cones, guards, burglar, HUD)
- `game/src/input.js` — keyboard + click-to-move
- `game/src/audio.js` — WebAudio blips and footsteps
- `game/src/main.js` — states, loop, buttons, screenshot poses (`?shot=play&seed=1`)
- `main.ts` — hand-in program that copies `game/` + `screenshots/` out and writes `dossier.json`
