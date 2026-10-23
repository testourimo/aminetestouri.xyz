/* Small progressive enhancements. The site works without this file. */
(function () {
  var root = document.documentElement;

  /* Theme: toggles light and dark, remembers the choice. */
  function currentTheme() {
    var set = root.getAttribute("data-theme");
    if (set === "light" || set === "dark") return set;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  });

  /* Mobile menu */
  var menuBtn = document.querySelector("[data-menu-toggle]");
  var nav = document.getElementById("site-nav");
  if (menuBtn && nav) {
    var setOpen = function (open) {
      menuBtn.setAttribute("aria-expanded", String(open));
      if (open) nav.setAttribute("data-open", "");
      else nav.removeAttribute("data-open");
      document.body.style.overflow = open ? "hidden" : "";
    };
    menuBtn.addEventListener("click", function () {
      setOpen(menuBtn.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.hasAttribute("data-open")) { setOpen(false); menuBtn.focus(); }
    });
    window.matchMedia("(min-width: 1024px)").addEventListener("change", function (mq) {
      if (mq.matches) setOpen(false);
    });
  }

  /* Services dropdown: the chevron opens it on tap or click; Escape or a click outside closes it.
     Hover and keyboard focus open it through CSS alone. */
  document.querySelectorAll("[data-dropdown]").forEach(function (item) {
    var toggle = item.querySelector("[data-dropdown-toggle]");
    function set(open) {
      toggle.setAttribute("aria-expanded", String(open));
      if (open) item.setAttribute("data-open", ""); else item.removeAttribute("data-open");
    }
    toggle.addEventListener("click", function () { set(!item.hasAttribute("data-open")); });
    document.addEventListener("click", function (e) { if (!item.contains(e.target)) set(false); });
    item.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      set(false);
      item.setAttribute("data-dismissed", "");
      toggle.focus();
    });
    function undismiss() { item.removeAttribute("data-dismissed"); }
    item.addEventListener("mouseleave", undismiss);
    item.addEventListener("focusout", function (e) { if (!item.contains(e.relatedTarget)) undismiss(); });
  });

  /* CardGlow: the glow follows the pointer. */
  document.querySelectorAll("[data-glow]").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
      card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
    });
  });

  /* Scroller: previous / next buttons move one card; disabled at either end. */
  document.querySelectorAll("[data-scroller]").forEach(function (track) {
    var nav = track.parentElement.querySelector("[data-scroller-nav]");
    if (!nav) return;
    var prev = nav.querySelector('[data-scroll="prev"]');
    var next = nav.querySelector('[data-scroll="next"]');
    // In right-to-left pages scrollLeft runs from 0 to negative values.
    var sign = getComputedStyle(track).direction === "rtl" ? -1 : 1;

    function step() {
      var item = track.firstElementChild;
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return item ? item.getBoundingClientRect().width + gap : track.clientWidth;
    }
    function update() {
      var max = track.scrollWidth - track.clientWidth;
      var pos = Math.abs(track.scrollLeft);
      nav.hidden = max <= 1;
      prev.disabled = pos <= 1;
      next.disabled = pos >= max - 1;
    }
    var stopAutoplay = function () {};   // replaced below when autoplay runs
    prev.addEventListener("click", function () { stopAutoplay(); track.scrollBy({ left: -step() * sign }); });
    next.addEventListener("click", function () { stopAutoplay(); track.scrollBy({ left: step() * sign }); });
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();

    /*
      Autoplay: the row drifts continuously (data-autoplay = pixels per second).
      The cards are repeated once after the last one, so it loops without a jump;
      the copies are hidden from screen readers and the keyboard.
      It pauses while the pointer is on a card or a card has focus, and while the
      row is off screen or the tab is hidden. It stops for good once the visitor
      takes over (buttons, touch, keys) and never runs with reduced motion.
    */
    var speed = parseFloat(track.getAttribute("data-autoplay"));
    var stopped = !speed || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (stopped) return;

    var originals = Array.prototype.slice.call(track.children);
    originals.forEach(function (item) {
      var copy = item.cloneNode(true);
      copy.setAttribute("aria-hidden", "true");
      copy.setAttribute("inert", "");
      copy.setAttribute("data-clone", "");
      track.appendChild(copy);
    });
    var firstClone = track.querySelector("[data-clone]");

    var hovered = false, focused = false, visible = true;
    var frame = null, last = 0, pos = 0;

    // Width of one full set of cards: where the copies start.
    function loopWidth() {
      return Math.abs(firstClone.getBoundingClientRect().left - originals[0].getBoundingClientRect().left);
    }
    function tick(now) {
      var dt = last ? Math.min(now - last, 64) : 0;
      last = now;
      pos += speed * dt / 1000;
      var width = loopWidth();
      if (width && pos >= width) pos -= width;
      track.scrollLeft = pos * sign;
      frame = requestAnimationFrame(tick);
    }
    function sync() {
      var run = !stopped && !hovered && !focused && visible && !document.hidden;
      if (run && !frame) {
        pos = Math.abs(track.scrollLeft);   // carry on from wherever the row is now
        last = 0;
        track.classList.add("is-autoplay");
        frame = requestAnimationFrame(tick);
      }
      if (!run && frame) { cancelAnimationFrame(frame); frame = null; }
      if (stopped) track.classList.remove("is-autoplay");
    }
    stopAutoplay = function () { stopped = true; sync(); };

    // Only a card pauses it; the gaps between cards keep it moving.
    originals.concat(Array.prototype.slice.call(track.querySelectorAll("[data-clone]"))).forEach(function (item) {
      item.addEventListener("mouseenter", function () { hovered = true; sync(); });
      item.addEventListener("mouseleave", function () { hovered = false; sync(); });
    });
    track.addEventListener("focusin", function () { focused = true; sync(); });
    track.addEventListener("focusout", function () { focused = false; sync(); });
    ["touchstart", "keydown"].forEach(function (type) {
      track.addEventListener(type, stopAutoplay, { passive: true });
    });
    document.addEventListener("visibilitychange", sync);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting; sync();
      }, { threshold: 0.25 }).observe(track);
    }
    sync();
  });

  /* Footer year */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* Contact form: posted to the form service in site.json, without leaving the page. */
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    var ok = form.querySelector("[data-status-ok]");
    var err = form.querySelector("[data-status-error]");
    var submit = form.querySelector("[type=submit]");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      ok.hidden = true;
      err.hidden = true;

      // Required fields: say "Required." in words, not colour alone.
      var firstInvalid = null;
      form.querySelectorAll("[required]").forEach(function (input) {
        var field = input.closest(".at-field");
        var hint = field && field.querySelector(".at-field__hint");
        var bad = !input.checkValidity();
        if (field) field.classList.toggle("is-invalid", bad);
        input.setAttribute("aria-invalid", bad ? "true" : "false");
        if (hint) hint.textContent = bad ? hint.getAttribute("data-required") : hint.getAttribute("data-hint") || "";
        if (bad && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) { firstInvalid.focus(); return; }

      // No endpoint configured yet: say so rather than pretend it was sent.
      if (!form.getAttribute("action")) { err.hidden = false; err.focus(); return; }

      submit.disabled = true;
      fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      })
        .then(function (res) {
          if (!res.ok) throw new Error(res.status);
          form.reset();
          ok.hidden = false;
          ok.focus();
        })
        .catch(function () {
          err.hidden = false;
          err.focus();
        })
        .finally(function () { submit.disabled = false; });
    });
  }

  /* Process of work (About): each card's illustration fills in as it scrolls in; the left rail bars follow. */
  var cards = Array.prototype.slice.call(document.querySelectorAll("[data-stage]"));
  if (cards.length) {
    var rail = Array.prototype.slice.call(document.querySelectorAll("[data-rail]"));
    var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
    var parts = cards.map(function (card) {
      return Array.prototype.slice.call(card.querySelectorAll(".piece")).map(function (el) {
        var f = (el.getAttribute("data-from") || "0,24").split(",");
        return { el: el, x: parseFloat(f[0]), y: parseFloat(f[1]) };
      });
    });
    var paint = function (i, p) {
      var list = parts[i], n = list.length;
      list.forEach(function (it, k) {
        var e = still ? 1 : ease(Math.min(1, Math.max(0, p * n - k)));
        it.el.style.opacity = e;
        it.el.style.transform = "translate(" + ((1 - e) * it.x).toFixed(1) + "px," + ((1 - e) * it.y).toFixed(1) + "px)";
      });
    };
    var queued = false;
    var update = function () {
      queued = false;
      var vh = window.innerHeight, active = 0;
      var prog = cards.map(function (card) {
        var cs = window.getComputedStyle(card);
        var end = cs.position === "sticky" ? parseFloat(cs.top) || 0 : vh * 0.3;
        var top = card.getBoundingClientRect().top;
        return Math.min(1, Math.max(0, (vh * 0.9 - top) / Math.max(1, vh * 0.9 - end)));
      });
      prog.forEach(function (p, i) { if (p > 0) active = i; paint(i, p); });
      rail.forEach(function (item, i) {
        var bar = item.querySelector("[data-rail-bar]");
        if (bar) bar.style.width = (prog[i] * 100).toFixed(1) + "%";
        item.classList.toggle("is-active", i === active);
      });
    };
    var queue = function () { if (!queued) { queued = true; window.requestAnimationFrame(update); } };
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    update();
  }
})();
