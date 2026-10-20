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
    prev.addEventListener("click", function () { track.scrollBy({ left: -step() * sign }); });
    next.addEventListener("click", function () { track.scrollBy({ left: step() * sign }); });
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
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
})();
