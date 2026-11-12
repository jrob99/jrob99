// Builds the static profile graphics into assets/: hero, four interest cards, footer.
// Run: node scripts/build-static.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  COIN, FONT7, HEART, MONO, SANS, THEMES,
  esc, ledText, pixelText, pixelWidth, r, rng, sprite, svgOpen,
} from "./lib/svg.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "assets");

// ---------------------------------------------------------------------------
// Hero banner
// ---------------------------------------------------------------------------

const PHRASES = ["prediction markets", "crypto", "coding", "gaming"];

function typingCss({ adv }) {
  const TYPE = 0.07, HOLD = 1.7, DEL = 0.035, GAP = 0.45;
  const steps = []; // [time, revealedChars]
  const slots = []; // [start, end] per phrase
  let t = 0;
  for (const p of PHRASES) {
    const start = t;
    t += GAP;
    for (let k = 1; k <= p.length; k++) { steps.push([t, k]); t += TYPE; }
    t += HOLD;
    for (let k = p.length - 1; k >= 0; k--) { steps.push([t, k]); t += DEL; }
    slots.push([start, t]);
  }
  const total = t;
  const pct = (x) => `${r((x / total) * 100, 3)}%`;
  let css = `@keyframes type{0%{transform:translateX(0)}`;
  for (const [time, k] of steps) css += `${pct(time)}{transform:translateX(${r(k * adv)}px)}`;
  css += `100%{transform:translateX(0)}}`;
  slots.forEach(([a, b], i) => {
    css += `@keyframes ph${i}{0%{opacity:${a === 0 ? 1 : 0}}`;
    if (a !== 0) css += `${pct(a)}{opacity:1}`;
    if (b < total) css += `${pct(b)}{opacity:0}`;
    css += `100%{opacity:0}}`;
  });
  return { css, total };
}

function hero(T) {
  const W = 828, H = 320;
  const dark = T.name === "dark";

  // Wordmark
  const cell = 13.5;
  const probe = ledText("JROB99", { cell, gap: 1.6 });
  const wx = (W - probe.width) / 2;
  const wy = 60;
  const wm = ledText("JROB99", { x: wx, y: wy, cell, gap: 1.6, rx: 2.2, font: FONT7 });

  // Price line across the lower band
  const rand = rng(1999);
  const N = 40, xEnd = 708;
  const pts = [];
  let y = 296;
  for (let i = 0; i <= N; i++) {
    const x = -8 + (xEnd + 8) * (i / N);
    const target = 296 - 54 * Math.pow(i / N, 1.25);
    y += (target - y) * 0.34 + (rand() - 0.5) * 16;
    y = Math.max(238, Math.min(306, y));
    pts.push([x, y]);
  }
  const [ex, ey] = pts[N];
  const line = pts.map(([x, yy], i) => `${i ? "L" : "M"}${r(x, 1)} ${r(yy, 1)}`).join("");
  const area = `${line}L${r(ex, 1)} ${H}L-8 ${H}Z`;

  // HUD
  const hudY = 22, hc = 2;
  const pW = pixelWidth("PLAYER 1", hc);
  const heartsX = 30 + pW + 14;
  const hearts = [0, 1, 2]
    .map((i) => sprite(HEART, { x: heartsX + i * 18, y: hudY + 1, cell: hc, fill: T.pink, attrs: i === 2 ? 'class="hb"' : "" }))
    .join("");
  const lvX = heartsX + 3 * 18 + 10;
  const insW = pixelWidth("INSERT COIN", hc);
  const insX = W - 30 - insW;

  // Stars
  const srand = rng(77);
  let stars = "";
  for (let i = 0; i < 22; i++) {
    const sx = 20 + srand() * (W - 40);
    const sy = 46 + srand() * 170;
    const sr = 0.7 + srand() * 1.1;
    const c = [T.cyan, T.violet, T.pink][i % 3];
    stars += `<circle class="tw" style="animation-delay:-${r(srand() * 4, 2)}s" cx="${r(sx, 1)}" cy="${r(sy, 1)}" r="${r(sr, 2)}" fill="${c}" opacity="${dark ? 0.55 : 0.4}"/>`;
  }

  // Prompt pill with the typing line
  const fs = 16, adv = 9.6;
  const pw = 316, ph = 38, px = (W - pw) / 2, py = 180;
  const tx = px + 24, base = py + 25;
  const typedX = tx + 7 * adv;
  const pillFill = dark ? "#0a1020" : "#ffffff";
  const { css: typeCss, total } = typingCss({ adv });
  const phrases = PHRASES.map(
    (p, i) =>
      `<text class="m ph ph${i}" x="${r(typedX)}" y="${base}" font-size="${fs}" font-weight="600" fill="${T.text}" textLength="${r(p.length * adv)}" lengthAdjust="spacing">${esc(p)}</text>`,
  ).join("");

  const css = `
.m{font-family:${MONO}}
.ph{opacity:0}.ph0{opacity:1}.cover{display:none}
.line{stroke-dasharray:1;stroke-dashoffset:0}
@keyframes blink{0%{opacity:1}50%{opacity:0}100%{opacity:1}}
@keyframes spin{0%{transform:scaleX(1)}50%{transform:scaleX(.1)}100%{transform:scaleX(1)}}
@keyframes tw{0%,100%{opacity:.15}50%{opacity:.9}}
@keyframes draw{0%{stroke-dashoffset:1;opacity:1}17%{stroke-dashoffset:0}94%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}
@keyframes area{0%,13%{opacity:0}26%,94%{opacity:1}100%{opacity:0}}
@keyframes now{0%,16%{opacity:0}19%,94%{opacity:1}100%{opacity:0}}
@keyframes ring{0%{transform:scale(1);opacity:.7}100%{transform:scale(3.4);opacity:0}}
${typeCss}
@media (prefers-reduced-motion:no-preference){
.coin{transform-box:fill-box;transform-origin:center;animation:spin 2.2s ease-in-out infinite}
.ins{animation:blink 1.5s step-end infinite}
.hb{animation:blink 2.4s step-end infinite}
.tw{animation:tw 3.6s ease-in-out infinite}
.line{animation:draw 15s ease-in-out infinite}
.area{animation:area 15s ease-in-out infinite}
.now{animation:now 15s ease-in-out infinite}
.ring{transform-box:fill-box;transform-origin:center;animation:ring 1.9s ease-out infinite}
.cover{display:inline;animation:type ${r(total, 3)}s step-end infinite}
.cur{animation:blink 1.05s step-end infinite}
${PHRASES.map((_, i) => `.ph${i}{animation:ph${i} ${r(total, 3)}s step-end infinite}`).join("")}
}`;

  return `${svgOpen({ w: W, h: H, title: "jrob99", desc: "Into prediction markets, crypto, coding and gaming." })}
<style>${css}</style>
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.bg0}"/><stop offset="1" stop-color="${T.bg1}"/></linearGradient>
<radialGradient id="ga" cx="0.16" cy="0" r="0.75"><stop offset="0" stop-color="${T.violet}" stop-opacity="${dark ? 0.34 : 0.16}"/><stop offset="1" stop-color="${T.violet}" stop-opacity="0"/></radialGradient>
<radialGradient id="gb" cx="0.92" cy="1" r="0.7"><stop offset="0" stop-color="${T.cyan}" stop-opacity="${dark ? 0.26 : 0.16}"/><stop offset="1" stop-color="${T.cyan}" stop-opacity="0"/></radialGradient>
<radialGradient id="gc" cx="0.5" cy="0.36" r="0.5"><stop offset="0" stop-color="${T.pink}" stop-opacity="${dark ? 0.1 : 0.07}"/><stop offset="1" stop-color="${T.pink}" stop-opacity="0"/></radialGradient>
<linearGradient id="brand" gradientUnits="userSpaceOnUse" x1="${r(wx)}" y1="0" x2="${r(wx + wm.width)}" y2="0"><stop offset="0" stop-color="${T.cyan}"/><stop offset="0.52" stop-color="${T.violet}"/><stop offset="1" stop-color="${T.pink}"/></linearGradient>
<linearGradient id="edge" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.cyan}"/><stop offset="0.5" stop-color="${T.violet}"/><stop offset="1" stop-color="${T.pink}"/></linearGradient>
<linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.cyan}" stop-opacity="${dark ? 0.22 : 0.16}"/><stop offset="1" stop-color="${T.cyan}" stop-opacity="0"/></linearGradient>
<linearGradient id="shine" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="84" y2="30" gradientTransform="translate(-400 0)"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="${dark ? 0.9 : 0.95}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/><animateTransform attributeName="gradientTransform" type="translate" values="${r(wx - 160)} 0;${r(wx + wm.width + 80)} 0;${r(wx + wm.width + 80)} 0" keyTimes="0;0.2;1" dur="6.5s" repeatCount="indefinite"/></linearGradient>
<pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="${T.faint}" opacity="${T.dotGrid}"/></pattern>
<clipPath id="card"><rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="20"/></clipPath>
<clipPath id="pill"><rect x="${r(px + 4)}" y="${py + 3}" width="${pw - 8}" height="${ph - 6}" rx="${(ph - 6) / 2}"/></clipPath>
<filter id="glow" x="-10%" y="-45%" width="120%" height="190%"><feGaussianBlur stdDeviation="${dark ? 11 : 8}"/></filter>
<g id="wm">${wm.rects}</g>
</defs>
<g clip-path="url(#card)">
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#dots)"/>
<rect width="${W}" height="${H}" fill="url(#ga)"/>
<rect width="${W}" height="${H}" fill="url(#gb)"/>
<rect width="${W}" height="${H}" fill="url(#gc)"/>
${stars}
<path d="${line}" fill="none" stroke="${T.faint}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="${dark ? 0.9 : 1}"/>
<path class="area" d="${area}" fill="url(#fill)"/>
<path class="line" d="${line}" pathLength="1" fill="none" stroke="url(#edge)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
<g class="now">
<line x1="${r(ex, 1)}" y1="${r(ey, 1)}" x2="${W}" y2="${r(ey, 1)}" stroke="${T.pink}" stroke-width="1" stroke-dasharray="2 5" opacity="0.5"/>
<line x1="${r(ex, 1)}" y1="${r(ey + 8, 1)}" x2="${r(ex, 1)}" y2="${H}" stroke="${T.pink}" stroke-width="1" stroke-dasharray="2 5" opacity="0.4"/>
<circle class="ring" cx="${r(ex, 1)}" cy="${r(ey, 1)}" r="5" fill="${T.pink}"/>
<circle cx="${r(ex, 1)}" cy="${r(ey, 1)}" r="4.2" fill="${T.pink}" stroke="${dark ? "#0b1020" : "#ffffff"}" stroke-width="1.6"/>
<rect x="${r(ex + 16, 1)}" y="${r(ey - 12, 1)}" width="74" height="24" rx="12" fill="${T.pink}"/>
<text class="m" x="${r(ex + 53, 1)}" y="${r(ey + 4.2, 1)}" font-size="12" font-weight="700" text-anchor="middle" fill="${dark ? "#1a0b16" : "#ffffff"}">YES 64¢</text>
</g>
<rect width="${W}" height="3" fill="url(#edge)"/>
${pixelText("PLAYER 1", { x: 30, y: hudY, cell: hc, fill: T.dim })}
${hearts}
${pixelText("LV 99", { x: lvX, y: hudY, cell: hc, fill: T.dim })}
<g class="ins">${pixelText("INSERT COIN", { x: insX, y: hudY, cell: hc, fill: T.amber })}</g>
${sprite(COIN, { x: insX - 24, y: hudY, cell: hc, fill: T.amber, attrs: 'class="coin"' })}
<use href="#wm" fill="url(#brand)" filter="url(#glow)" opacity="${T.glow}"/>
<use href="#wm" fill="url(#brand)"/>
<use href="#wm" fill="url(#shine)"/>
<rect x="${r(px)}" y="${py}" width="${pw}" height="${ph}" rx="${ph / 2}" fill="${pillFill}" stroke="${T.border}"/>
<text class="m" x="${r(tx)}" y="${base}" font-size="${fs}" font-weight="700" fill="${T.cyan}">&gt;</text>
<text class="m" x="${r(tx + 2 * adv)}" y="${base}" font-size="${fs}" fill="${T.dim}" textLength="${r(4 * adv)}" lengthAdjust="spacing">into</text>
${phrases}
<g clip-path="url(#pill)"><g class="cover"><rect x="${r(typedX - 1)}" y="${py + 3}" width="260" height="${ph - 6}" fill="${pillFill}"/><rect class="cur" x="${r(typedX + 2)}" y="${py + 10}" width="8" height="18" rx="1.5" fill="${T.cyan}"/></g></g>
</g>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="20" fill="none" stroke="${T.border}"/>
</svg>`;
}

// ---------------------------------------------------------------------------
// Interest cards
// ---------------------------------------------------------------------------

const iconMarkets = (T, a) => {
  const pts = [[26, 72], [35, 64], [43, 68], [52, 53], [61, 59], [70, 44], [79, 50], [88, 36], [100, 33]];
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join("");
  return {
    css: `
.ch{stroke-dasharray:1;stroke-dashoffset:0}
@keyframes ch{0%{stroke-dashoffset:1}35%,100%{stroke-dashoffset:0}}
@keyframes dot{0%,33%{opacity:0}37%,100%{opacity:1}}
@keyframes rg{0%{transform:scale(1);opacity:.7}100%{transform:scale(3.2);opacity:0}}
@keyframes yes{0%,100%{transform:scaleX(.64)}30%{transform:scaleX(.55)}65%{transform:scaleX(.73)}}
@media (prefers-reduced-motion:no-preference){
.ch{animation:ch 7s ease-in-out infinite}.dt{animation:dot 7s ease-in-out infinite}
.rg{transform-box:fill-box;transform-origin:center;animation:rg 1.9s ease-out infinite}
.yes{animation:yes 7s ease-in-out infinite}}`,
    defs: `<clipPath id="bar"><rect x="24" y="86" width="84" height="9" rx="4.5"/></clipPath>`,
    body: `
<path d="M24 76H108M24 58H108M24 40H108" stroke="${a}" stroke-opacity="0.16" stroke-dasharray="2 4"/>
<path class="ch" d="${d}" pathLength="1" fill="none" stroke="${a}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
<g class="dt"><circle class="rg" cx="100" cy="33" r="3.4" fill="${a}"/><circle cx="100" cy="33" r="3.4" fill="${a}"/></g>
<g clip-path="url(#bar)"><rect x="24" y="86" width="84" height="9" fill="${T.red}"/><rect class="yes" x="24" y="86" width="84" height="9" fill="${T.green}" style="transform-box:fill-box;transform-origin:left center;transform:scaleX(.64)"/></g>
<text class="m" x="24" y="108" font-size="8.5" font-weight="700" fill="${T.green}">YES</text>
<text class="m" x="108" y="108" font-size="8.5" font-weight="700" text-anchor="end" fill="${T.red}">NO</text>`,
  };
};

const iconCrypto = (T, a) => {
  const xs = [24, 55, 86];
  return {
    css: `
@keyframes flip{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.08)}}
@keyframes blk{0%,100%{fill-opacity:.12}12%{fill-opacity:.6}30%{fill-opacity:.12}}
@keyframes run{0%{transform:translateX(0);opacity:0}8%{opacity:1}92%{opacity:1}100%{transform:translateX(62px);opacity:0}}
@media (prefers-reduced-motion:no-preference){
.coin{transform-box:fill-box;transform-origin:center;animation:flip 3s ease-in-out infinite}
.b0{animation:blk 3.6s ease-in-out infinite}.b1{animation:blk 3.6s ease-in-out -2.4s infinite}.b2{animation:blk 3.6s ease-in-out -1.2s infinite}
.run{animation:run 3.6s linear infinite}}`,
    defs: `<linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.name === "dark" ? "#fde68a" : "#fbbf24"}"/><stop offset="1" stop-color="${T.name === "dark" ? "#f59e0b" : "#b45309"}"/></linearGradient>`,
    body: `
<g class="coin"><circle cx="66" cy="45" r="18" fill="url(#cg)"/><circle cx="66" cy="45" r="13" fill="none" stroke="${T.name === "dark" ? "#92400e" : "#78350f"}" stroke-opacity="0.55" stroke-width="1.5"/><path d="M66 36l7 9-7 9-7-9z" fill="${T.name === "dark" ? "#92400e" : "#78350f"}" fill-opacity="0.75"/></g>
<path d="M46 89H55M77 89H86" stroke="${a}" stroke-width="2" stroke-linecap="round" stroke-opacity="0.7"/>
${xs.map((x, i) => `<rect class="b${i}" x="${x}" y="78" width="22" height="22" rx="5.5" fill="${a}" fill-opacity="0.12" stroke="${a}" stroke-opacity="0.65" stroke-width="1.4"/><path d="M${x + 6.5} 86h9M${x + 6.5} 92h5.5" stroke="${a}" stroke-opacity="0.75" stroke-width="1.5" stroke-linecap="round"/>`).join("")}
<circle class="run" cx="35" cy="89" r="2.6" fill="${T.text}" opacity="0"/>`,
  };
};

const iconCode = (T, a) => {
  const rows = [
    [[30, 22, a], [56, 34, T.sub]],
    [[38, 18, T.cyan], [60, 26, T.pink]],
    [[38, 42, T.sub]],
    [[38, 14, T.amber], [56, 24, T.cyan]],
    [[30, 12, a]],
  ];
  const CYCLE = 6.4;
  let kf = "";
  rows.forEach((_, i) => {
    const s = 4 + i * 9, e = s + 8;
    kf += `@keyframes c${i}{0%,${s}%{transform:scaleX(0)}${e}%,94%{transform:scaleX(1)}100%{transform:scaleX(0)}}`;
  });
  return {
    css: `
${kf}
@keyframes cb{0%,49%{opacity:1}50%,100%{opacity:0}}
@media (prefers-reduced-motion:no-preference){
${rows.map((_, i) => `.c${i}{transform-box:fill-box;transform-origin:left center;animation:c${i} ${CYCLE}s steps(8,end) infinite}`).join("")}
.cb{animation:cb 1s linear infinite}}`,
    defs: "",
    body: `
<rect x="22" y="24" width="88" height="84" rx="9" fill="${T.inset}" stroke="${a}" stroke-opacity="0.45"/>
<circle cx="32" cy="34" r="2.5" fill="${T.red}"/><circle cx="40.5" cy="34" r="2.5" fill="${T.amber}"/><circle cx="49" cy="34" r="2.5" fill="${T.green}"/>
<path d="M22.5 43H109.5" stroke="${a}" stroke-opacity="0.3"/>
${rows.map((row, i) => `<g class="c${i}">${row.map(([x, w, c]) => `<rect x="${x}" y="${50 + i * 10.5}" width="${w}" height="5" rx="2.5" fill="${c}"/>`).join("")}</g>`).join("")}
<rect class="cb" x="46" y="${50 + 4 * 10.5 - 1.5}" width="5" height="8" rx="1" fill="${T.text}"/>`,
  };
};

const iconGame = (T, a) => ({
  css: `
@keyframes ba{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes hb{0%,59%{opacity:1}60%,79%{opacity:.2}80%,100%{opacity:1}}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.5px)}}
@media (prefers-reduced-motion:no-preference){
.ba{animation:ba 1.2s ease-in-out infinite}.bb{animation:ba 1.2s ease-in-out -.6s infinite}
.h3{animation:hb 2.6s linear infinite}.pad{animation:bob 3.2s ease-in-out infinite}}`,
  defs: "",
  body: `
${[0, 1, 2].map((i) => sprite(HEART, { x: 41 + i * 18, y: 22, cell: 2, fill: a, attrs: i === 2 ? 'class="h3"' : "" })).join("")}
<g class="pad">
<path d="M44 48h44a22 22 0 0 1 22 22v14a11 11 0 0 1-21 5l-6-11H49l-6 11a11 11 0 0 1-21-5V70a22 22 0 0 1 22-22z" fill="${a}" fill-opacity="0.16" stroke="${a}" stroke-width="1.7" stroke-linejoin="round"/>
<path d="M41 57h6v5h5v6h-5v5h-6v-5h-5v-6h5z" fill="${a}"/>
<rect x="59" y="63" width="7" height="3.4" rx="1.7" fill="${T.dim}"/><rect x="69" y="63" width="7" height="3.4" rx="1.7" fill="${T.dim}"/>
<circle class="ba" cx="86" cy="60" r="4.4" fill="${T.cyan}"/><circle class="bb" cx="96" cy="68" r="4.4" fill="${T.amber}"/>
</g>`,
});

const TILES = [
  {
    key: "markets", accent: "cyan", icon: iconMarkets,
    title: "Prediction markets",
    desc: "Opinions are cheap. Odds have a price.",
    chips: ["odds", "order books", "signals"],
  },
  {
    key: "crypto", accent: "amber", icon: iconCrypto,
    title: "Crypto",
    desc: "Open ledgers and markets that never close.",
    chips: ["on-chain", "wallets", "stablecoins"],
  },
  {
    key: "coding", accent: "violet", icon: iconCode,
    title: "Coding",
    desc: "Automate the boring parts. Ship the rest.",
    chips: ["typescript", "python", "sql"],
  },
  {
    key: "gaming", accent: "pink", icon: iconGame,
    title: "Gaming",
    desc: "One more round. Then one more.",
    chips: ["gg", "1up", "one more round"],
  },
];

function tile(T, def) {
  const W = 412, H = 132;
  const dark = T.name === "dark";
  const a = T[def.accent];
  const icon = def.icon(T, a);
  const CH = 6.3; // advance of the 10.5px mono chip text
  let cx = 136;
  const chips = def.chips
    .map((c) => {
      const tw = c.length * CH;
      const w = tw + 18;
      const s = `<rect x="${r(cx)}" y="84" width="${r(w)}" height="22" rx="11" fill="${a}" fill-opacity="${dark ? 0.12 : 0.08}" stroke="${a}" stroke-opacity="${dark ? 0.34 : 0.4}"/><text class="m" x="${r(cx + 9)}" y="98.6" font-size="10.5" font-weight="600" fill="${a}" textLength="${r(tw)}" lengthAdjust="spacing">${esc(c)}</text>`;
      cx += w + 6;
      return s;
    })
    .join("");
  return `${svgOpen({ w: W, h: H, title: def.title, desc: def.desc })}
<style>.s{font-family:${SANS}}.m{font-family:${MONO}}${icon.css}</style>
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.cardHi}"/><stop offset="1" stop-color="${T.card}"/></linearGradient>
<radialGradient id="ac" cx="0.08" cy="0.1" r="0.9"><stop offset="0" stop-color="${a}" stop-opacity="${dark ? 0.16 : 0.1}"/><stop offset="0.6" stop-color="${a}" stop-opacity="0"/></radialGradient>
<clipPath id="card"><rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16"/></clipPath>
${icon.defs}
</defs>
<g clip-path="url(#card)"><rect width="${W}" height="${H}" fill="url(#bg)"/><rect width="${W}" height="${H}" fill="url(#ac)"/></g>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16" fill="none" stroke="${T.border}"/>
<rect x="12" y="12" width="108" height="108" rx="13" fill="${a}" fill-opacity="${dark ? 0.07 : 0.06}" stroke="${a}" stroke-opacity="${dark ? 0.28 : 0.32}"/>
${icon.body}
<text class="s" x="136" y="40" font-size="17" font-weight="700" fill="${T.text}">${esc(def.title)}</text>
<text class="s" x="136" y="63" font-size="12.5" fill="${T.sub}">${esc(def.desc)}</text>
${chips}
</svg>`;
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

function footer(T) {
  const W = 828, H = 78;
  const dark = T.name === "dark";
  const wave = (amp, L, yBase, phase) => {
    let d = `M${-L} ${H}`;
    for (let x = -L; x <= W + L; x += 6) d += `L${x} ${r(yBase + amp * Math.sin((2 * Math.PI * (x + phase)) / L), 1)}`;
    return `${d}L${W + L} ${H}Z`;
  };
  const layers = [
    { L: 414, amp: 9, y: 44, phase: 0, fill: T.violet, op: dark ? 0.42 : 0.3, dur: 19, dir: -1 },
    { L: 276, amp: 7, y: 52, phase: 80, fill: T.cyan, op: dark ? 0.4 : 0.3, dur: 13, dir: 1 },
    { L: 552, amp: 10, y: 58, phase: 200, fill: T.pink, op: dark ? 0.4 : 0.28, dur: 23, dir: -1 },
  ];
  const css = layers
    .map((l, i) => `@keyframes w${i}{from{transform:translateX(${l.dir < 0 ? 0 : -l.L}px)}to{transform:translateX(${l.dir < 0 ? -l.L : 0}px)}}`)
    .join("");
  return `${svgOpen({ w: W, h: H, title: "GG", desc: "Thanks for visiting." })}
<style>${css}@media (prefers-reduced-motion:no-preference){${layers.map((l, i) => `.w${i}{animation:w${i} ${l.dur}s linear infinite}`).join("")}}</style>
<defs><clipPath id="c"><path d="M0 0H${W}V${H - 20}a20 20 0 0 1-20 20H20a20 20 0 0 1-20-20Z"/></clipPath></defs>
${pixelText("GG - THANKS FOR VISITING", { x: W / 2, y: 6, cell: 2, anchor: "middle", fill: T.dim })}
<g clip-path="url(#c)">${layers.map((l, i) => `<path class="w${i}" d="${wave(l.amp, l.L, l.y, l.phase)}" fill="${l.fill}" fill-opacity="${l.op}"/>`).join("")}</g>
</svg>`;
}

// ---------------------------------------------------------------------------

mkdirSync(OUT, { recursive: true });
const written = [];
for (const T of Object.values(THEMES)) {
  const files = { [`hero-${T.name}.svg`]: hero(T), [`footer-${T.name}.svg`]: footer(T) };
  for (const def of TILES) files[`card-${def.key}-${T.name}.svg`] = tile(T, def);
  for (const [name, svg] of Object.entries(files)) {
    writeFileSync(join(OUT, name), svg.replace(/\n+/g, "\n").trim() + "\n");
    written.push(`${name} (${(Buffer.byteLength(svg) / 1024).toFixed(1)} kB)`);
  }
}
console.log(`assets/: ${written.length} files\n  ${written.join("\n  ")}`);
