// Token Radar, model radar-2: the implied value is calibrated from the snapshot itself.
//
// Every number below is derived from the sealed snapshot at run time; no protocol name is
// ever special-cased and no value is hand-picked per protocol.
//
//   1. Base multiple, calibrated per category. For every live-token protocol (one that
//      records a token with a market cap) compute mcap_usd / tvl_usd. The global median
//      of that ratio is the market's own answer to "what is a protocol's token worth
//      relative to its TVL". Per category, take the category median and shrink it toward
//      the global median (weight n/(n+8)) so thin categories do not swing on two or three
//      protocols, then clamp to [0.05, 0.60] so outliers (a token locker at 9.5x) cannot
//      dominate. A pre-token protocol in a category inherits its category's multiple.
//      On this snapshot the global median is ~0.20 (starter used a flat 0.25 for all).
//   2. Growth. clamp(change_7d, -50, 150) per cent, weight 0.75: a protocol whose TVL is
//      growing fast is worth more per dollar of TVL; one shrinking is worth less. The
//      clamp matters: the snapshot's fastest grower is +4,448% in 7 days, which is a
//      data spike, not a valuation.
//   3. Maturity, inverted-U. Age is days since listed_at. 0.55 at birth rising linearly
//      to 1.00 at 720 days (two years of running with no token = accumulated users,
//      integrations and a launch that is plausibly being prepared), then easing to 0.85
//      by 1,800 days (a protocol that has run five years with no token is, on the
//      snapshot's own evidence, less likely to be preparing one). Unknown age = 365 days.
//   4. Breadth. 1 + 0.03 per extra chain, capped at 1.15: a protocol live on many chains
//      distributes a future token more widely.
//
//   implied = round(tvl_usd x base_multiple x growth_mult x maturity_mult x breadth_mult)
//
// The board ranks EVERY genuine pre-token protocol in the snapshot (198 on this
// snapshot: all 40 watchlist slugs plus every other genuine pre-token protocol below
// the floor), not just the top 160 by TVL. The watchlist is the floor, never the
// ceiling: the radar exists to find early protocols below it. A protocol counts as
// genuine only under the house's own watchlist rule: it records no token, and it is
// not a wrapped, staked or bridged product of a token that already trades (no
// Bridge / Canonical Bridge / Liquid Staking / Liquid Restaking / Restaked BTC /
// CEX category, no whole word wrapped, staked or staking in its name, no exchange
// name at the start, no version marker). That is why WBTC, Binance staked ETH and
// a bridge of an exchange sit at the top of a TVL-sorted list but never on this
// board: they are Bitcoin, ETH and an exchange's product on another chain, not a
// protocol still waiting on a launch of its own.
// Live-token protocols are kept apart and shown with their market cap, never mixed
// into the ranking, because their value is a market fact, not a model.

/** The snapshot's protocol entry: exactly the ten fields the sealed input carries. */
export interface SnapshotProtocol {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
}

/** The whole snapshot document. */
export interface Snapshot {
  as_of: string;
  source: string;
  floor_usd: number;
  protocols: SnapshotProtocol[];
  watchlist: string[];
}

/** The model's constants: hyperparameters only. Every multiple is computed from the snapshot. */
export interface ModelConstants {
  growth_weight: number;
  growth_floor: number;
  growth_cap: number;
  maturity_floor: number;
  maturity_peak_days: number;
  maturity_tail_days: number;
  maturity_tail_floor: number;
  unknown_age_days: number;
  shrink_prior: number;
  multiple_floor: number;
  multiple_cap: number;
  breadth_per_chain: number;
  breadth_cap: number;
}

export const MODEL: ModelConstants = {
  growth_weight: 0.75,
  growth_floor: -50,
  growth_cap: 150,
  maturity_floor: 0.55,
  maturity_peak_days: 720,
  maturity_tail_days: 1080,
  maturity_tail_floor: 0.85,
  unknown_age_days: 365,
  shrink_prior: 8,
  multiple_floor: 0.05,
  multiple_cap: 0.6,
  breadth_per_chain: 0.03,
  breadth_cap: 1.15,
};

/** The model's version label: the dashboard names it and the rules quote it. */
export const MODEL_VERSION = 'radar-2';

/** How many live-token protocols the Live token view carries, by market cap. */
export const LIVE_ROWS = 24;

/** One category's calibration: median mcap/TVL of its live protocols, shrunk to the global median. */
export interface CategoryCalibration {
  category: string;
  live_n: number;
  category_median: number | null;
  multiple: number;
}

/** The calibration the snapshot itself yields, shown on the dashboard. */
export interface Calibration {
  global_median: number;
  live_n: number;
  categories: CategoryCalibration[];
}

/** A farm step: the action, what it costs, and how long it takes. */
export interface FarmStep {
  text: string;
  cost: string;
  time: string;
}

/** One row of board.json: the ranked board's row. */
export interface BoardRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
  token_status: 'pre-token';
  age_days: number | null;
  implied_value_usd: number;
  model: {
    base_multiple: number;
    category_median: number | null;
    category_live_n: number;
    growth_pct: number;
    growth_multiplier: number;
    maturity_multiplier: number;
    breadth_multiplier: number;
    age_days: number | null;
  };
  farm_steps: string[];
}

/** The dashboard's compact view of one row, with farm plans generated in the page. */
export interface RadarRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  age_days: number | null;
  implied_value_usd: number;
  base_multiple: number;
  growth_multiplier: number;
  maturity_multiplier: number;
  breadth_multiplier: number;
}

/** A live-token protocol: it already trades, so the board shows the market's own value, not a model's. */
export interface LiveRow {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  mcap_usd: number | null;
  change_7d: number | null;
  mcap_tvl_ratio: number | null;
}

/** Everything the dashboard needs: the board, the live set, the calibration and the model it runs. */
export interface RadarData {
  as_of: string;
  source: string;
  floor_usd: number;
  model: ModelConstants;
  model_version: string;
  calibration: Calibration;
  watchlist_size: number;
  watchlist: string[];
  board_size: number;
  early_size: number;
  live_size: number;
  rows: RadarRow[];
  live: LiveRow[];
}

/** Why the snapshot is not one this model can score. */
export class SnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotError';
  }
}

const DAY_MS = 86_400_000;

/** A finite number, else `fallback`. */
function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** Median of a sorted-ascending array; null when empty. Deterministic: no sampling, no randomness. */
function medianOf(sorted: number[]): number | null {
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid]!;
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** A whole day count from `from` to `to`, clamped at zero; null when either date is absent or bad. */
export function ageDays(asOf: string, listedAt: string | null): number | null {
  if (listedAt === null) return null;
  const a = Date.parse(`${asOf}T00:00:00Z`);
  const b = Date.parse(`${listedAt}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.floor((a - b) / DAY_MS));
}

/**
 * Calibrate the base multiple from the snapshot's own live-token protocols.
 * Global median of mcap/TVL over every live protocol with a market cap; per category,
 * the category median shrunk toward the global median with a prior of `shrink_prior`
 * live protocols, clamped to [multiple_floor, multiple_cap].
 */
export function calibrate(snapshot: Snapshot, model: ModelConstants = MODEL): Calibration {
  const liveRatios: number[] = [];
  const byCategory = new Map<string, number[]>();
  for (const p of snapshot.protocols) {
    if (isPreToken(p)) continue;
    if (p.mcap_usd === null || p.mcap_usd <= 0 || p.tvl_usd <= 0) continue;
    const ratio = p.mcap_usd / p.tvl_usd;
    if (!Number.isFinite(ratio) || ratio <= 0) continue;
    liveRatios.push(ratio);
    const cat = p.category ?? 'Other';
    const list = byCategory.get(cat) ?? [];
    list.push(ratio);
    byCategory.set(cat, list);
  }
  liveRatios.sort((a, b) => a - b);
  const global = medianOf(liveRatios) ?? 0.2;
  const categories: CategoryCalibration[] = [];
  for (const [cat, ratios] of [...byCategory.entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))) {
    ratios.sort((a, b) => a - b);
    const med = medianOf(ratios);
    const n = ratios.length;
    const shrunk = med === null ? global : (n * med + model.shrink_prior * global) / (n + model.shrink_prior);
    const multiple = Math.min(model.multiple_cap, Math.max(model.multiple_floor, shrunk));
    categories.push({ category: cat, live_n: n, category_median: med === null ? null : Math.round(med * 1e4) / 1e4, multiple: Math.round(multiple * 1e4) / 1e4 });
  }
  return { global_median: Math.round(global * 1e4) / 1e4, live_n: liveRatios.length, categories };
}

/** The base multiple one category gets under a calibration; the global median when unseen. */
function baseMultipleFor(category: string | null, calibration: Calibration): { multiple: number; median: number | null; n: number } {
  const cat = category ?? 'Other';
  const found = calibration.categories.find((c) => c.category === cat);
  if (found === undefined) return { multiple: calibration.global_median, median: null, n: 0 };
  return { multiple: found.multiple, median: found.category_median, n: found.live_n };
}

/** Maturity multiplier: rises 0.55 -> 1.00 over the first 720 days, eases to 0.85 by 1,800 days. */
export function maturityMultiplier(age: number | null, model: ModelConstants = MODEL): number {
  const a = age ?? model.unknown_age_days;
  if (a <= model.maturity_peak_days) {
    return model.maturity_floor + (1 - model.maturity_floor) * (a / model.maturity_peak_days);
  }
  const past = Math.min(a - model.maturity_peak_days, model.maturity_tail_days);
  return 1 - (1 - model.maturity_tail_floor) * (past / model.maturity_tail_days);
}

/** The multipliers and the implied value one protocol gets under `model` and `calibration`. */
export function impliedValue(
  protocol: SnapshotProtocol,
  asOf: string,
  calibration: Calibration,
  model: ModelConstants = MODEL,
): { implied: number; baseMultiple: number; categoryMedian: number | null; categoryN: number; growthPct: number; growthMult: number; maturityMult: number; breadthMult: number; age: number | null } {
  const age = ageDays(asOf, protocol.listed_at);
  const base = baseMultipleFor(protocol.category, calibration);
  const rawGrowth = finite(protocol.change_7d, 0);
  const growthPct = Math.min(model.growth_cap, Math.max(model.growth_floor, rawGrowth));
  const growthMult = 1 + (growthPct / 100) * model.growth_weight;
  const maturityMult = maturityMultiplier(age, model);
  const breadthMult = Math.min(model.breadth_cap, 1 + model.breadth_per_chain * Math.max(0, protocol.chains.length - 1));
  const implied = Math.max(1, Math.round(protocol.tvl_usd * base.multiple * growthMult * maturityMult * breadthMult));
  return { implied, baseMultiple: base.multiple, categoryMedian: base.median, categoryN: base.n, growthPct, growthMult, maturityMult, breadthMult, age };
}

/** DefiLlama's version-marker rule: a name ending in a release is a pool of another protocol. */
const VERSIONED = /\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$/;

/** Whether a protocol records no token at all. */
export function isPreToken(p: SnapshotProtocol): boolean {
  return p.mcap_usd === null && p.gecko_id === null && p.symbol === null;
}

/** Categories the house's watchlist rule excludes: a wrapped, staked or bridged
 * product of a protocol whose token already trades, or an exchange itself. */
const EXCLUDED_CATEGORIES = new Set(['Bridge', 'Canonical Bridge', 'Liquid Staking', 'Liquid Restaking', 'Restaked BTC', 'CEX']);

/** A whole word wrapped, staked or staking anywhere in the name. */
const WRAPPED_WORD = /\b(wrapped|staked|staking)\b/i;

/** A name beginning with an exchange's name. */
const EXCHANGE_PREFIX = /^(Binance|Coinbase|Bybit|Kraken|Bitget|OKX|Bitfinex|Gemini)\b/i;

/** Whether a protocol is one the board may rank: pre-token, genuine under the
 * house's watchlist rule, not an exchange, not a versioned pool. */
export function isRankable(p: SnapshotProtocol): boolean {
  return (
    isPreToken(p) &&
    !EXCLUDED_CATEGORIES.has(p.category ?? '') &&
    !WRAPPED_WORD.test(p.name) &&
    !EXCHANGE_PREFIX.test(p.name) &&
    !VERSIONED.test(p.name)
  );
}

/** The snapshot's protocol by slug. */
function bySlug(protocols: SnapshotProtocol[]): Map<string, SnapshotProtocol> {
  return new Map(protocols.map((p) => [p.slug, p]));
}

/** The headline sentence's figures: how many watchlist slugs, how many rows, how many live protocols. */
export interface BoardSummary {
  watchlist_size: number;
  board_size: number;
  early_size: number;
  live_size: number;
}

/** The protocols the board ranks, strongest first, with ranks 1..n. */
export function buildBoard(snapshot: Snapshot, model: ModelConstants = MODEL): BoardRow[] {
  const calibration = calibrate(snapshot, model);
  const index = bySlug(snapshot.protocols);
  const chosen = new Map<string, SnapshotProtocol>();
  // The watchlist is the floor: every slug, even one the snapshot no longer carries.
  for (const slug of snapshot.watchlist) {
    const p = index.get(slug);
    if (p !== undefined) chosen.set(slug, p);
  }
  // The early radar: EVERY rankable pre-token protocol below the watchlist floor, not
  // just the biggest few by TVL. A small protocol growing fast with a calibrated
  // category multiple can outrank a large stagnant one; the radar exists to find it.
  for (const p of snapshot.protocols) {
    if (!chosen.has(p.slug) && isRankable(p)) chosen.set(p.slug, p);
  }

  const scored = [...chosen.values()].map((p) => {
    const v = impliedValue(p, snapshot.as_of, calibration, model);
    return { p, ...v };
  });
  scored.sort((a, b) => b.implied - a.implied || (a.p.slug < b.p.slug ? -1 : a.p.slug > b.p.slug ? 1 : 0));
  return scored.map((s, i) => ({
    rank: i + 1,
    slug: s.p.slug,
    name: s.p.name,
    category: s.p.category,
    chains: s.p.chains,
    tvl_usd: s.p.tvl_usd,
    change_7d: s.p.change_7d,
    mcap_usd: s.p.mcap_usd,
    listed_at: s.p.listed_at,
    gecko_id: s.p.gecko_id,
    symbol: s.p.symbol,
    token_status: 'pre-token',
    age_days: s.age,
    implied_value_usd: s.implied,
    model: {
      base_multiple: s.baseMultiple,
      category_median: s.categoryMedian,
      category_live_n: s.categoryN,
      growth_pct: s.growthPct,
      growth_multiplier: round4(s.growthMult),
      maturity_multiplier: round4(s.maturityMult),
      breadth_multiplier: round4(s.breadthMult),
      age_days: s.age,
    },
    farm_steps: farmSteps(s.p, s.age).map(stepText),
  }));
}

const round4 = (n: number): number => Math.round(n * 1e4) / 1e4;

/** A step as one string: its action, then its cost and time, within the gate's 20..600 characters. */
export function stepText(step: FarmStep): string {
  let s = `${step.text} Cost: ${step.cost}. Time: ${step.time}.`;
  if (s.length > 600) s = `${s.slice(0, 596)}...`;
  if (s.length < 20) s = `${s} Hold the position and check the protocol's own page.`;
  return s;
}

/** The first chain a protocol names, or a neutral phrase. */
function chainOf(p: SnapshotProtocol): string {
  return p.chains.length > 0 ? p.chains[0]! : 'its main chain';
}

/** Typical gas for one transaction on a chain, from the chain's own fee market (not the protocol). */
function gasFor(chain: string): string {
  const c = chain.toLowerCase();
  if (c === 'ethereum') return 'about $12 of gas';
  if (c === 'solana') return 'about $0.10 of gas';
  if (c === 'base' || c === 'arbitrum' || c === 'optimism' || c === 'blast' || c === 'mode') return 'about $1 of gas';
  if (c === 'binance' || c === 'bnb chain' || c === 'polygon' || c === 'avalanche') return 'about $0.50 of gas';
  return 'about $2 of gas';
}

/** How much capital one farm position needs, from the protocol's own TVL. */
function capitalFor(p: SnapshotProtocol): number {
  if (p.tvl_usd >= 5_000_000_000) return 300;
  if (p.tvl_usd >= 1_000_000_000) return 200;
  if (p.tvl_usd >= 100_000_000) return 120;
  return 60;
}

/** How long to hold, from the protocol's age: younger protocols need a longer qualifying window. */
function holdDaysFor(age: number | null): number {
  if (age === null) return 45;
  if (age < 180) return 60;
  if (age < 365) return 45;
  if (age < 720) return 30;
  return 21;
}

/** The category group a protocol's farm plan follows, from its DefiLlama category only. */
function groupOf(p: SnapshotProtocol): string {
  const c = (p.category ?? '').toLowerCase();
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral') || c.includes('borrow')) return 'lending';
  if (c.includes('bridge') || c.includes('cross chain')) return 'bridge';
  if (c.includes('staking') || c.includes('restak')) return 'staking';
  if (c.includes('perpetual') || c.includes('derivative') || c.includes('options') || c.includes('synthetic')) return 'perps';
  if (c.includes('prediction') || c.includes('betting')) return 'prediction';
  if (c.includes('rwa') || c.includes('real world')) return 'rwa';
  if (c.includes('stable')) return 'stable';
  if (c.includes('curator') || c.includes('allocator') || c.includes('vault')) return 'curator';
  if (c.includes('insurance')) return 'insurance';
  if (c.includes('dex') || c.includes('yield') || c.includes('leveraged farm') || c.includes('amm')) return 'dex';
  return 'generic';
}

/** The category's main action, in the words a farmer can follow. */
function actionFor(p: SnapshotProtocol, capital: number, chain: string): string {
  const name = p.name;
  switch (groupOf(p)) {
    case 'lending':
      return `Supply $${capital} of USDC to ${name} on ${chain}, then borrow $20 of USDC against it so both sides of the position are active.`;
    case 'bridge':
      return `Bridge $${capital} of USDC to ${chain} through ${name}, then use the bridged funds in one app on the destination chain.`;
    case 'staking':
      return `Stake $${capital} of the chain's staking asset through ${name} on ${chain} and keep the receipt token in the same wallet.`;
    case 'perps':
      return `Deposit $${capital} of USDC as margin on ${name} on ${chain} and open one small long and one small short hedge, $25 each.`;
    case 'prediction':
      return `Fund $${capital} on ${name} and place one $25 position on a market that settles at least 7 days out.`;
    case 'rwa':
      return `Mint $${capital} of the protocol's yield-bearing asset on ${chain} through ${name} and hold it in the farming wallet.`;
    case 'stable':
      return `Mint or deposit $${capital} of the stable asset through ${name} on ${chain} and keep it in the farming wallet.`;
    case 'curator':
      return `Deposit $${capital} into a ${name} vault on ${chain} and keep the vault shares for the whole hold period.`;
    case 'insurance':
      return `Buy $${capital} of cover from ${name} on ${chain} and keep the policy active for the whole hold period.`;
    case 'dex':
      return `Provide $${capital} of liquidity to ${name}'s main pool on ${chain} in a $30-$30 split, then swap $20 through the pool.`;
    default:
      return `Deposit $${capital} of USDC into ${name} on ${chain} and complete one full action inside its app.`;
  }
}

/** The category's second qualifying action, different from the first, so the wallet shows repeat use. */
function secondActionFor(p: SnapshotProtocol, capital: number, chain: string): string {
  const name = p.name;
  switch (groupOf(p)) {
    case 'lending':
      return `Repay half the $20 borrow, then borrow $10 again, so the wallet shows a second borrow event on ${name}.`;
    case 'bridge':
      return `Bridge $25 back through ${name} to the chain you started on, keeping the round trip inside one week.`;
    case 'staking':
      return `Claim or compound the staking rewards ${name} shows for your position, even if the amount is under $1.`;
    case 'perps':
      return `Close the smaller hedge on ${name} and open a fresh $25 position in the opposite direction.`;
    case 'prediction':
      return `Place a second $10 position on a different ${name} market, so the wallet holds two settled markets.`;
    case 'rwa':
      return `Claim the yield ${name} accrued on your $${capital} position and redeposit it in the same asset.`;
    case 'stable':
      return `Swap $25 of the stable asset back to USDC through ${name} and deposit it again the same week.`;
    case 'curator':
      return `Move $25 between two ${name} vaults on ${chain} so the wallet shows a second vault interaction.`;
    case 'insurance':
      return `File a test quote for a second cover amount on ${name} and keep the first policy untouched.`;
    case 'dex':
      return `Swap $20 of one pool asset for the other through ${name} on ${chain} and add the proceeds back to the pool.`;
    default:
      return `Use a second feature of ${name} on ${chain} for $25, such as a swap, a vote or a second deposit.`;
  }
}

/**
 * A protocol's farm plan: seven steps, each an action with a cost and a time. The plan is
 * derived from the protocol's own record (category, chains, TVL, age), never from a
 * hand-written list of names. Gas follows the chain, capital follows TVL, the hold
 * follows age, and the two actions follow the category.
 */
export function farmSteps(p: SnapshotProtocol, age: number | null): FarmStep[] {
  const chain = chainOf(p);
  const gas = gasFor(chain);
  const capital = capitalFor(p);
  const hold = holdDaysFor(age);
  const weeks = Math.max(3, Math.ceil(hold / 7));
  return [
    {
      text: `Use a fresh wallet that holds only the funds you plan to farm, fund it with $${capital} of USDC plus $15 for gas on ${chain}, and keep its seed phrase offline.`,
      cost: `${gas} for the funding transaction`,
      time: '10 minutes',
    },
    {
      text: actionFor(p, capital, chain),
      cost: `$${capital} of capital and ${gas}`,
      time: '15 minutes to set up',
    },
    {
      text: secondActionFor(p, capital, chain),
      cost: `about $25 of the position plus ${gas}`,
      time: '10 minutes',
    },
    {
      text: `Repeat one qualifying action each week for ${weeks} weeks, such as a deposit, a borrow, a swap or a vote, and never let the position fall below $${Math.round(capital / 2)}.`,
      cost: `${gas} a week`,
      time: '10 minutes a week',
    },
    {
      text: `Hold the position for at least ${hold} days so the activity is counted in more than one snapshot, and check the protocol’s own points or rewards page once a week.`,
      cost: `the $${capital} stays in the position`,
      time: `${hold} days`,
    },
    {
      text: `Before you withdraw, open the points page from the protocol’s own site only and claim only from the link it publishes; never pay a fee to claim and never connect to a link from a message.`,
      cost: 'no fee to check',
      time: '10 minutes',
    },
    {
      text: `Write the wallet, the dates and every transaction hash in a farm log, then unwind in two halves a day apart once the claim window closes.`,
      cost: gas,
      time: '15 minutes to unwind',
    },
  ];
}

/** The live-token protocols, by market cap, for the dashboard's Live token view. */
export function liveRows(snapshot: Snapshot): LiveRow[] {
  return snapshot.protocols
    .filter((p) => !isPreToken(p) && p.category !== 'CEX')
    .sort((a, b) => (b.mcap_usd ?? 0) - (a.mcap_usd ?? 0) || b.tvl_usd - a.tvl_usd)
    .slice(0, LIVE_ROWS)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      chains: p.chains,
      tvl_usd: p.tvl_usd,
      mcap_usd: p.mcap_usd,
      change_7d: p.change_7d,
      mcap_tvl_ratio: p.mcap_usd !== null && p.tvl_usd > 0 ? Math.round((p.mcap_usd / p.tvl_usd) * 1000) / 1000 : null,
    }));
}

/** A board row's compact form for data.js, with the farm plan generated in the page. */
export function radarRow(row: BoardRow): RadarRow {
  return {
    rank: row.rank,
    slug: row.slug,
    name: row.name,
    category: row.category,
    chains: row.chains,
    tvl_usd: row.tvl_usd,
    change_7d: row.change_7d,
    mcap_usd: row.mcap_usd,
    listed_at: row.listed_at,
    age_days: row.age_days,
    implied_value_usd: row.implied_value_usd,
    base_multiple: row.model.base_multiple,
    growth_multiplier: row.model.growth_multiplier,
    maturity_multiplier: row.model.maturity_multiplier,
    breadth_multiplier: row.model.breadth_multiplier,
  };
}

/** Everything the dashboard renders, from the snapshot. */
export function buildRadar(snapshot: Snapshot, model: ModelConstants = MODEL): { board: BoardRow[]; radar: RadarData } {
  const board = buildBoard(snapshot, model);
  const calibration = calibrate(snapshot, model);
  const live = liveRows(snapshot);
  const early = board.filter((r) => !snapshot.watchlist.includes(r.slug)).length;
  const radar: RadarData = {
    as_of: snapshot.as_of,
    source: snapshot.source,
    floor_usd: snapshot.floor_usd,
    model,
    model_version: MODEL_VERSION,
    calibration,
    watchlist_size: snapshot.watchlist.length,
    watchlist: [...snapshot.watchlist],
    board_size: board.length,
    early_size: early,
    live_size: live.length,
    rows: board.map(radarRow),
    live,
  };
  return { board, radar };
}

/** The snapshot out of a file's text, refused unless it is the shape the model scores. */
export function parseSnapshot(text: string): Snapshot {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new SnapshotError('snapshot.json is not JSON');
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new SnapshotError('snapshot.json is not a JSON object');
  const o = raw as Record<string, unknown>;
  if (typeof o.as_of !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.as_of)) throw new SnapshotError('snapshot.json has no as_of date');
  if (typeof o.source !== 'string') throw new SnapshotError('snapshot.json has no source');
  if (typeof o.floor_usd !== 'number' || !Number.isSafeInteger(o.floor_usd) || o.floor_usd <= 0) throw new SnapshotError('snapshot.json has no floor_usd');
  if (!Array.isArray(o.protocols)) throw new SnapshotError('snapshot.json has no protocols array');
  if (!Array.isArray(o.watchlist) || o.watchlist.some((s) => typeof s !== 'string')) throw new SnapshotError('snapshot.json has no watchlist of slugs');
  const protocols = o.protocols.map((v, i) => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new SnapshotError(`snapshot.json's protocol ${i} is not an object`);
    const p = v as Record<string, unknown>;
    if (typeof p.slug !== 'string' || typeof p.name !== 'string' || typeof p.tvl_usd !== 'number' || !Number.isFinite(p.tvl_usd)) {
      throw new SnapshotError(`snapshot.json's protocol ${i} lacks a slug, a name or a TVL`);
    }
    return {
      slug: p.slug,
      name: p.name,
      category: typeof p.category === 'string' ? p.category : null,
      chains: Array.isArray(p.chains) ? p.chains.filter((c): c is string => typeof c === 'string') : [],
      tvl_usd: p.tvl_usd,
      change_7d: typeof p.change_7d === 'number' && Number.isFinite(p.change_7d) ? p.change_7d : null,
      mcap_usd: typeof p.mcap_usd === 'number' && Number.isFinite(p.mcap_usd) ? p.mcap_usd : null,
      listed_at: typeof p.listed_at === 'string' ? p.listed_at : null,
      gecko_id: typeof p.gecko_id === 'string' ? p.gecko_id : null,
      symbol: typeof p.symbol === 'string' ? p.symbol : null,
    };
  });
  return {
    as_of: o.as_of,
    source: o.source,
    floor_usd: o.floor_usd,
    protocols,
    watchlist: o.watchlist as string[],
  };
}

/** Why a board is not one the gate will take, or null: coverage, ranks, order, one shared implied value, and farm steps. */
export function boardIssue(board: BoardRow[], snapshot: Snapshot): string | null {
  const slugs = new Set(board.map((r) => r.slug));
  const missing = snapshot.watchlist.filter((s) => !slugs.has(s));
  if (missing.length > 0) return `the board misses ${missing.length} watchlist slug${missing.length === 1 ? '' : 's'}: ${missing.slice(0, 5).join(', ')}`;
  const ranks = board.map((r) => r.rank).sort((a, b) => a - b);
  for (let i = 0; i < ranks.length; i++) if (ranks[i] !== i + 1) return `rank ${i + 1} is ${ranks[i]}`;
  for (let i = 1; i < board.length; i++) if (board[i]!.implied_value_usd > board[i - 1]!.implied_value_usd) return `row ${i + 1} outranks row ${i} on implied value`;
  if (board.length >= 2 && board[0]!.implied_value_usd === board[board.length - 1]!.implied_value_usd) {
    return `all ${board.length} rows share the same implied value $${board[0]!.implied_value_usd}: a board that ranks nothing by value is not a ranking`;
  }
  for (const r of board) {
    const steps = r.farm_steps;
    if (steps.length < 3 || steps.length > 12) return `${r.slug} has ${steps.length} farm steps`;
    for (const s of steps) if (s.length < 20 || s.length > 600) return `${r.slug} has a farm step of ${s.length} characters`;
    if (!Number.isSafeInteger(r.implied_value_usd) || r.implied_value_usd <= 0) return `${r.slug} has implied value ${r.implied_value_usd}`;
  }
  return null;
}

/** A compact data.js: the dashboard's whole dataset as one script, no fetch and no network. */
export function dataScript(radar: RadarData): string {
  return `window.RADAR=${JSON.stringify(radar)};\n`;
}
