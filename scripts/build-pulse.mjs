// Builds the two live cards into dist/: prediction-market odds and crypto spot prices.
// Public, keyless data only. Run: node scripts/build-pulse.mjs
//
// If a data source fails, the previous card in dist/ is kept, so the README never
// shows a broken image. A placeholder is written only when no card exists yet.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MONO, SANS, THEMES, esc, fitSans, r, svgOpen } from "./lib/svg.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "dist");
const UA = "Mozilla/5.0 (compatible; profile-readme-bot/1.0)";
const GAMMA = "https://gamma-api.polymarket.com";
const COINBASE = "https://api.exchange.coinbase.com";

const W = 412;
const H = 272;
const CRYPTO_ROWS = 3;
const TOTAL_ROWS = 5;

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function getJson(url, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      last = err;
      if (i < tries - 1) await sleep(1500 * (i + 1));
    }
  }
  throw new Error(`${new URL(url).host}: ${last?.message ?? "request failed"}`);
}

// ---------------------------------------------------------------------------
// Text hygiene. Market text comes from an outside service, so treat it as data:
// keep plain printable characters only, and skip topics that do not belong here.
// ---------------------------------------------------------------------------

const clean = (s) =>
  String(s ?? "")
    .replace(/[^\x20-\x7E¡-ɏ–—‘’“”…]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const BLOCKED =
  /\b(kill\w*|dead|death|die|dies|assassinat\w*|murder\w*|war|nuke\w*|nuclear|terror\w*|shoot\w*|bomb\w*|suicide|rape\w*|hostage\w*|invad\w*|invasion|genocide|massacre|porn\w*|nazi\w*)\b/i;

const MONTHS = /\b(January|February|March|April|June|July|August|September|October|November|December)\b/g;
const VERBS = {
  dip: "dips", reach: "reaches", hit: "hits", launch: "launches", close: "closes", move: "moves",
  fall: "falls", rise: "rises", flip: "flips", drop: "drops", trade: "trades", go: "goes",
};

/** "Will Bitcoin dip to $70,000 in November?" -> "Bitcoin dips to $70,000 in Nov" */
function headline(question) {
  let s = clean(question).replace(/\?+$/, "");
  s = s.replace(/^Will the price of /i, "").replace(/^Will /i, "");
  s = s.replace(/\bbe (above|below|between|over|under)\b/i, "$1");
  s = s.replace(new RegExp(` (${Object.keys(VERBS).join("|")}) `), (_, v) => ` ${VERBS[v]} `);
  s = s.replace(MONTHS, (m) => m.slice(0, 3)).replace(/, 20\d\d\b/g, "");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const TICKERS = [
  [/\b(bitcoin|btc)\b/i, "BTC"], [/\b(ethereum|eth)\b/i, "ETH"], [/\b(solana|sol)\b/i, "SOL"],
  [/\bxrp\b/i, "XRP"], [/\b(dogecoin|doge)\b/i, "DOGE"], [/\bhyperliquid\b/i, "HYPE"],
  [/\bbnb\b/i, "BNB"], [/\bcardano\b/i, "ADA"], [/\bsui\b/i, "SUI"], [/\bchainlink\b/i, "LINK"],
];
const GAMES = [
  [/^dota/i, "DOTA"], [/^(lol|league of legends)/i, "LOL"], [/^(counter-strike|cs2?\b)/i, "CS2"],
  [/^valorant/i, "VAL"], [/^(call of duty|cod\b)/i, "COD"], [/^rocket league/i, "RL"],
  [/^overwatch/i, "OW"], [/^(rainbow six|r6\b)/i, "R6"], [/^mobile legends/i, "MLBB"],
  [/^honor of kings/i, "HOK"], [/^starcraft/i, "SC2"], [/^pubg/i, "PUBG"], [/^apex/i, "APEX"],
];

function parseMarket(m) {
  if (!m || !m.active || m.closed) return null;
  let outcomes, prices;
  try {
    outcomes = JSON.parse(m.outcomes).map(clean);
    prices = JSON.parse(m.outcomePrices).map(Number);
  } catch {
    return null;
  }
  if (outcomes.length !== 2 || prices.length !== 2 || prices.some((p) => !(p >= 0 && p <= 1))) return null;
  const question = clean(m.question);
  if (!question || BLOCKED.test(question)) return null;
  const yesNo = /^yes$/i.test(outcomes[0]) && /^no$/i.test(outcomes[1]);
  const lead = yesNo || prices[0] >= prices[1] ? 0 : 1;
  return {
    question,
    outcomes,
    outcome: yesNo ? "YES" : outcomes[lead],
    p: prices[lead],
    balance: 1 - 2 * Math.abs(prices[0] - 0.5), // 1 = coin flip, 0 = settled
    vol: Number(m.volume24hr) || 0,
    yesNo,
  };
}

const contested = (m) => m.balance >= 0.12; // odds between 6% and 94%

async function cryptoRows(limit) {
  const events = await getJson(
    `${GAMMA}/events?active=true&closed=false&archived=false&tag_slug=crypto&order=volume24hr&ascending=false&limit=40`,
  );
  const rows = [];
  const seen = new Set();
  for (const ev of events) {
    const title = clean(ev.title);
    if (BLOCKED.test(title)) continue;
    const ticker = TICKERS.find(([re]) => re.test(title))?.[1];
    const family = ticker ?? ev.slug;
    if (seen.has(family)) continue;
    const best = (ev.markets ?? [])
      .map(parseMarket)
      .filter((m) => m && m.vol > 0 && contested(m))
      .sort((a, b) => b.vol * (0.35 + b.balance) - a.vol * (0.35 + a.balance))[0];
    if (!best) continue;
    seen.add(family);
    rows.push({ kind: "crypto", badge: ticker ?? "CRYPTO", label: headline(best.question), ...best });
    if (rows.length >= limit) break;
  }
  return rows;
}

async function esportsRows(limit) {
  const events = await getJson(
    `${GAMMA}/events?active=true&closed=false&archived=false&tag_slug=esports&order=volume24hr&ascending=false&limit=30`,
  );
  const rows = [];
  for (const ev of events) {
    const title = clean(ev.title);
    if (BLOCKED.test(title) || !/ vs\.? /i.test(title)) continue;
    const best = (ev.markets ?? [])
      .map((m) => {
        const p = parseMarket(m);
        if (!p || p.yesNo || !contested(p) || p.vol <= 0) return null;
        if (/^(over|under)$/i.test(p.outcomes[0])) return null;
        return { ...p, score: p.vol * (clean(m.question) === title ? 2 : 1) };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)[0];
    if (!best) continue;
    const badge = GAMES.find(([re]) => re.test(title))?.[1] ?? "GG";
    // "LoL: Team A vs Team B (BO5) - Worlds Playoffs" -> "Team A vs Team B"
    let label = best.question.replace(/\s+\((BO|Bo)\d\).*$/, "").replace(/\s+-\s+.*$/, "");
    label = label.replace(/^[^:]{2,22}:\s+/, "");
    const game = best.question.match(/Game (\d) Winner/i);
    if (game) label += ` (game ${game[1]})`;
    rows.push({ kind: "esports", badge, label, ...best });
    if (rows.length >= limit) break;
  }
  return rows;
}

const COINS = [
  { id: "BTC-USD", ticker: "BTC", name: "Bitcoin", accent: "amber" },
  { id: "ETH-USD", ticker: "ETH", name: "Ethereum", accent: "violet" },
  { id: "SOL-USD", ticker: "SOL", name: "Solana", accent: "cyan" },
  { id: "POL-USD", ticker: "POL", name: "Polygon", accent: "pink" },
];

async function coinRows() {
  const rows = [];
  for (const c of COINS) {
    try {
      const [stats, candles] = await Promise.all([
        getJson(`${COINBASE}/products/${c.id}/stats`),
        getJson(`${COINBASE}/products/${c.id}/candles?granularity=3600`),
      ]);
      const last = Number(stats.last);
      const open = Number(stats.open);
      if (!(last > 0) || !(open > 0) || !Array.isArray(candles)) throw new Error("bad payload");
      // Candle = [time, low, high, open, close, volume], newest first.
      const closes = candles.slice(0, 24).reverse().map((k) => Number(k[4])).filter((v) => v > 0);
      closes.push(last);
      rows.push({ ...c, last, change: last / open - 1, closes });
    } catch (err) {
      console.log(`::warning::${c.ticker} skipped (${err.message})`);
    }
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const usd = (v) =>
  v >= 10_000
    ? `$${Math.round(v).toLocaleString("en-US")}`
    : v >= 1
      ? `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `$${v.toFixed(4)}`;
const compact = (v) =>
  v >= 1e6 ? `$${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1)}M` : v >= 1e3 ? `$${Math.round(v / 1e3)}K` : `$${Math.round(v)}`;
const pct = (p) => (p < 0.01 ? "<1%" : p > 0.99 ? ">99%" : `${Math.round(p * 100)}%`);
const stamp = (d) =>
  `${d.getUTCDate()} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()]} ` +
  `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} UTC`;

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

function frame(T, { title, desc, heading, footLeft, footRight, body, css = "", defs = "" }) {
  const dark = T.name === "dark";
  return `${svgOpen({ w: W, h: H, title, desc })}
<style>.s{font-family:${SANS}}.m{font-family:${MONO}}
@keyframes live{0%{transform:scale(1);opacity:.7}100%{transform:scale(3);opacity:0}}
@media (prefers-reduced-motion:no-preference){.live{transform-box:fill-box;transform-origin:center;animation:live 2s ease-out infinite}}
${css}</style>
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.cardHi}"/><stop offset="1" stop-color="${T.card}"/></linearGradient>
<linearGradient id="g1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.cyan}"/><stop offset="1" stop-color="${T.violet}"/></linearGradient>
<linearGradient id="g2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.violet}"/><stop offset="1" stop-color="${T.pink}"/></linearGradient>
<clipPath id="card"><rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16"/></clipPath>
${defs}
</defs>
<g clip-path="url(#card)"><rect width="${W}" height="${H}" fill="url(#bg)"/><rect width="${W}" height="34" fill="${T.inset}" fill-opacity="${dark ? 0.9 : 1}"/></g>
<path d="M0.5 34.5H${W - 0.5}" stroke="${T.border}"/>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16" fill="none" stroke="${T.border}"/>
<circle cx="19" cy="17.5" r="4.3" fill="${T.red}"/><circle cx="33" cy="17.5" r="4.3" fill="${T.amber}"/><circle cx="47" cy="17.5" r="4.3" fill="${T.green}"/>
<text class="m" x="${W / 2}" y="21.5" font-size="11" font-weight="600" text-anchor="middle" fill="${T.sub}">${esc(heading)}</text>
<circle class="live" cx="${W - 20}" cy="17.5" r="3" fill="${T.green}"/><circle cx="${W - 20}" cy="17.5" r="3" fill="${T.green}"/>
<text class="m" x="${W - 30}" y="21" font-size="9.5" text-anchor="end" fill="${T.dim}">hourly</text>
${body}
<text class="m" x="16" y="${H - 12}" font-size="9.5" fill="${T.dim}">${esc(footLeft)}</text>
<text class="m" x="${W - 16}" y="${H - 12}" font-size="9.5" text-anchor="end" fill="${T.dim}">${esc(footRight)}</text>
</svg>`;
}

function marketsCard(T, rows, when) {
  const dark = T.name === "dark";
  const BAR_X = 68, BAR_W = 186;
  const body = rows
    .map((m, i) => {
      const y = 42 + i * 40;
      const a = m.kind === "crypto" ? T.amber : T.pink;
      const label = fitSans(m.label, 12.2, 396 - BAR_X - 50, true);
      const who = m.outcome.length > 15 ? `${m.outcome.slice(0, 14)}…` : m.outcome;
      const fillW = Math.max(5, BAR_W * m.p);
      return `<rect x="16" y="${y + 5}" width="44" height="16" rx="5" fill="${a}" fill-opacity="${dark ? 0.12 : 0.09}" stroke="${a}" stroke-opacity="0.4"/>
<text class="m" x="38" y="${y + 16.2}" font-size="8.6" font-weight="700" text-anchor="middle" fill="${a}">${esc(m.badge)}</text>
<text class="s" x="${BAR_X}" y="${y + 17}" font-size="12.2" font-weight="600" fill="${T.text}">${esc(label)}</text>
<text class="m" x="396" y="${y + 17}" font-size="13" font-weight="700" text-anchor="end" fill="${T.text}">${pct(m.p)}</text>
<rect x="${BAR_X}" y="${y + 25}" width="${BAR_W}" height="5" rx="2.5" fill="${T.track}"/>
<rect class="bar" style="animation-delay:${r(i * 0.09)}s" x="${BAR_X}" y="${y + 25}" width="${r(fillW, 1)}" height="5" rx="2.5" fill="url(#${m.kind === "crypto" ? "g1" : "g2"})"/>
<text class="m" x="396" y="${y + 31}" font-size="9.6" text-anchor="end" fill="${T.dim}">${esc(who)} · ${compact(m.vol)}</text>`;
    })
    .join("\n");
  return frame(T, {
    title: "Hot prediction markets",
    desc: rows.map((m) => `${m.label}: ${m.outcome} ${pct(m.p)}`).join(". ") + ".",
    heading: "polymarket · hot markets",
    footLeft: `updated ${when}`,
    footRight: "crypto + esports · 24h volume",
    css: `@keyframes bar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@media (prefers-reduced-motion:no-preference){.bar{transform-box:fill-box;transform-origin:left center;animation:bar .9s cubic-bezier(.2,.8,.2,1) both}}`,
    body,
  });
}

function pricesCard(T, rows, when) {
  const dark = T.name === "dark";
  const SX = 282, SW = 114, SH = 28;
  const body = rows
    .map((c, i) => {
      const y = 40 + i * 50;
      const a = T[c.accent];
      const up = c.change >= 0;
      const col = up ? T.green : T.red;
      const lo = Math.min(...c.closes), hi = Math.max(...c.closes);
      const span = hi - lo || 1;
      const pts = c.closes.map((v, k) => [SX + (SW * k) / (c.closes.length - 1), y + 11 + SH - ((v - lo) / span) * SH]);
      const line = pts.map(([x, yy], k) => `${k ? "L" : "M"}${r(x, 1)} ${r(yy, 1)}`).join("");
      const [lx, ly] = pts[pts.length - 1];
      const chg = `${Math.abs(c.change * 100).toFixed(2)}%`;
      const chgW = chg.length * 6.6;
      const tri = up ? `M0 5.5L3.6 0L7.2 5.5Z` : `M0 0L3.6 5.5L7.2 0Z`;
      return `<rect x="16" y="${y + 9}" width="32" height="32" rx="9" fill="${a}" fill-opacity="${dark ? 0.13 : 0.09}" stroke="${a}" stroke-opacity="0.45"/>
<text class="m" x="32" y="${y + 29.6}" font-size="13" font-weight="700" text-anchor="middle" fill="${a}">${c.ticker[0]}</text>
<text class="m" x="58" y="${y + 23}" font-size="13.5" font-weight="700" fill="${T.text}">${c.ticker}</text>
<text class="s" x="58" y="${y + 38}" font-size="10.5" fill="${T.dim}">${esc(c.name)}</text>
<text class="m" x="264" y="${y + 23}" font-size="14" font-weight="700" text-anchor="end" fill="${T.text}">${usd(c.last)}</text>
<path d="${tri}" transform="translate(${r(264 - chgW - 11, 1)} ${y + 29.5})" fill="${col}"/>
<text class="m" x="${r(264 - chgW, 1)}" y="${y + 38}" font-size="11" font-weight="600" fill="${col}" textLength="${r(chgW, 1)}" lengthAdjust="spacing">${chg}</text>
<path d="${line}L${r(lx, 1)} ${y + 11 + SH + 5}L${SX} ${y + 11 + SH + 5}Z" fill="url(#${up ? "up" : "dn"})"/>
<path class="spark" d="${line}" pathLength="1" fill="none" stroke="${col}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="${r(lx, 1)}" cy="${r(ly, 1)}" r="2.6" fill="${col}"/>`;
    })
    .join("\n");
  return frame(T, {
    title: "Crypto spot prices",
    desc: rows.map((c) => `${c.ticker} ${usd(c.last)}, ${c.change >= 0 ? "up" : "down"} ${Math.abs(c.change * 100).toFixed(2)}% in 24 hours`).join(". ") + ".",
    heading: "coinbase · spot prices",
    footLeft: `updated ${when}`,
    footRight: "24h change + trend",
    defs: [["up", T.green], ["dn", T.red]]
      .map(([id, c]) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity="${dark ? 0.3 : 0.22}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient>`)
      .join(""),
    css: `.spark{stroke-dasharray:1;stroke-dashoffset:0}@keyframes spark{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@media (prefers-reduced-motion:no-preference){.spark{animation:spark 1.4s ease-out both}}`,
    body,
  });
}

function placeholder(T, heading) {
  return frame(T, {
    title: heading,
    desc: "Data is not available right now.",
    heading,
    footLeft: "waiting for data",
    footRight: "",
    body: `<text class="m" x="${W / 2}" y="${H / 2 + 8}" font-size="12" text-anchor="middle" fill="${T.dim}">no signal yet — next refresh within the hour</text>`,
  });
}

// ---------------------------------------------------------------------------

async function build(name, heading, load, render) {
  const targets = Object.values(THEMES).map((T) => [T, join(OUT, `pulse-${name}-${T.name}.svg`)]);
  try {
    const rows = await load();
    if (!rows.length) throw new Error("no rows");
    const when = stamp(new Date());
    for (const [T, file] of targets) writeFileSync(file, render(T, rows, when).replace(/\n+/g, "\n") + "\n");
    console.log(`pulse-${name}: ${rows.length} rows`);
    for (const row of rows) console.log(`  ${row.badge ?? row.ticker}  ${row.label ?? usd(row.last)}`);
    return true;
  } catch (err) {
    console.log(`::warning::pulse-${name} not refreshed (${err.message})`);
    for (const [T, file] of targets) if (!existsSync(file)) writeFileSync(file, placeholder(T, heading) + "\n");
    return false;
  }
}

mkdirSync(OUT, { recursive: true });
const ok = await Promise.all([
  build("markets", "polymarket · hot markets", async () => {
    const [crypto, esports] = await Promise.all([
      cryptoRows(TOTAL_ROWS),
      esportsRows(TOTAL_ROWS - CRYPTO_ROWS).catch((err) => {
        console.log(`::warning::esports skipped (${err.message})`);
        return [];
      }),
    ]);
    // Three crypto rows + two esports rows; crypto fills any gap.
    return [...crypto.slice(0, TOTAL_ROWS - esports.length), ...esports];
  }, marketsCard),
  build("crypto", "coinbase · spot prices", coinRows, pricesCard),
]);
console.log(ok.every(Boolean) ? "all cards refreshed" : "some cards kept their last good version");
