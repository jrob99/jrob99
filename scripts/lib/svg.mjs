// Shared helpers for the profile graphics. No dependencies.
// Every graphic is plain SVG, so it renders inside a GitHub README <img>.

export const SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif";
export const MONO =
  "ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace";

export const THEMES = {
  dark: {
    name: "dark",
    bg0: "#0b1020",
    bg1: "#0a0d18",
    card: "#0d1322",
    cardHi: "#111a2e",
    inset: "#0a101d",
    border: "#1f2b49",
    text: "#e8eefb",
    sub: "#a3b3cf",
    dim: "#6b7c9c",
    faint: "#26334f",
    track: "#19233b",
    cyan: "#22d3ee",
    violet: "#8b5cf6",
    pink: "#f472b6",
    green: "#34d399",
    red: "#fb7185",
    amber: "#fbbf24",
    dotGrid: 0.5,
    glow: 0.6,
  },
  light: {
    name: "light",
    bg0: "#ffffff",
    bg1: "#f1f5fd",
    card: "#ffffff",
    cardHi: "#f6f8fc",
    inset: "#f3f6fb",
    border: "#d3dbea",
    text: "#101828",
    sub: "#475467",
    dim: "#75839b",
    faint: "#dfe6f2",
    track: "#e6ebf5",
    cyan: "#0891b2",
    violet: "#7c3aed",
    pink: "#db2777",
    green: "#059669",
    red: "#e11d48",
    amber: "#d97706",
    dotGrid: 0.9,
    glow: 0.3,
  },
};

export const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Short number string: at most `d` decimals, no trailing zeros. */
export const r = (v, d = 2) => String(Number(Number(v).toFixed(d)));

/** Deterministic pseudo-random generator, so static art is stable between builds. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Pixel fonts. Each glyph is a list of rows; "#" is a lit pixel.
// ---------------------------------------------------------------------------

/** Thin 5x7 font for small labels. */
export const FONT5 = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["###", ".#.", ".#.", ".#.", ".#.", ".#.", "###"],
  J: ["....#", "....#", "....#", "....#", "#...#", "#...#", ".###."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  0: [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  1: [".#.", "##.", ".#.", ".#.", ".#.", ".#.", "###"],
  2: [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  3: [".###.", "#...#", "....#", "..##.", "....#", "#...#", ".###."],
  4: ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  5: ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  6: [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  7: ["#####", "....#", "...#.", "..#..", "..#..", "..#..", "..#.."],
  8: [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  9: [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  " ": ["...", "...", "...", "...", "...", "...", "..."],
  ".": [".", ".", ".", ".", ".", ".", "#"],
  "-": ["....", "....", "....", "####", "....", "....", "...."],
  ":": [".", ".", "#", ".", "#", ".", "."],
  "!": ["#", "#", "#", "#", "#", ".", "#"],
  ">": ["#...", ".#..", "..#.", "...#", "..#.", ".#..", "#..."],
  "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."],
};

/** Bold 7x7 arcade font for the wordmark. Only the glyphs in use are defined. */
export const FONT7 = {
  J: [".....##", ".....##", ".....##", ".....##", "##...##", "##...##", ".#####."],
  R: ["######.", "##...##", "##...##", "##..###", "#####..", "##.###.", "##..###"],
  O: [".#####.", "##...##", "##...##", "##...##", "##...##", "##...##", ".#####."],
  B: ["######.", "##...##", "##...##", "######.", "##...##", "##...##", "######."],
  9: [".#####.", "##...##", "##...##", ".######", ".....##", "....##.", ".####.."],
};

export const HEART = [".##.##.", "#######", "#######", ".#####.", "..###..", "...#..."];
export const COIN = ["..###..", ".#####.", "###.###", "###.###", "###.###", ".#####.", "..###.."];

/** Lit cells of a string, in cell units. Returns { cells: [[col,row]], cols, rows }. */
export function layout(str, font, spacing = 1) {
  const cells = [];
  let col = 0;
  let rows = 0;
  for (const ch of str) {
    const g = font[ch] ?? font[ch.toUpperCase()];
    if (!g) throw new Error(`pixel font has no glyph for "${ch}"`);
    rows = Math.max(rows, g.length);
    g.forEach((line, y) => {
      for (let x = 0; x < line.length; x++) if (line[x] === "#") cells.push([col + x, y]);
    });
    col += g[0].length + spacing;
  }
  return { cells, cols: Math.max(0, col - spacing), rows };
}

/** Width in px of a pixel string at a given cell size. */
export const pixelWidth = (str, cell, font = FONT5, spacing = 1) =>
  layout(str, font, spacing).cols * cell;

/**
 * Solid pixel text as ONE path (no seams between pixels).
 * anchor: "start" | "middle" | "end".
 */
export function pixelText(str, { x = 0, y = 0, cell = 2, font = FONT5, anchor = "start", fill, attrs = "" }) {
  const { cells, cols } = layout(str, font);
  const w = cols * cell;
  const x0 = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  // Merge horizontal runs so the path stays small.
  const byRow = new Map();
  for (const [cx, cy] of cells) {
    if (!byRow.has(cy)) byRow.set(cy, []);
    byRow.get(cy).push(cx);
  }
  let d = "";
  for (const [cy, xs] of byRow) {
    xs.sort((a, b) => a - b);
    let start = xs[0];
    let prev = xs[0];
    const flush = () => {
      const len = (prev - start + 1) * cell;
      d += `M${r(x0 + start * cell)} ${r(y + cy * cell)}h${r(len)}v${r(cell)}h${r(-len)}z`;
    };
    for (let i = 1; i < xs.length; i++) {
      if (xs[i] === prev + 1) prev = xs[i];
      else {
        flush();
        start = prev = xs[i];
      }
    }
    flush();
  }
  return `<path d="${d}"${fill ? ` fill="${fill}"` : ""}${attrs ? " " + attrs : ""}/>`;
}

/** A sprite (HEART, COIN) as one path. */
export function sprite(rows, { x = 0, y = 0, cell = 2, fill, attrs = "" }) {
  let d = "";
  rows.forEach((line, cy) => {
    for (let cx = 0; cx < line.length; cx++)
      if (line[cx] === "#") d += `M${r(x + cx * cell)} ${r(y + cy * cell)}h${r(cell)}v${r(cell)}h${r(-cell)}z`;
  });
  return `<path d="${d}"${fill ? ` fill="${fill}"` : ""}${attrs ? " " + attrs : ""}/>`;
}

/** LED-style text: one rounded rect per pixel, with a gap between pixels. */
export function ledText(str, { x = 0, y = 0, cell = 12, gap = 1.5, rx = 2, font = FONT7 }) {
  const { cells, cols, rows } = layout(str, font);
  const size = cell - gap;
  const rects = cells
    .map(([cx, cy]) => `<rect x="${r(x + cx * cell)}" y="${r(y + cy * cell)}" width="${r(size)}" height="${r(size)}" rx="${rx}"/>`)
    .join("");
  return { rects, width: cols * cell - gap, height: rows * cell - gap };
}

/** Rough width of proportional (sans) text, in px. Errs on the wide side. */
export function sansWidth(str, size, bold = false) {
  let em = 0;
  for (const ch of str) {
    if ("iljtf.,:;'|!()[] ".includes(ch)) em += 0.31;
    else if ("mwMW@%".includes(ch)) em += 0.9;
    else if (/[A-Z0-9$#&?]/.test(ch)) em += 0.68;
    else em += 0.56;
  }
  return em * size * (bold ? 1.06 : 1);
}

/** Cut text so its estimated width fits `max` px. */
export function fitSans(str, size, max, bold = false) {
  if (sansWidth(str, size, bold) <= max) return str;
  let out = str;
  while (out.length > 1 && sansWidth(out + "…", size, bold) > max) out = out.slice(0, -1);
  return out.replace(/[\s.,:;-]+$/, "") + "…";
}

export function svgOpen({ w, h, title, desc }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t d"><title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc>`;
}
