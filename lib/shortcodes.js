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

module.exports = { icon, isoPattern, figure };
