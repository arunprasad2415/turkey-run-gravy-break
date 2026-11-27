# Turkey Run: Gravy Break

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/arunprasad2415/turkey-run-gravy-break/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/arunprasad2415/turkey-run-gravy-break/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

A top-down turkey escape game: one bird, three hundred yards of farm, and a farmer with a pitchfork
who would very much like it in the oven. Run the farmyard, cut through the cider orchard under a rain
of carving knives, then get across the kitchen past the ovens and out the back door. Tall grass hides
you, your breath is limited, and a flap-dash buys you a body length of daylight.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

The game is plain static files under `game/`: open `game/index.html` from any static server and it
plays with no network request. `node main.ts` (with `MAKEFUN_OUTPUT_DIR=out`) stages `game/` and
`screenshots/` and writes `dossier.json` for the bounty's gate.

### Controls

- **WASD / arrows** move, **Shift** sprints and spends breath
- **Space** flap-dashes (short burst, brief cooldown)
- **G** gobbles: the farmer hears it and comes to look, which is how you pull him off a gate
- **P** pause, **M** mute, **R** restart

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>