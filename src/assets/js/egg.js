/*
  Easter Egg Mode. Progressive enhancement: without this file the site is the Normal mode, minus the cubes.

  Normal   Home shows floating cubes behind centred copy. One is coral. Tap it and they assemble into one
           cube, which then docks into the header and becomes the menu (Egg mode).
  Egg      <html data-mode="egg">, kept for the tab session (sessionStorage "mode"). The cube in the header opens a full-screen
           menu. "Back to the classic menu" returns to Normal (and, on Home, the cubes scatter again).

  Drag pushes cubes, the pointer repels them, the coral cube leans toward the pointer.
  Reduced motion: no drift, no tumbling, the assembly snaps.
*/
(function () {
  var root = document.documentElement;
  var reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
  function reduced() { return reduceMq.matches; }

  /* ---- Mode ---- */
  function setMode(m) {
    root.setAttribute("data-mode", m);
    try { if (m === "egg") sessionStorage.setItem("mode", "egg"); else sessionStorage.removeItem("mode"); } catch (e) {}
  }
  function inEgg() { return root.getAttribute("data-mode") === "egg"; }

  /* ---- Header: the cube button and the full-screen menu ---- */
  var nav = document.querySelector("[data-egg-nav]");
  var menu = document.querySelector("[data-egg-menu]");
  var exitBtn = document.querySelector("[data-egg-exit]");
  var mini = document.querySelector("[data-egg-slot]");
  var kick = 0, menuOpen = false;

  function spinMini() { kick += 90; if (mini) mini.style.setProperty("--kick", kick + "deg"); }

  function setMenu(open, quiet) {
    if (!nav || !menu || menuOpen === open) return;
    menuOpen = open;
    menu.classList.toggle("is-open", open);
    if (open) menu.removeAttribute("inert"); else menu.setAttribute("inert", "");
    nav.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
    spinMini();
    if (open) {
      setTimeout(function () { var a = menu.querySelector("a"); if (a && menuOpen) a.focus({ preventScroll: true }); }, 350);
    } else if (!quiet) {
      nav.focus({ preventScroll: true });
    }
  }

  if (nav && menu) {
    nav.addEventListener("click", function () { setMenu(!menuOpen); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menuOpen) setMenu(false); });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false, true); });
      a.addEventListener("pointerenter", spinMini);
      a.addEventListener("focus", spinMini);
    });
    window.matchMedia("(min-width: 1024px)").addEventListener("change", function () { setMenu(false, true); });
  }
  if (exitBtn) exitBtn.addEventListener("click", function () {
    setMenu(false, true);
    setMode("normal");
    if (hero && field) buildField(true);
    announce("msgScattered");
  });

  /* ---- Home: the cube field ---- */
  var hero = document.querySelector("[data-egg-hero]");
  var field = document.querySelector("[data-egg-field]");
  var scene = field && field.querySelector("[data-egg-scene]");
  var live = document.querySelector("[data-egg-live]");

  function announce(key) {
    if (!live || !field) return;
    var msg = field.getAttribute(key === "msgAssembled" ? "data-msg-assembled" : "data-msg-scattered");
    if (msg) live.textContent = msg;
  }

  var FACES = [["t", 0], ["fr", 2], ["r", 2], ["bk", 1], ["l", 1], ["b", 2]]; // class, palette index
  var PAL = { black: [], blue: [], coral: [] };

  function hex(h) {
    h = (h || "").trim().replace("#", "");
    if (h.length === 3) h = h.replace(/(.)/g, "$1$1");
    return [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0];
  }
  function loadPalettes() {
    var cs = getComputedStyle(root);
    function read(names) { return names.map(function (n) { return hex(cs.getPropertyValue(n)); }); }
    PAL.black = read(["--egg-k0", "--egg-k1", "--egg-k2"]);
    PAL.blue = read(["--egg-b0", "--egg-b1", "--egg-b2"]);
    PAL.coral = read(["--iso-coral-top", "--iso-coral-left", "--iso-coral-right"]);
  }

  var st = null; // live state of the field, null when there is none

  function mix(a, b, t) { return a + (b - a) * t; }
  function wrap(a) { a = a % 360; if (a > 180) a -= 360; if (a < -180) a += 360; return a; }
  function ease(u) { return 1 - Math.pow(1 - u, 3); }
  function easeIO(u) { return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }

  function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }

  function destroyField() {
    if (!st) return;
    cancelAnimationFrame(st.raf);
    st.io && st.io.disconnect();
    st.cleanup.forEach(function (fn) { fn(); });
    scene.innerHTML = "";
    scene.className = "egg-scene";
    scene.removeAttribute("style");
    hero.removeAttribute("data-egg");
    hero.classList.remove("is-dragging");
    st = null;
  }

  function buildField(intro) {
    if (!hero || !field || !scene) return;
    destroyField();
    loadPalettes();
    var W = hero.clientWidth, H = hero.clientHeight;
    var S = Math.max(30, Math.min(56, Math.round(Math.min(W / 15, H / 10.5))));
    scene.style.setProperty("--s", S + "px");
    hero.setAttribute("data-egg", "scatter");

    var textEl = hero.querySelector(".hero__text");
    var zoneX = Math.min(textEl ? textEl.offsetWidth / 2 + 24 : 300, W * 0.45);
    var zoneY = (textEl ? textEl.offsetHeight / 2 : 130) + (W < 700 ? 44 : 16);

    var R = rng(7);
    var cols = Math.ceil(Math.sqrt(55 * W / H)), rows = Math.ceil(55 / cols);
    var cw = W * 1.18 / cols, ch = H * 1.1 / rows, cells = [], ci = 0, a, b;
    for (a = 0; a < cols; a++) for (b = 0; b < rows; b++) cells.push([(a + 0.5) * cw - W * 0.59, (b + 0.5) * ch - H * 0.55]);
    for (a = cells.length - 1; a > 0; a--) { b = Math.floor(R() * (a + 1)); var tmp = cells[a]; cells[a] = cells[b]; cells[b] = tmp; }

    var cubes = [], coral = null, cg = [0, 3, 3];
    for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) for (var k = 0; k < 4; k++) {
      if (i > 0 && i < 3 && j > 0 && j < 3 && k > 0 && k < 3) continue;
      var isC = i === cg[0] && j === cg[1] && k === cg[2];
      var sx, sy, sz;
      if (isC) { sz = 380; var mc = (1500 - sz) / 1500; var X, Y;
          if (W < 700) { // phone: above the copy, so it is always in the first screen
            var tr = textEl ? textEl.getBoundingClientRect() : null, hr0 = hero.getBoundingClientRect();
            var above = tr ? tr.top - hr0.top - 52 : H * 0.12;
            X = W * 0.26; Y = Math.max(above - 100, 28) - H / 2;
          } else { // desktop and tablet: beside the copy
            X = Math.min(W / 2 - 70, zoneX + 100); Y = H * 0.18;
          }
          sx = X * mc; sy = Y * mc; }
      else {
        var cell = cells[ci++ % cells.length], tries = 0;
        do {
          sz = -650 + R() * 800;
          var m = (1500 - sz) / 1500;
          sx = (cell[0] + (R() - 0.5) * cw) * m;
          sy = (cell[1] + (R() - 0.5) * ch) * m;
          if (++tries > 25) cell = cells[Math.floor(R() * cells.length)];
        } while (Math.abs(sx) < zoneX && Math.abs(sy) < zoneY);
      }
      var rr = R(), pal = isC ? "coral" : (rr < 0.24 ? "blue" : "black");
      var el = document.createElement("div");
      el.className = "egg-cube" + (isC ? " is-coral" : "") + (pal === "blue" ? " is-blue" : "");
      var faces = FACES.map(function (f) { var d = document.createElement("i"); d.className = "f " + f[0]; el.appendChild(d); return d; });
      scene.appendChild(el);
      var c = {
        el: el, faces: faces, pal: pal, isC: isC, sx: sx, sy: sy, sz: sz,
        px: R() * 6.28, py: R() * 6.28, pz: R() * 6.28, ax: 10 + R() * 16, ay: 8 + R() * 14, az: 10 + R() * 18, fq: 0.12 + R() * 0.16,
        rx: R() * 360, ry: R() * 360, rz: R() * 360, wx: (R() - 0.5) * 14, wy: (R() - 0.5) * 14, wz: (R() - 0.5) * 10,
        sc: isC ? 1 : 0.62 + R() * 0.55,
        gx: (i - 1.5) * S, gy: (1.5 - j) * S, gz: (k - 1.5) * S,
        dist: Math.abs(i - cg[0]) + Math.abs(j - cg[1]) + Math.abs(k - cg[2]),
        ox: 0, oy: 0, vx: 0, vy: 0, hx: 0, hy: 0, cxs: 0, cys: 0,
        p: 0, from: 0, to: 0, start: 0, delay: 0, dur: 1, lastP: -1
      };
      if (isC) {
        coral = c;
        el.setAttribute("role", "button");
        el.setAttribute("tabindex", "0");
        el.setAttribute("aria-label", field.getAttribute("data-label") || "");
      }
      cubes.push(c);
    }

    // The merged cube, shown when everything has landed.
    var shell = document.createElement("div");
    shell.className = "egg-shell";
    ["t", "b", "fr", "bk", "r", "l"].forEach(function (n) { var d = document.createElement("i"); d.className = "f " + n; shell.appendChild(d); });
    scene.appendChild(shell);

    var s = st = {
      W: W, H: H, S: S, cubes: cubes, coral: coral, raf: 0, io: null, cleanup: [], visible: true,
      assembled: false, merged: false, docking: false, docked: false, dockT: 0, hideT: 0,
      g: 0, de: 0, mx: 0, my: 0, tmx: 0, tmy: 0, hover: false, hs: 1, orbX: 0, orbY: 0,
      ptr: { x: 0, y: 0, on: false }, down: null, moved: false, onCoral: false, lastMove: 0, last: performance.now(), t0: performance.now(),
      slot: null
    };

    function setColors(c) {
      var from = PAL[c.pal], to = c.isC ? PAL.coral : PAL.black;
      for (var f = 0; f < 6; f++) {
        var idx = FACES[f][1], A = from[idx], B = to[idx], t = c.p;
        c.faces[f].style.background = "rgb(" + Math.round(mix(A[0], B[0], t)) + "," + Math.round(mix(A[1], B[1], t)) + "," + Math.round(mix(A[2], B[2], t)) + ")";
      }
    }
    s.setColors = setColors;
    cubes.forEach(setColors);

    /* Assemble: every cube flies in from the coral corner outward. */
    function assemble() {
      if (s.assembled) return;
      s.assembled = true;
      var now = performance.now(), quick = reduced();
      hero.setAttribute("data-egg", "assembled");
      coral.el.setAttribute("tabindex", "-1");
      cubes.forEach(function (c) {
        c.from = c.p; c.to = 1; c.start = now;
        c.delay = quick ? 0 : c.dist * 70; c.dur = quick ? 1 : 1500;
      });
    }

    /* Dock: the merged cube rises into the header; the header cube takes over. */
    function dock() {
      if (s.docking) return;
      s.docking = true;
      // Egg mode starts here, so the header already holds the cube we are flying to.
      if (nav) nav.classList.add("is-pending");
      setMode("egg");
      requestAnimationFrame(function () {
        var slot = mini && mini.getBoundingClientRect(), hr = hero.getBoundingClientRect();
        if (slot && slot.width) s.slot = { x: slot.left + slot.width / 2 - hr.left, y: slot.top + slot.height / 2 - hr.top, size: slot.width };
        else s.slot = { x: W - 44, y: -40, size: 36 };
        s.dockStart = performance.now();
      });
      announce("msgAssembled");
    }

    coral.el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); assemble(); } });
    coral.el.addEventListener("pointerenter", function () { s.hover = true; });
    coral.el.addEventListener("pointerleave", function () { s.hover = false; });

    /* Pointer: tap the coral cube, drag to push cubes, hover to repel. */
    function onDown(e) {
      if (s.assembled || e.target.closest("a,button")) return;
      s.onCoral = !!e.target.closest(".is-coral");
      s.down = { x: e.clientX, y: e.clientY, px: e.clientX, py: e.clientY };
      s.moved = false; s.lastMove = performance.now();
    }
    function onMove(e) {
      if (e.pointerType !== "touch") { s.ptr.x = e.clientX; s.ptr.y = e.clientY; s.ptr.on = true; }
      var d = s.down;
      if (!d) return;
      var ddx = e.clientX - d.px, ddy = e.clientY - d.py;
      d.px = e.clientX; d.py = e.clientY;
      if (!s.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) { s.moved = true; hero.classList.add("is-dragging"); }
      if (!s.moved || reduced()) return;
      var now = performance.now(), dtm = Math.max(0.008, (now - s.lastMove) / 1000);
      s.lastMove = now;
      cubes.forEach(function (c) {
        var r = c.el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var dd = Math.hypot(e.clientX - cx, e.clientY - cy), w = Math.exp(-Math.pow(dd / 150, 2));
        if (c.isC) w *= 0.25;
        if (w < 0.02) return;
        c.ox += ddx * w * 0.9; c.oy += ddy * w * 0.9;
        c.vx = Math.max(-700, Math.min(700, c.vx + ddx / dtm * w * 0.1));
        c.vy = Math.max(-700, Math.min(700, c.vy + ddy / dtm * w * 0.1));
      });
    }
    function onUp(e) {
      var tap = s.down && !s.moved && s.onCoral && e.type === "pointerup";
      s.down = null; s.moved = false;
      hero.classList.remove("is-dragging");
      if (tap) assemble();
    }
    function onLeave() { s.ptr.on = false; }
    hero.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    hero.addEventListener("pointerleave", onLeave);
    s.cleanup.push(function () {
      hero.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      hero.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
      themeMq.removeEventListener("change", refreshTheme);
      mo.disconnect();
    });

    /* Theme changes recolour the cubes live. */
    function refreshTheme() { loadPalettes(); cubes.forEach(function (c) { c.lastP = -1; }); }
    var themeMq = window.matchMedia("(prefers-color-scheme: dark)");
    themeMq.addEventListener("change", refreshTheme);
    var mo = new MutationObserver(refreshTheme);
    mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    /* A new viewport size means a new layout: rebuild while nothing is in flight. */
    var rz = 0;
    function onResize() {
      clearTimeout(rz);
      rz = setTimeout(function () { if (st === s && !s.assembled) buildField(false); }, 250);
    }
    window.addEventListener("resize", onResize);

    /* Stop drawing while the hero is off screen or the tab is hidden. */
    if ("IntersectionObserver" in window) {
      s.io = new IntersectionObserver(function (en) { s.visible = en[0].isIntersecting; if (s.visible) kickLoop(); }, { threshold: 0 });
      s.io.observe(hero);
    }
    function kickLoop() { if (!s.raf && st === s) { s.last = performance.now(); s.raf = requestAnimationFrame(tick); } }
    document.addEventListener("visibilitychange", function () { if (!document.hidden) kickLoop(); });

    function tick(now) {
      s.raf = 0;
      if (st !== s || document.hidden || (!s.visible && !s.docking)) return;
      var dt = Math.min(0.05, (now - s.last) / 1000);
      s.last = now;
      var t = reduced() ? 0 : (now - s.t0) / 1000;
      var q = reduced();
      s.mx += (s.tmx - s.mx) * (1 - Math.exp(-dt * 3));
      s.my += (s.tmy - s.my) * (1 - Math.exp(-dt * 3));
      if (s.ptr.on && !q) {
        var hr = hero.getBoundingClientRect();
        s.tmx = ((s.ptr.x - hr.left) / hr.width - 0.5) * 2;
        s.tmy = ((s.ptr.y - hr.top) / hr.height - 0.5) * 2;
      }
      s.g += ((s.assembled ? 1 : 0) - s.g) * (1 - Math.exp(-dt * (q ? 60 : 2.2)));
      var ge = s.g;
      if (!(s.down && s.moved)) { s.orbX *= Math.exp(-dt * 1.6); s.orbY *= Math.exp(-dt * 1.6); }
      var rx = mix(-12, -35.264, ge) - s.my * 5 * (1 - ge * 0.85) + s.orbY;
      var ry = mix(-16 + Math.sin(t * 0.12) * 7, 45, ge) + s.mx * 7 * (1 - ge * 0.85) + s.orbX;
      field.style.perspective = mix(1500, 8000, ge).toFixed(0) + "px";

      // Docking: the scene moves to the header slot and shrinks to the size of the mini cube.
      if (s.docking && s.slot) s.de += (1 - s.de) * (1 - Math.exp(-dt * (q ? 60 : 3.2)));
      var dk = s.de * s.de * (3 - 2 * s.de);
      var tx = s.slot ? s.slot.x : s.W / 2, ty = s.slot ? s.slot.y : s.H / 2;
      scene.style.left = mix(s.W / 2, tx, dk).toFixed(1) + "px";
      scene.style.top = mix(s.H / 2, ty, dk).toFixed(1) + "px";
      var scl = mix(1, (s.slot ? s.slot.size : 36) / (s.S * 4), dk);
      scene.style.transform = "translateZ(" + mix(0, -40, ge).toFixed(1) + "px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg) scale3d(" + scl.toFixed(4) + "," + scl.toFixed(4) + "," + scl.toFixed(4) + ")";

      // Repel the cubes from the pointer; the coral cube leans in a little.
      var i2, c2;
      for (i2 = 0; i2 < cubes.length; i2++) { var rc = cubes[i2].el.getBoundingClientRect(); cubes[i2].cxs = rc.left + rc.width / 2; cubes[i2].cys = rc.top + rc.height / 2; }
      var hov = s.ptr.on && !s.assembled && !q && !(s.down && s.moved);
      for (i2 = 0; i2 < cubes.length; i2++) {
        c2 = cubes[i2];
        var tx2 = 0, ty2 = 0;
        if (hov) {
          var ddx = c2.cxs - s.ptr.x, ddy = c2.cys - s.ptr.y, dd = Math.hypot(ddx, ddy) || 1;
          if (c2.isC) { var wc = Math.exp(-Math.pow(dd / 280, 2)); tx2 = -ddx / dd * 26 * wc; ty2 = -ddy / dd * 26 * wc; }
          else { var wr = Math.exp(-Math.pow(dd / 210, 2)); tx2 = ddx / dd * 110 * wr; ty2 = ddy / dd * 110 * wr; }
        }
        var kk = 1 - Math.exp(-dt * (hov ? 5 : 3));
        c2.hx += (tx2 - c2.hx) * kk; c2.hy += (ty2 - c2.hy) * kk;
        c2.vx += -c2.ox * 0.28 * dt; c2.vy += -c2.oy * 0.28 * dt;
        c2.ox += c2.vx * dt; c2.oy += c2.vy * dt;
        var dm = Math.exp(-dt * 2.2); c2.vx *= dm; c2.vy *= dm;
      }
      var cp = null;
      for (i2 = 0; i2 < cubes.length; i2++) {
        c2 = cubes[i2];
        if (c2.isC) cp = {
          x: mix(c2.sx + Math.sin(t * c2.fq + c2.px) * c2.ax + c2.ox + c2.hx, c2.gx, c2.p),
          y: mix(c2.sy + Math.sin(t * c2.fq * 1.3 + c2.py) * c2.ay + c2.oy + c2.hy, c2.gy, c2.p),
          z: mix(c2.sz + Math.sin(t * c2.fq * 0.8 + c2.pz) * c2.az, c2.gz, c2.p)
        };
      }
      for (i2 = 0; i2 < cubes.length; i2++) {
        c2 = cubes[i2];
        var u = Math.max(0, Math.min(1, (now - c2.start - c2.delay) / c2.dur));
        c2.p = c2.start ? mix(c2.from, c2.to, c2.to ? ease(u) : easeIO(u)) : 0;
        var qq = 1 - c2.p;
        var x = mix(c2.sx + Math.sin(t * c2.fq + c2.px) * c2.ax + c2.ox + c2.hx, c2.gx, c2.p);
        var y = mix(c2.sy + Math.sin(t * c2.fq * 1.3 + c2.py) * c2.ay + c2.oy + c2.hy, c2.gy, c2.p);
        var z = mix(c2.sz + Math.sin(t * c2.fq * 0.8 + c2.pz) * c2.az, c2.gz, c2.p);
        if (!c2.isC) {
          // A slight bend toward the coral cube while flying in.
          var pull = Math.sin(Math.PI * c2.p) * 0.12;
          x += (cp.x - x) * pull; y += (cp.y - y) * pull; z += (cp.z - z) * pull;
        }
        var sc = c2.sc * qq + c2.p;
        if (c2.isC) {
          var kc = t % 7, pulse = kc < 1.2 ? Math.sin(kc / 1.2 * Math.PI) : 0;
          s.hs += ((s.hover && !s.assembled ? 1.18 : 1) - s.hs) * (1 - Math.exp(-dt * 10));
          sc = (1 + 0.1 * pulse) * s.hs * (c2.sc * qq + c2.p);
        }
        var a1 = wrap(c2.rx + c2.wx * t) * qq, b1 = wrap(c2.ry + c2.wy * t) * qq, d1 = wrap(c2.rz + c2.wz * t) * qq;
        c2.el.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px," + z.toFixed(1) + "px) rotateX(" + a1.toFixed(1) + "deg) rotateY(" + b1.toFixed(1) + "deg) rotateZ(" + d1.toFixed(1) + "deg) scale(" + sc.toFixed(3) + ")";
        if (Math.abs(c2.p - c2.lastP) > 0.002) { c2.lastP = c2.p; setColors(c2); }
      }

      // Everything landed: fuse into one cube, hold, then dock.
      if (!s.merged && s.assembled && ge > 0.98) {
        var done = true;
        for (i2 = 0; i2 < cubes.length; i2++) if (cubes[i2].p < 0.995) { done = false; break; }
        if (done) {
          s.merged = true;
          scene.classList.add("is-merged");
          s.hideT = setTimeout(function () { scene.classList.add("is-merged-hold"); }, 700);
          s.dockT = setTimeout(dock, q ? 250 : 1700);
        }
      }
      // Arrived: the header cube fades in and the field is gone.
      if (s.docking && s.slot && !s.docked) {
        if (dk > 0.85 && nav) nav.classList.remove("is-pending");
        if (dk > 0.995) {
          s.docked = true;
          field.classList.add("is-hidden");
          setTimeout(function () { if (st === s) { destroyField(); field.classList.remove("is-hidden"); } }, 650);
          hero.setAttribute("data-egg", "docked");
        }
      }
      if (!s.docked || s.docking) s.raf = requestAnimationFrame(tick);
    }
    s.raf = requestAnimationFrame(tick);

    if (intro) { field.classList.add("is-hidden"); requestAnimationFrame(function () { requestAnimationFrame(function () { field.classList.remove("is-hidden"); }); }); }
  }

  /* ---- Start ---- */
  if (hero && field && scene && !inEgg()) buildField(false);
})();
