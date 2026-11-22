# Silent Vault

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/denox035/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/denox035/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A 2D top-down stealth heist game for [make.fun](https://make.fun): one night, one
gallery, two treasures, no alarms. Sneak through a museum hall past patrolling
guards and sweeping wall cameras, crack the vault, lift The Gilded Fox painting,
and slip out the service door — all in a single room you can read in one frame.

## Play

```sh
node serve.ts
# open http://localhost:8080
```

WASD / arrows or click to move · Shift to sneak · E to grab loot (hold E to
crack the vault) · Q or right-click tosses a coin (3 per run) to lure a guard
away · R to retry · M to mute.

## The game

- **One room, two routes:** slip through the vent in the mid wall or cross the
  open east end past the pedestals — every crossing is a read of the cones.
- **Three guards** (Rook, Bishop, Knight) patrol with amber vision cones; a
  loud step or a vault crack draws them to investigate, and above 55 alarm
  they hunt the last place they saw you.
- **Two wall cameras** sweep red cones across the hall on their own rhythm.
- **Alarm meter:** fills while you are seen, drains while hidden. At 100 you
  are caught — a fair restart, not a punishment.
- **Tools at a cost:** 3 coins per run, each toss buys a guard's attention
  somewhere else; sneaking is slower but quieter and harder to spot.

Plain HTML5 canvas + vanilla JS, no external assets, no network requests,
sounds from a WebAudio oscillator. Original names, art and layout.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
