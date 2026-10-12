# Cyberspace Trail

A 10-minute browser survival run: lead a party of five across Reddit, TikTok, LinkedIn, and YouTube, survive the X finale, and reach Logged Off Valley.

Built with **TypeScript**, **Vite**, and **bun**. Game rules live in a pure logic module under `src/logic/` (no DOM imports), so runs can be simulated headlessly for balance.

## Run locally

### With Nix (recommended)

```bash
nix develop
bun install
bun run dev
```

Open [http://localhost:5173](http://localhost:5173). Audio unlocks on the first click or tap.

### Without Nix

Install [bun](https://bun.sh), then:

```bash
bun install
bun run dev
```

## Scripts

| Command | Purpose |
| --- | --- |
| `bun run dev` | Vite dev server with hot reload |
| `bun run build` | Typecheck + production build to `dist/` |
| `bun run preview` | Serve the production build locally |
| `bun test` | Logic tests (`bun test`) |
| `bun run typecheck` | `tsc --noEmit` only |
| `bun run balance` | 1,000 headless runs per class → `balance/results-*.csv` |
| `bun run package` | Build + `cyberspace-trail-itch.zip` for itch.io |

## Nix build (offline package)

The flake provides `devShells.default` and `packages.default` (built `dist/` plus the itch zip). The Nix package runs `vite build` directly (typecheck with `bun run typecheck` in dev).

After changing dependencies, refresh the fixed-output `node-modules` hash:

```bash
nix build .#node-modules 2>&1 | tail -20
# Copy the suggested sha256 into flake.nix (per system), then:
nix build
```

Artifacts land in `result/dist/` and `result/cyberspace-trail-itch.zip`.

## itch.io upload

1. Run `bun run package` (or `nix build` and use `result/cyberspace-trail-itch.zip`).
2. Upload as an **HTML** project; enable **Played in the browser**.
3. Viewport **840 × 576** (3× canvas scale), enable fullscreen.
4. Enable **Mobile friendly**, orientation **Default**.

## Balance notes

Target reach-X / clear-Rapids rates (AI Bro / Tech Bro / Content Creator): **80% / 65% / 50%** and **25% / 60% / 70%**. Tune numbers in [`src/logic/balance.ts`](src/logic/balance.ts) and re-run `bun run balance`.

**Open design question:** AI Bro has the lowest score multiplier (×1) but is the hardest class overall; consider rebalancing multipliers after tuning passes.

## License

Press Start 2P is under [SIL Open Font License 1.1](public/fonts/OFL.txt).
