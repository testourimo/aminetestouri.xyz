/*
  Iso Structural illustrations and icons.
  Everything sits on the isometric lattice (30 degrees): tile centres are at (a * dx, b * dy)
  with a + b even, dx = side * sqrt(3) / 2 and dy = side / 2. Columns are n cubes high (one cube = one side).

  The markup is the FINISHED picture. Without scripts, or with reduced motion, that is what shows.
  main.js plays the build as a loop on top of it, from the data-* attributes:

    data-b="lock"   a block drifts in from an offset and locks onto the grid   (data-lx, data-ly)
    data-b="rise"   a cube column grows from the ground                        (data-ox, data-oy = ground)
    data-b="draw"   a line draws from its first point
    data-b="fade"   fades in
    data-b="path"   a tile travels along a polyline                            (data-pts, data-end)
    data-at / data-dur   start and length in seconds of the loop

  Icons are not looped; they use the scroll animations (data-iso="rise" / "lock") from motion.css.
*/
const S3 = Math.sqrt(3) / 2;
const f = (n) => String(Math.round(n * 10) / 10);

function make(side, ox = 0, oy = 0, mode = "loop") {
  const dx = side * S3;
  const dy = side / 2;
  const X = (a) => ox + a * dx;
  const Y = (b) => oy + b * dy;
  const box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const T = (x, y) => {
    box.x0 = Math.min(box.x0, x); box.y0 = Math.min(box.y0, y);
    box.x1 = Math.max(box.x1, x); box.y1 = Math.max(box.y1, y);
  };
  const P = (...pts) => pts.map(([x, y]) => { T(x, y); return `${f(x)},${f(y)}`; }).join(" ");
  const rh = (cx, cy) => `M${f(cx)} ${f(cy - dy)}L${f(cx + dx)} ${f(cy)}L${f(cx)} ${f(cy + dy)}L${f(cx - dx)} ${f(cy)}Z`;

  /* Animation attributes for the two modes. */
  function anim(kind, o = {}) {
    if (!kind) return "";
    if (mode === "scroll") {
      if (kind === "rise") return ` data-iso="rise" style="--d:${o.d || 0};transform-origin:${f(o.ox)}px ${f(o.oy)}px"`;
      if (kind === "lock") return ` data-iso="lock" style="--lx:${o.lx || 0}px;--ly:${o.ly || 0}px;--d:${o.d || 0}"`;
      return "";
    }
    let s = ` data-b="${kind}" data-at="${o.at || 0}" data-dur="${o.dur || 1.1}"`;
    if (kind === "lock") s += ` data-lx="${o.lx || 0}" data-ly="${o.ly || 0}"`;
    if (kind === "rise") s += ` data-ox="${f(o.ox)}" data-oy="${f(o.oy)}"`;
    if (kind === "path") s += ` data-pts="${o.pts}" data-end="${o.end || "stay"}"`;
    return s;
  }

  /* A block of n x m flat tiles; its first tile is at lattice (a0, b0). */
  function block(a0, b0, n, m, tone, o = {}) {
    let d = "";
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
      const cx = X(a0 + i + j), cy = Y(b0 + i - j);
      T(cx - dx, cy); T(cx + dx, cy); T(cx, cy - dy); T(cx, cy + dy);
      d += rh(cx, cy);
    }
    return `<g${anim(o.kind, o)}><path d="${d}" class="at-iso__t at-iso__t--${tone}"/></g>`;
  }

  /* A column of n cubes standing on the tile at lattice (a, b). */
  function col(a, b, n, tone, o = {}) {
    const cx = X(a), gy = Y(b), H = n * side, top = gy - H;
    let g = `<polygon class="at-cube__l" points="${P([cx - dx, top], [cx, top + dy], [cx, gy + dy], [cx - dx, gy])}"/>`;
    g += `<polygon class="at-cube__r" points="${P([cx + dx, top], [cx, top + dy], [cx, gy + dy], [cx + dx, gy])}"/>`;
    g += `<polygon class="at-cube__t" points="${P([cx, top - dy], [cx + dx, top], [cx, top + dy], [cx - dx, top])}"/>`;
    for (let k = 1; k < n; k++) {
      const y = top + k * side;
      g += `<polyline class="at-cube__ln" points="${P([cx - dx, y], [cx, y + dy], [cx + dx, y])}"/>`;
    }
    g += `<polyline class="at-cube__ln" points="${P([cx - dx, top], [cx, top + dy], [cx + dx, top])}"/>`;
    g += `<polyline class="at-cube__ln" points="${P([cx, top + dy], [cx, gy + dy])}"/>`;
    return `<g class="at-cube--${tone}"${anim(o.kind, { ...o, ox: cx, oy: gy + dy })}>${g}</g>`;
  }

  /* A slab: n x m tiles wide, `thick` px deep, lifted `lift` px above the lattice (layers of a platform). */
  function prism(a0, b0, n, m, lift, thick, tone, o = {}) {
    const L = [X(a0) - dx, Y(b0) - lift];
    const Tp = [X(a0 + m - 1), Y(b0 - m + 1) - dy - lift];
    const R = [X(a0 + n + m - 2) + dx, Y(b0 + n - m) - lift];
    const B = [X(a0 + n - 1), Y(b0 + n - 1) + dy - lift];
    const dn = ([x, y]) => [x, y + thick];
    let g = `<polygon class="at-cube__l" points="${P(L, B, dn(B), dn(L))}"/>`;
    g += `<polygon class="at-cube__r" points="${P(R, B, dn(B), dn(R))}"/>`;
    g += `<polygon class="at-cube__t" points="${P(Tp, R, B, L)}"/>`;
    g += `<polyline class="at-cube__ln" points="${P(L, Tp, R)}"/>`;
    g += `<polyline class="at-cube__ln" points="${P(L, B, R)}"/>`;
    g += `<polyline class="at-cube__ln" points="${P(B, dn(B))}"/>`;
    return `<g class="at-cube--${tone}"${anim(o.kind, o)}>${g}</g>`;
  }

  /* A hairline that draws, with a small square node at each corner. pts are pixel coordinates. */
  function wire(pts, o = {}) {
    const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${f(x)} ${f(y)}`).join("");
    pts.forEach(([x, y]) => { T(x, y); });
    const nodes = pts.map(([x, y]) => `<path d="${rh(x, y).replace(/Z$/, "Z")}" class="at-node" transform="translate(0 0)"/>`).join("");
    return `<path d="${d}" class="at-wire" pathLength="1"${anim("draw", o)}/>` + (o.nodes ? `<g${anim("fade", { at: (o.at || 0) + (o.dur || 1), dur: 0.5 })}>${nodes}</g>` : "");
  }

  /* A flat tile that travels along a polyline. Its first and last points are in pixel coordinates. */
  function marker(pts, tone, o = {}) {
    const last = pts[pts.length - 1];
    const s = o.scale || 1;
    const d = `M0 ${f(-dy * s)}L${f(dx * s)} 0L0 ${f(dy * s)}L${f(-dx * s)} 0Z`;
    return `<g transform="translate(${f(last[0])} ${f(last[1])})"${anim("path", { ...o, pts: pts.map((p) => `${f(p[0])},${f(p[1])}`).join(" ") })}><path d="${d}" class="at-iso__t at-iso__t--${tone}"/></g>`;
  }

  const px = (a, b) => [X(a), Y(b)];
  return { dx, dy, X, Y, block, col, prism, wire, marker, px, box, mode };
}

/* ---------------------------- hero scenes ---------------------------- */
/* Viewbox is 33 * dx wide (16 columns) and 600 tall; the right part is what shows beside the headline. */
const SCENES = {
  /* "Complex software, made clear." Loose tiles lock onto the grid, then a chart builds: growth in five steps. */
  home() {
    const g = make(48);
    let m = "";
    m += g.block(30, 6, 2, 2, "blue", { kind: "lock", at: 0, dur: 1.2, lx: -50, ly: -40 });
    m += g.block(30, 14, 2, 2, "relief", { kind: "lock", at: 0.3, dur: 1.2, lx: 60, ly: 30 });
    m += g.block(31, 19, 1, 1, "ink", { kind: "lock", at: 0.6, dur: 1.2, lx: 30, ly: 50 });
    [1, 2, 3, 4, 5].forEach((n, i) => {
      m += g.col(19 + 2 * i, 19, n, n === 5 ? "coral" : "ink", { kind: "rise", at: 1.5 + i * 0.35, dur: 1.1 });
    });
    return { m, T: 10 };
  },

  /* "Thoughtful product design for growing software." A platform in three layers, built from the ground up. */
  services() {
    const g = make(48);
    let m = "";
    m += g.block(20, 5, 1, 1, "relief", { kind: "lock", at: 2.4, dur: 1.2, lx: -30, ly: -40 });
    m += g.prism(21, 17, 6, 6, 0, 24, "ink", { kind: "lock", at: 0, dur: 1.2, lx: 0, ly: -70 });
    m += g.prism(23, 17, 4, 4, 96, 24, "blue", { kind: "lock", at: 0.8, dur: 1.2, lx: 0, ly: -70 });
    m += g.prism(25, 17, 2, 2, 192, 24, "coral", { kind: "lock", at: 1.6, dur: 1.2, lx: 0, ly: -70 });
    m += g.block(31, 9, 1, 1, "ink", { kind: "lock", at: 2.7, dur: 1.2, lx: 30, ly: 40 });
    return { m, T: 10 };
  },

  /* "Hello, I'm Mo.Amine Testouri." A path of five steps; a tile climbs them. */
  about() {
    const g = make(48);
    let m = "";
    m += g.block(19, 11, 2, 2, "relief", { kind: "lock", at: 0, dur: 1.2, lx: -40, ly: -30 });
    m += g.block(31, 23, 1, 1, "blue", { kind: "lock", at: 0.3, dur: 1.2, lx: 30, ly: 40 });
    // Back (tallest) first so nearer steps paint over it.
    for (let k = 4; k >= 0; k--) {
      m += g.col(25 + k, 21 - k, k + 1, "ink", { kind: "rise", at: 0.8 + k * 0.4, dur: 1.1 });
    }
    const top = (k) => [g.X(25 + k), g.Y(21 - k) - (k + 1) * 48];
    m += g.marker([0, 1, 2, 3, 4].map(top), "coral", { at: 3.2, dur: 3.4 });
    return { m, T: 10.5 };
  },

  /* "Get in touch." Two sides, one line, a message each way. */
  contact() {
    const g = make(48);
    let m = "";
    m += g.block(24, 6, 2, 2, "blue", { kind: "lock", at: 2.6, dur: 1.2, lx: 0, ly: -40 });
    m += g.block(25, 21, 2, 2, "relief", { kind: "lock", at: 2.9, dur: 1.2, lx: 0, ly: 40 });
    m += g.col(21, 15, 3, "ink", { kind: "rise", at: 0, dur: 1.1 });
    m += g.col(29, 15, 3, "ink", { kind: "rise", at: 0.4, dur: 1.1 });
    const A = [g.X(21), g.Y(15) - 144];
    const M = [g.X(25), g.Y(15) - 144 + 4 * g.dy];
    const B = [g.X(29), g.Y(15) - 144];
    m += g.wire([A, M, B], { at: 1.4, dur: 1.4, nodes: true });
    m += g.marker([A, M, B], "coral", { at: 3.2, dur: 1.8, end: "hide", scale: 0.6 });
    m += g.marker([B, M, A], "coral", { at: 5.6, dur: 1.8, end: "hide", scale: 0.6 });
    return { m, T: 9.5 };
  },
};

function sceneMarkup(name) {
  const make_ = SCENES[name];
  return make_ ? make_() : null;
}

/* ------------------------------- icons ------------------------------- */
/* Built at side 10 and fitted to the viewbox from their own bounds. One coral or blue element at most. */
const ICONS = {
  bars(g) { // product design: a dashboard chart
    return [1, 2, 3].map((n, i) => g.col(-2 + 2 * i, 2, n, n === 3 ? "coral" : "ink", { kind: "rise", d: i })).join("");
  },
  mosaic(g) { // design systems: components on a grid
    return g.block(1, -1, 1, 1, "blue", { kind: "lock", lx: 0, ly: -8, d: 0 })
      + g.block(0, 0, 1, 1, "relief", { kind: "lock", lx: -8, ly: 0, d: 1 })
      + g.block(2, 0, 1, 1, "ink", { kind: "lock", lx: 8, ly: 0, d: 2 })
      + g.block(1, 1, 1, 1, "relief", { kind: "lock", lx: 0, ly: 8, d: 3 });
  },
  grid(g) { // research and audits: a field of cells, two found
    let m = g.block(0, 0, 3, 3, "relief", { kind: "lock", lx: 0, ly: -8, d: 0 });
    m += g.block(2, 0, 1, 1, "coral", { kind: "lock", lx: 0, ly: -8, d: 1 });
    return m;
  },
  mark(g) { // brand identity: the mark and its outline
    return g.block(-1, -1, 2, 2, "relief", { kind: "lock", lx: -6, ly: -6, d: 0 })
      + g.block(0, 0, 2, 2, "coral", { kind: "lock", lx: 6, ly: 6, d: 1 });
  },
  layers(g) { // handover: organised layers
    return g.prism(-1, 2, 3, 3, 0, 4, "ink", { kind: "lock", lx: 0, ly: -10, d: 0 })
      + g.prism(-1, 2, 3, 3, 14, 4, "ink", { kind: "lock", lx: 0, ly: -10, d: 1 })
      + g.prism(-1, 2, 3, 3, 28, 4, "coral", { kind: "lock", lx: 0, ly: -10, d: 2 });
  },
};

function isoIcon(name, size = 56) {
  const build = ICONS[name];
  if (!build) throw new Error(`Unknown iso icon "${name}"`);
  const g = make(10, 0, 0, "scroll");
  const body = build(g);
  const pad = 3;
  const { x0, y0, x1, y1 } = g.box;
  const w = x1 - x0 + 2 * pad, h = y1 - y0 + 2 * pad;
  const k = size / Math.max(w, h);
  return `<svg class="at-isoicon" width="${f(w * k)}" height="${f(h * k)}" viewBox="${f(x0 - pad)} ${f(y0 - pad)} ${f(w)} ${f(h)}" aria-hidden="true" focusable="false">${body}</svg>`;
}

module.exports = { sceneMarkup, isoIcon };
