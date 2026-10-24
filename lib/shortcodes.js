const fs = require("fs");
const path = require("path");

const IMAGES_DIR = path.join(__dirname, "..", "src", "assets", "images");

/* Lucide icons (ISC licence). Every stroke gets pathLength=1 so CSS can draw it. */
const ICONS = {
  "arrow-right": [["path", { d: "M5 12h14" }], ["path", { d: "m12 5 7 7-7 7" }]],
  "arrow-left": [["path", { d: "M19 12H5" }], ["path", { d: "m12 19-7-7 7-7" }]],
  "arrow-up-right": [["path", { d: "M7 7h10v10" }], ["path", { d: "M7 17 17 7" }]],
  mail: [
    ["rect", { width: "20", height: "16", x: "2", y: "4", rx: "2" }],
    ["path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" }],
  ],
  download: [
    ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }],
    ["polyline", { points: "7 10 12 15 17 10" }],
    ["line", { x1: "12", x2: "12", y1: "15", y2: "3" }],
  ],
  send: [
    ["path", { d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" }],
    ["path", { d: "m21.854 2.147-10.94 10.939" }],
  ],
  sun: [
    ["circle", { cx: "12", cy: "12", r: "4" }],
    ["path", { d: "M12 2v2" }], ["path", { d: "M12 20v2" }],
    ["path", { d: "m4.93 4.93 1.41 1.41" }], ["path", { d: "m17.66 17.66 1.41 1.41" }],
    ["path", { d: "M2 12h2" }], ["path", { d: "M20 12h2" }],
    ["path", { d: "m6.34 17.66-1.41 1.41" }], ["path", { d: "m19.07 4.93-1.41 1.41" }],
  ],
  moon: [["path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" }]],
  menu: [["path", { d: "M4 6h16" }], ["path", { d: "M4 12h16" }], ["path", { d: "M4 18h16" }]],
  "chevron-down": [["path", { d: "m6 9 6 6 6-6" }]],
  x: [["path", { d: "M18 6 6 18" }], ["path", { d: "m6 6 12 12" }]],
  image: [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
    ["circle", { cx: "9", cy: "9", r: "2" }],
    ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" }],
  ],
};

// Directional icons mirror in right-to-left layouts.
const FLIP = new Set(["arrow-right", "arrow-left", "arrow-up-right", "send"]);

const attrs = (obj) =>
  Object.entries(obj).map(([k, v]) => `${k}="${v}"`).join(" ");

const escape = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function icon(name, size = 16, extraClass = "") {
  const els = ICONS[name];
  if (!els) throw new Error(`Unknown icon "${name}"`);
  const cls = ["at-icon", FLIP.has(name) && "at-icon--flip", extraClass].filter(Boolean).join(" ");
  const children = els.map(([tag, a]) => `<${tag} ${attrs({ ...a, pathLength: 1 })}/>`).join("");
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${children}</svg>`;
}

/* Isometric square lattice: rhombus tiles at 30 degrees. Same seed, same tiles. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Default is "lines" (hairlines only). "mixed" adds coral, blue and ink tiles.
function isoPattern({ cols = 10, rows = 14, side = 32, fill = "lines", seed = 7, className = "" } = {}) {
  const w = Math.sqrt(3) * side;
  const h = side;
  const r = rng(seed);
  const tiles = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const cx = (i + (j % 2) * 0.5) * w + w / 2;
      const cy = (j * h) / 2 + h / 2;
      const d = `M${cx.toFixed(1)} ${(cy - h / 2).toFixed(1)}L${(cx + w / 2).toFixed(1)} ${cy.toFixed(1)}L${cx.toFixed(1)} ${(cy + h / 2).toFixed(1)}L${(cx - w / 2).toFixed(1)} ${cy.toFixed(1)}Z`;
      const p = r();
      let tone = "";
      if (fill === "mixed") tone = p < 0.09 ? "coral" : p < 0.2 ? "blue" : p < 0.25 ? "ink" : "";
      tiles.push(`<path d="${d}" class="at-iso__t${tone ? ` at-iso__t--${tone}` : ""}"/>`);
    }
  }
  const vbW = ((cols + 0.5) * w).toFixed(1);
  const vbH = (((rows + 1) * h) / 2).toFixed(1);
  return `<svg class="at-iso ${className}" viewBox="0 0 ${vbW} ${vbH}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${tiles.join("")}</svg>`;
}


/*
  Cube columns (iso-structural style): a staircase of n columns that grow by one unit each.
  Columns 1..current are solid; the rest are outline only (relief). With accent, the last
  column uses the coral palette. Fills come from the --iso-* tokens, so both themes work.
*/
function isoCols({ n = 5, current = n, s = 12, accent = false, className = "" } = {}) {
  const dx = (s * Math.sqrt(3)) / 2;
  const dy = s / 2;
  const f = (v) => v.toFixed(2);
  const P = (...p) => p.map(([x, y]) => `${f(x)},${f(y)}`).join(" ");
  const gy = n * s + dy;
  let out = "";
  for (let k = 1; k <= n; k++) {
    const cx = dx + (k - 1) * 2 * dx;
    const H = k * s;
    const cy = gy - H;
    const top = P([cx, cy - dy], [cx + dx, cy], [cx, cy + dy], [cx - dx, cy]);
    const left = P([cx - dx, cy], [cx, cy + dy], [cx, gy + dy], [cx - dx, gy]);
    const right = P([cx + dx, cy], [cx, cy + dy], [cx, gy + dy], [cx + dx, gy]);
    if (k > current) {
      out += `<g class="iso-col iso-col--ghost"><polygon points="${left}"/><polygon points="${right}"/><polygon points="${top}"/></g>`;
      continue;
    }
    const tone = accent && k === n ? " iso-col--coral" : "";
    const cur = k === current ? " is-current" : "";
    let lines = "";
    for (let j = 1; j * s < H - 1; j++) {
      const y = cy + j * s;
      lines += `<polyline points="${P([cx - dx, y], [cx, y + dy], [cx + dx, y])}"/>`;
    }
    lines += `<polyline points="${P([cx - dx, cy], [cx, cy + dy], [cx + dx, cy])}"/><polyline points="${P([cx, cy + dy], [cx, gy + dy])}"/>`;
    out += `<g class="iso-col${tone}${cur}"><polygon class="iso-col__l" points="${left}"/><polygon class="iso-col__r" points="${right}"/><polygon class="iso-col__t" points="${top}"/><g class="iso-col__u">${lines}</g></g>`;
  }
  const W = 2 * dx * n;
  const Hh = (n + 1) * s;
  return `<svg class="iso-cols ${className}" viewBox="-1 -1 ${f(W + 2)} ${f(Hh + 2)}" aria-hidden="true" focusable="false">${out}</svg>`;
}

/*
  Process scenes: one isometric illustration per stage, built from "pieces" that main.js
  reveals in order as the reader scrolls through that stage.
  1 Embed (a cube joins a slab), 2 Map (a lattice of nodes and gaps), 3 Build (columns rise),
  4 Align (a slab locks onto the lattice), 5 Hold (the Keystone: two walls and the cube that holds them).
  One coral element per scene. Fills come from the --iso-* tokens.
*/
function isoScene(n) {
  const f = (v) => v.toFixed(1);
  const P = (...p) => p.map(([x, y]) => `${f(x)},${f(y)}`).join(" ");
  const W = 360;
  const piece = (inner, from = "0,24") => `<g class="piece" data-from="${from}">${inner}</g>`;
  const lattice = (ox, oy, side, x0 = 0, y0 = 0, x1 = W, y1 = W) => {
    const dx = (side * Math.sqrt(3)) / 2, dy = side / 2;
    let d = "";
    for (let a = Math.floor((x0 - ox) / dx) - 1; a <= Math.ceil((x1 - ox) / dx) + 1; a++) {
      for (let b = Math.floor((y0 - oy) / dy) - 1; b <= Math.ceil((y1 - oy) / dy) + 1; b++) {
        if (((a + b) % 2 + 2) % 2) continue;
        const cx = ox + a * dx, cy = oy + b * dy;
        d += `M${f(cx)} ${f(cy - dy)}L${f(cx + dx)} ${f(cy)}L${f(cx)} ${f(cy + dy)}L${f(cx - dx)} ${f(cy)}Z`;
      }
    }
    return `<path class="scene__lattice" d="${d}"/>`;
  };
  const tile = (cx, cy, dx, dy, cls) =>
    `<polygon class="${cls}" points="${P([cx, cy - dy], [cx + dx, cy], [cx, cy + dy], [cx - dx, cy])}"/>`;
  const col = (cx, gy, s, H, coral) => {
    const dx = (s * Math.sqrt(3)) / 2, dy = s / 2, cy = gy - H;
    let lines = "";
    for (let j = 1; j * s < H - 1; j++) lines += `<polyline points="${P([cx - dx, cy + j * s], [cx, cy + j * s + dy], [cx + dx, cy + j * s])}"/>`;
    lines += `<polyline points="${P([cx - dx, cy], [cx, cy + dy], [cx + dx, cy])}"/><polyline points="${P([cx, cy + dy], [cx, gy + dy])}"/>`;
    return `<g class="iso-col${coral ? " iso-col--coral" : ""}"><polygon class="iso-col__l" points="${P([cx - dx, cy], [cx, cy + dy], [cx, gy + dy], [cx - dx, gy])}"/><polygon class="iso-col__r" points="${P([cx + dx, cy], [cx, cy + dy], [cx, gy + dy], [cx + dx, gy])}"/><polygon class="iso-col__t" points="${P([cx, cy - dy], [cx + dx, cy], [cx, cy + dy], [cx - dx, cy])}"/><g class="iso-col__u">${lines}</g></g>`;
  };

  let body = "";
  if (n === 1 || n === 2 || n === 4) {
    const side = 36, dx = (side * Math.sqrt(3)) / 2, dy = side / 2;
    const at = (ox, oy) => (u, v) => [ox + (u + v) * dx, oy + (u - v) * dy];
    if (n === 1) {
      const T = at(180 - 2 * dx, 200);
      body += lattice(180 - 2 * dx, 200, side);
      const ring = [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [1, 2], [0, 2], [0, 1]];
      body += tile(...T(1, 1), dx, dy, "sc-ghost");
      ring.forEach(([u, v]) => { body += piece(tile(...T(u, v), dx, dy, "sc-tile"), "0,18"); });
      const [cx, cy] = T(1, 1);
      body += piece(col(cx, cy, side, side, true), "0,-90");
    } else if (n === 2) {
      const ox = 180 - 3 * dx, oy = 200;
      const T = at(ox, oy);
      body += lattice(ox, oy, side);
      for (let u = 0; u < 4; u++) {
        let row = "";
        for (let v = 0; v < 4; v++) row += tile(...T(u, v), dx, dy, "sc-ghost sc-ghost--solid");
        body += piece(row, "0,14");
      }
      [[0, 0], [2, 1], [3, 3]].forEach(([u, v]) => { body += piece(tile(...T(u, v), dx, dy, "sc-tile"), "0,-14"); });
      const link = (pts) => `<polyline class="sc-link" points="${pts.map(([u, v]) => P(T(u, v))).join(" ")}"/>`;
      body += piece(link([[0, 0], [1, 0], [2, 0], [2, 1]]), "0,0");
      body += piece(link([[2, 1], [2, 2], [2, 3], [3, 3]]), "0,0");
      body += piece(tile(...T(0, 3), dx, dy, "sc-coral"), "0,-26");
    } else {
      const ox = 180 - 2 * dx, oy = 170;
      const T = at(ox, oy);
      body += lattice(ox, oy, side);
      let ghost = "", fixed = "", moving = "";
      for (let u = 0; u < 2; u++) for (let v = 0; v < 2; v++) {
        fixed += tile(...T(u, v), dx, dy, "sc-tile");
        ghost += tile(...T(u + 2, v), dx, dy, "sc-ghost");
        moving += tile(...T(u + 2, v), dx, dy, "sc-coral");
      }
      body += piece(fixed, "0,18");
      body += `<g class="scene__target">${ghost}</g>`;
      body += piece(moving, "46,-40");
    }
  } else if (n === 3) {
    const s = 28, dx = (s * Math.sqrt(3)) / 2;
    for (let k = 1; k <= 5; k++) body += piece(col(180 + (k - 3) * 2 * dx, 285, s, k * s, k === 5), "0,40");
  } else {
    const L = "216.08,130 320,70 320,190 216.08,250", R = "320,70 423.92,130 423.92,250 320,190";
    const sideL = "268.04,160 320,190 320,250 268.04,220", sideR = "371.96,160 320,190 320,250 371.96,220";
    const cube = "268.04,160 320,130 371.96,160 371.96,220 320,250 268.04,220 268.04,160";
    body += `<g transform="translate(180 176) scale(1.2) translate(-320 -160)">${lattice(320, 160, 60, 60, -80, 580, 400)}`;
    body += piece(`<polygon class="sc-wall-l" points="${L}"/>`, "-34,0");
    body += piece(`<polygon class="sc-wall-r" points="${R}"/>`, "34,0");
    body += piece(`<polygon class="sc-cube-l" points="${sideL}"/><polygon class="sc-cube-r" points="${sideR}"/><polyline class="sc-cube-line" points="${cube}"/><polyline class="sc-cube-line" points="268.04,160 320,190 371.96,160 M320,190 320,250"/>`.replace(' M320,190 320,250','') + `<polyline class="sc-cube-line" points="320,190 320,250"/>`, "0,-70");
    body += `</g>`;
  }
  return `<svg class="scene scene--${n}" data-scene viewBox="0 0 ${W} ${W}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">${body}</svg>`;
}

/*
  Process icons: five isometric tile icons (Embed, Map, Build, Align, Hold), one per stage.
  Drawn on a 2:1 lattice: tiles 32 x 16 px, cubes 16 px high. Every vertex is a whole pixel and
  vertical edges sit on half pixels, so the 1 px outline stays crisp at 1x.
  Fills come from the --iso-* tokens. One accent block per icon (blue at rest, coral on hover).
  The hover loops are in components.css (.pi-*).
*/
const PI = { dx: 16, dy: 8, h: 16, w: 166, ht: 112 };
const pc = (kind, u, v, z = 0, h = PI.h, cls = "", delay = null) => ({ kind, u, v, z, h, cls, delay });
const pblock = (u0, v0, n, m, z, kind, h = PI.h) => {
  const out = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) out.push(pc(kind, u0 + i, v0 + j, z, h));
  return out;
};
const PROCESS_ICONS = {
  // Embed: a 3 x 3 team with one accent block set into the centre.
  1: [...pblock(0, 0, 3, 3, 0, "g"), pc("a", 1, 1, 0, 16, "drop")],
  // Map: open floor, grey plate and accent plate, pulled apart.
  2: [...pblock(0, 0, 3, 3, 0, "tile"), ...pblock(0, 0, 2, 2, 28, "g", 4).map((e) => ({ ...e, cls: "mid" })), pc("a", 0, 0, 56, 4, "top")],
  // Build: two built levels, one level still in outline, one accent block in progress.
  3: [
    ...pblock(0, 0, 2, 2, 0, "g"), ...pblock(0, 0, 2, 2, 16, "g"),
    pc("o", 0, 0, 32, 16, "fill", 0), pc("o", 1, 0, 32, 16, "fill", 180), pc("o", 0, 1, 32, 16, "fill", 180),
    pc("a", 1, 1, 32),
  ],
  // Align: three arms along the three axes from one corner cube, accent block on top.
  4: [
    pc("g", 0, 0, 0),
    pc("g", 1, 0, 0, 16, "au"), pc("g", 2, 0, 0, 16, "au"),
    pc("g", 0, 1, 0, 16, "av"), pc("g", 0, 2, 0, 16, "av"),
    pc("g", 0, 0, 16, 16, "az"), pc("a", 0, 0, 32, 16, "az"),
  ],
  // Hold: four pillars carry a thin plate; the accent block rests on it.
  5: [
    ...[0, 2].flatMap((u) => [0, 2].flatMap((v) => [pc("g", u, v, 0), pc("g", u, v, 16)])),
    ...pblock(0, 0, 3, 3, 32, "g", 4),
    pc("a", 1, 1, 36, 16, "me"),
  ],
};
const PROCESS_LABELS = { 1: "Embed", 2: "Map", 3: "Build", 4: "Align", 5: "Hold" };

function processFaces(e, dx, dy) {
  const cx = (e.u - e.v) * dx;
  const c = (e.u + e.v) * dy - e.z;
  const h = e.kind === "tile" ? 0 : e.h;
  const top = [[cx, c - h - dy], [cx + dx, c - h], [cx, c - h + dy], [cx - dx, c - h]];
  const l = [[cx - dx, c - h], [cx, c - h + dy], [cx, c + dy], [cx - dx, c]];
  const r = [[cx + dx, c - h], [cx, c - h + dy], [cx, c + dy], [cx + dx, c]];
  return { top, l, r };
}

function processIcon(n, className = "") {
  const els = (PROCESS_ICONS[n] || []).slice().sort((a, b) => (a.u + a.v) - (b.u + b.v) || a.z - b.z || a.u - b.u);
  if (!els.length) throw new Error(`Unknown process icon "${n}"`);
  const { dx, dy, w: W, ht: H } = PI;
  let minX = Infinity, maxY = -Infinity;
  const faces = els.map((e) => {
    const f = processFaces(e, dx, dy);
    [f.top, f.l, f.r].forEach((p) => p.forEach(([x, y]) => { minX = Math.min(minX, x); maxY = Math.max(maxY, y); }));
    return f;
  });
  const ox = -minX + 0.5;
  const oy = H - 1 - maxY;
  const pts = (p) => p.map(([x, y]) => `${x + ox},${y + oy}`).join(" ");
  let body = "";
  els.forEach((e, i) => {
    const f = faces[i];
    let inner;
    if (e.kind === "tile") inner = `<polygon class="pi-t" points="${pts(f.top)}"/>`;
    else inner = `<polygon class="pi-l" points="${pts(f.l)}"/><polygon class="pi-r" points="${pts(f.r)}"/><polygon class="pi-t" points="${pts(f.top)}"/>`;
    const kind = { g: "pi-cube", a: "pi-cube pi-acc", o: "pi-cube pi-wire", tile: "pi-tile" }[e.kind];
    const cls = [kind, e.cls && `pi-${e.cls}`].filter(Boolean).join(" ");
    const style = e.delay != null ? ` style="animation-delay:${e.delay}ms"` : "";
    body += `<g class="${cls}"${style}>${inner}</g>`;
  });
  return `<svg class="process-icon ${className}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">${body}</svg>`;
}

/*
  Image slot. Renders the image when the file exists under src/assets/images,
  and a labelled placeholder (showing the expected path) when it does not.
  Drop the file in and rebuild: nothing else needs to change.
*/
function figure(src, alt = "", ratio = "4/3", label = "", className = "") {
  const file = path.join(IMAGES_DIR, src);
  const style = `aspect-ratio: ${ratio}`;
  if (fs.existsSync(file)) {
    return `<img class="media ${className}" src="/assets/images/${src}" alt="${escape(alt)}" style="${style}" loading="lazy" decoding="async">`;
  }
  return `<div class="media media--placeholder ${className}" style="${style}" role="img" aria-label="${escape(alt || label)}">
  <span class="media__label">${icon("image", 20)}<span>${escape(label || "Image")}</span></span>
  <code class="media__path">assets/images/${escape(src)}</code>
</div>`;
}

module.exports = { icon, isoPattern, isoCols, isoScene, processIcon, figure };
