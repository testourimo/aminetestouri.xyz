/*
  Analytics, only with consent. The site works without this file.
  Nothing from Google or Microsoft is requested until the visitor accepts.
  IDs come from src/_data/site.json (data attributes on the banner). Without IDs there is no banner and this file does nothing.
*/
(function () {
  var banner = document.querySelector("[data-consent]");
  if (!banner) return;

  var GA4 = banner.getAttribute("data-ga4") || "";
  var CLARITY = banner.getAttribute("data-clarity") || "";
  var KEY = "consent";
  var loaded = false;

  function read() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function save(value) {
    try { localStorage.setItem(KEY, value); } catch (e) {}
  }

  function addScript(src) {
    var s = document.createElement("script");
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  }

  /* Load the trackers once, after consent. */
  function load() {
    if (loaded) return;
    loaded = true;

    if (GA4) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag("consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
      // Consent is already given here, so update it before config: the first page_view then counts in full.
      window.gtag("consent", "update", { analytics_storage: "granted" });
      window.gtag("js", new Date());
      window.gtag("config", GA4, { allow_google_signals: false, allow_ad_personalization_signals: false });
      addScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA4));
    }

    if (CLARITY) {
      window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
      window.clarity("consentv2", { ad_Storage: "denied", analytics_Storage: "granted" });
      addScript("https://www.clarity.ms/tag/" + encodeURIComponent(CLARITY));
    }
  }

  /* Withdraw: stop sending, ask both tools to drop their cookies. */
  function withdraw() {
    if (!loaded) return;
    if (GA4) {
      window["ga-disable-" + GA4] = true;
      if (window.gtag) window.gtag("consent", "update", { analytics_storage: "denied" });
    }
    if (CLARITY && window.clarity) window.clarity("consentv2", { ad_Storage: "denied", analytics_Storage: "denied" });
  }

  function show() { banner.hidden = false; }
  function hide() { banner.hidden = true; }

  function choose(value) {
    save(value);
    hide();
    if (value === "granted") {
      if (GA4) window["ga-disable-" + GA4] = false;
      load();
    } else {
      withdraw();
    }
  }

  banner.querySelectorAll("[data-consent-choice]").forEach(function (btn) {
    btn.addEventListener("click", function () { choose(btn.getAttribute("data-consent-choice")); });
  });

  /* Footer link: reopen the banner to change the choice. */
  document.querySelectorAll("[data-consent-open]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      show();
      var first = banner.querySelector("[data-consent-choice]");
      if (first) first.focus();
    });
  });

  var saved = read();
  if (saved === "granted") load();
  else if (saved !== "denied") show();

  /* Events. Sent only after consent. */
  function track(name, params) {
    if (!loaded || read() !== "granted") return;
    if (GA4 && window.gtag) window.gtag("event", name, params || {});
    if (CLARITY && window.clarity) window.clarity("event", name);
  }

  function where(el) {
    if (el.closest(".site-header")) return "header";
    if (el.closest(".site-footer")) return "footer";
    if (el.closest(".promo")) return "promo";
    if (el.closest(".hero")) return "hero";
    return "page";
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var card = t.closest("a.at-cthumb");
    if (card) {
      var title = card.querySelector(".at-cthumb__line");
      track("case_study_open", { name: title ? title.textContent.trim() : "", location: where(card) });
      return;
    }

    var link = t.closest("a[href]");
    if (link && /\/contact\/?$/.test(link.getAttribute("href"))) {
      track("contact_click", { location: where(link) });
      return;
    }
    if (link && link.hasAttribute("hreflang")) {
      track("language_switch", { to: link.getAttribute("hreflang") });
      return;
    }
    if (t.closest("[data-theme-toggle]")) track("theme_toggle");
  });

  document.addEventListener("site:contact-sent", function () { track("contact_form_sent"); });

  /* Easter Egg Mode: count visitors who find the coral cube. */
  var eggSent = false;
  new MutationObserver(function () {
    if (!eggSent && document.documentElement.getAttribute("data-mode") === "egg") {
      eggSent = true;
      track("easter_egg_found");
    }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode"] });
})();
