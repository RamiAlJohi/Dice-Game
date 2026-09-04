# Dice Roguelite

A dice-based roguelite in the vein of [Dicero](https://apps.apple.com/us/app/dicero/id6740966864) —
roll a bag of dice, chase Yahtzee-style combos, and turn them into damage across ten
escalating stages. Web-first, built to wrap for mobile later.

## Run it

```bash
npm install
npm run dev      # play at http://127.0.0.1:5173
npm test         # engine test suite
npm run sim      # 10,000 headless runs, balance report
npm run build    # production build
npm run smoke    # browser smoke test (needs a server on :4173)
```

## How it plays

- You start with **2 dice** and roll up to **3 times** a round, holding dice between rolls.
- Your best combo becomes damage: `(base + pips + relic flat) x combo mult x relic mult`.
  Pips are in the formula on purpose — a Pair of 6s beats a Pair of 2s, so the
  reroll decision is more than "chase the combo name".
- You always strike before the enemy, so a lethal roll at 1 HP still wins.
- Clearing a stage grants XP and a small heal; levelling up offers **3 upgrades**
  (an extra die up to 5, an extra reroll up to 5, a reforged face, a heal, or a relic).
- Stage 10 is the Dice Tyrant.

## Layout

```
src/
  engine/     pure game logic — no React, no DOM, no I/O
    rng.ts       seeded generator; a run is reproducible from its seed
    combos.ts    combo detection + the scoring table
    combat.ts    damage formula, XP curves
    enemies.ts   enemy scaling
    upgrades.ts  relic pool, upgrade offers
    run.ts       state machine tying it together
  sim/        headless balance harness
  state/      zustand store (holds the live RNG outside React state)
  ui/         presentational components
```

The engine is deliberately dependency-free and pure. That is what lets `npm run sim`
play thousands of runs in a couple of seconds, which is the only practical way to
tune a roguelite's numbers.

## Balance

`npm run sim` plays runs with a bot that holds contributing dice and greedily picks
upgrades, then reports win rate, where runs die, and per-relic win rate.

Current baseline: **~33% win rate** over 8,000 runs, deaths ramping from 0.4% at
stage 4 to 7.8% by stage 9, with the boss accounting for the rest. Relic win rates
sit in a 27–35% band — no dominant or dead pick.

Two caveats worth keeping in mind before trusting these numbers:

- The bot is crude. It approximates a competent player, not a good one, so treat
  the win rate as a **relative** signal for comparing changes, not an absolute
  prediction of how humans will do.
- The boss is a hard wall by design (2.4x HP), and it accounts for roughly 60% of
  all losses. That is normal for the genre but worth revisiting with real playtests.

The knobs that move the curve most are `STAGE_CLEAR_HEAL` (`src/engine/run.ts`) and
the enemy `curve` factor (`src/engine/enemies.ts`).

## Not built yet

Accounts, persistence, energy, monetisation, and anything server-side. The
single-player run loop is deliberately standalone; see the notes in the PR/branch
discussion for why that split matters.

## Play it on your phone

The app is an installable PWA, so it goes on your home screen and runs fullscreen and
offline — no app store, no developer account, on both Android and iOS.

**Deploy (one-time setup):**

1. In the repo on GitHub, go to **Settings -> Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push to `main` (or run the *Deploy to GitHub Pages* workflow manually from the
   Actions tab). The workflow typechecks, tests, builds, and publishes `dist/`.

It lands at `https://<your-username>.github.io/Dice-Game/`.

**Install on the phone:** open that URL and then

- **Android / Chrome:** menu -> *Add to Home screen* (or the install prompt).
- **iOS / Safari:** Share -> *Add to Home Screen*. It must be Safari; Chrome on iOS
  cannot install PWAs.

Once installed it works with no connection — the service worker precaches the whole
game, which is easy here because there is no backend.

### Base path

GitHub Pages serves a project site under `/<repo>/`, so the build sets Vite's `base`
accordingly. CI derives it from the repo name. For a custom domain or a
`<user>.github.io` repo, build with `BASE_PATH=/ npm run build`.

### Native app

If you later want a real store listing, wrap the same `dist/` build with
[Capacitor](https://capacitorjs.com/) — no engine changes required. Note that an
Android APK needs the Android SDK, and iOS needs Xcode plus a paid Apple Developer
account to install on a device; the PWA above avoids both.
