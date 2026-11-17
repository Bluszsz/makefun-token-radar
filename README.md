# Token Radar — radar-2

[![make.fun](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/Bluszsz/makefun-token-radar/rank.svg)](https://make.fun/bounty/token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/Bluszsz/makefun-token-radar/reward.svg)](https://make.fun/bounty/token-radar-01)

Build the best token launch radar for [make.fun](https://make.fun) competition
`token-radar-01` ($1,325). A Node 22, standard-library-only program (`main.ts`)
reads a sealed DefiLlama snapshot and writes a ranked board plus a static,
no-network dashboard.

## What it does

- Reads `/input/snapshot.json` (758 protocols, 40 on the watchlist, as of 2026-11-14).
- Ranks **every genuine pre-token protocol (198)** by implied value — all 40
  watchlist slugs plus every other genuine pre-token protocol below the floor. The
  watchlist is the floor, never the ceiling. Wrapped, staked and bridged products
  of tokens that already trade (WBTC, Binance staked ETH, exchange bridges) are
  excluded under the house's own watchlist rule, so they never top the board.
- Keeps live-token protocols apart, shown with their market cap, never mixed
  into the ranking.

## The model (radar-2)

Implied value is calibrated from the snapshot itself — no protocol name is
ever special-cased:

```
implied = round(tvl_usd x base_multiple(category)
              x (1 + clamp(change_7d, -50, 150) / 100 x 0.75)
              x maturity(age) x breadth(chains))
```

- **Base multiple, per category:** the median `mcap_usd / tvl_usd` of live-token
  protocols in the same category, shrunk toward the global median (~0.20x,
  129 live protocols) with a prior of 8, clamped to [0.05, 0.60].
- **Growth:** 7-day TVL change, clamped so a +4,448% spike cannot dominate.
- **Maturity, inverted-U:** 0.55 at listing, rising to 1.00 at 720 days, easing
  to 0.85 by 1,800 days. Two years with no token is the sweet spot.
- **Breadth:** +0.03 per extra chain, capped at 1.15.

Each board row carries a 7-step farm plan derived from the protocol's own
category, chains, TVL and age: gas follows the chain, capital follows TVL,
the hold follows age, and the two actions follow the category. Every step
states its cost and its time.

## Dashboard

`dashboard/` is a static page (no network, no fetch): a sortable/filterable
board, a top-3 spotlight, search + category + chain filters, a watchlist-only
toggle, a live-token view with mcap/TVL ratios, a detail drawer per protocol
with the model's full breakdown and its farm plan, and a model panel showing
the calibrated multiples by category.

## Run it

```bash
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <path-to>/snapshot.json
```

Output: `out/board.json`, `out/data.js`, `out/dashboard/`, `out/screenshots/`,
`out/dossier.json`. The program is deterministic: two runs write byte-identical
output.

## License

MIT. See `LICENSE`.
