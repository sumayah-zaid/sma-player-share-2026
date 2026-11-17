/* ═══════════════════════════════════════════════════════════════════════
   SMA PLAYER · Direction A — scroll choreography, part 2
   KAMAYA Design · Senior Creative Director · 2026-11-11
   Pairs with `scroll-cinematic.css`. Arabic page only. No dependencies.

   Deliberately additive: `script.js` is not modified, not re-pointed and
   not wrapped. This file only touches elements `script.js` provably does
   not (see REVEAL_ITEMS in script.js §3 — the guard below re-checks at
   runtime rather than trusting that list to stay in sync).

   Contract:
     · one arrival per element, then it is released;
     · nothing is ever hidden by this file unless it is also guaranteed to
       be shown (the `sc-on` class, the in-view pass, the settle sweep and
       the load sweep are four independent ways for an element to arrive);
     · no scroll is ever intercepted, redirected, smoothed or delayed;
     · every listener is passive, every write is inside one rAF;
     · nothing is read or written for a camp cover that is off screen.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var root = document.documentElement;
  if (root.lang !== 'ar') return;            /* belt and braces: AR only */

  /* QA hook. `tools/qa-scroll-cover.html` opens the page with
     ?scmotion=off to exercise the reduced-motion path in a headless
     browser that cannot be told to emulate the OS preference. Nothing on
     the site ever sets it. */
  try {
    if (new URLSearchParams(location.search).get('scmotion') === 'off') {
      root.setAttribute('data-sc-motion', 'off');
    }
  } catch (e) { /* URLSearchParams absent — ignore, motion simply stays on */ }

  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reduced() {
    return root.getAttribute('data-sc-motion') === 'off' || !!(mq && mq.matches);
  }

  function all(sel, root_) {
    return Array.prototype.slice.call((root_ || document).querySelectorAll(sel));
  }

  /* ──────────────────────────────────────────────────────────────────
     1 · Which elements get an arrival

     Only the four sections that currently arrive completely still. The
     camp cards, method articles, coach grid, vision block, offer list,
     leadership cards, wins list and channels are all already animated by
     script.js and appear nowhere below — and the `.reveal` guard in
     collect() catches it anyway if that ever changes.
     ────────────────────────────────────────────────────────────────── */
  var GROUPS = [
    { sel: '#a-identity > .sec-head > *',        lead: 'h2' },
    { sel: '#a-clubs .a-clubs__intro > *',       lead: 'h2' },
    { sel: '#a-clubs .a-clubs__count' },
    { sel: '#a-clubs .a-clubs__toolbar' },
    { sel: '#a-gallery > .sec-head > *',         lead: 'h2' },
    { sel: '#a-media .a-press__head > div > *',  lead: 'h2' },
    { sel: '#a-media .a-press__total' },
    { sel: '#a-media .a-press__eyebrow' },
    { sel: '#a-media .a-press__card' },
    { sel: '#a-media .a-press__morehead' }
  ];

  var STAGGER = 60;     /* ms between siblings */
  var STAGGER_MAX = 180;/* never let a group take longer than this to start */

  var items = [];
  GROUPS.forEach(function (group) {
    all(group.sel).forEach(function (node, i) {
      /* Never double-animate: skip anything script.js has already claimed,
         and skip anything already claimed here (selectors could overlap
         after a future edit). */
      if (node.classList.contains('reveal')) return;
      if (node.classList.contains('sc-rise')) return;
      node.classList.add('sc-rise');
      if (group.lead && node.matches(group.lead)) node.classList.add('sc-rise--lead');
      if (i) node.style.transitionDelay = Math.min(i * STAGGER, STAGGER_MAX) + 'ms';
      items.push(node);
    });
  });

  /* The pre-state in the stylesheet is gated on this class, so until this
     line runs nothing on the page is hidden. */
  if (items.length) root.classList.add('sc-on');

  function show(node) { node.classList.add('sc-in'); }
  function showAll() { items.forEach(show); }

  /* ──────────────────────────────────────────────────────────────────
     2 · Arrival
     ────────────────────────────────────────────────────────────────── */
  var riseIO = null;

  function startRise() {
    if (reduced() || !('IntersectionObserver' in window)) { showAll(); return; }

    riseIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        show(entry.target);
        riseIO.unobserve(entry.target);   /* once, then released */
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.1 });

    items.forEach(function (node) {
      /* Anything already on screen — including after a deep link or a
         back-navigation that restores scroll position — is shown outright.
         A reveal waiting for a scroll that already happened is just
         missing content. */
      var r = node.getBoundingClientRect();
      if (r.top < innerHeight * 0.94 && r.bottom > 0) show(node);
      else riseIO.observe(node);
    });
  }

  /* Settle sweep. Same guard script.js §3 uses, same reasoning: it can only
     ever ADD `sc-in` to something the visitor has already reached, so it
     can never hide anything, and it closes the one failure mode that is
     silent and total (a very fast flick past an observed element). */
  function sweep() {
    all('.sc-rise:not(.sc-in)').forEach(function (n) {
      if (n.getBoundingClientRect().top < innerHeight * 0.97) show(n);
    });
  }

  var sweepTimer = null;
  function scheduleSweep() {
    if (sweepTimer) clearTimeout(sweepTimer);
    sweepTimer = setTimeout(sweep, 140);
  }

  /* ──────────────────────────────────────────────────────────────────
     3 · Camp cover depth

     Written to the `translate` property, never `transform` — see the long
     note in scroll-cinematic.css §2. Only covers that are currently
     intersecting are in `live`, so a card that is off screen costs
     nothing per frame.
     ────────────────────────────────────────────────────────────────── */
  var MAX = 10;                 /* px. Commission cap is 12. */
  var covers = all('#a-camps .a-camp > img');
  var live = [];
  var last = new WeakMap();
  var raf = 0;
  var coverIO = null;

  function clearCovers() {
    covers.forEach(function (img) { img.style.translate = ''; last.set(img, null); });
  }

  function paint() {
    raf = 0;
    if (reduced()) return;
    var vh = innerHeight || 1;
    for (var i = 0; i < live.length; i++) {
      var img = live[i];
      var card = img.parentNode;
      if (!card) continue;
      var r = card.getBoundingClientRect();
      if (!r.height) continue;
      /* +1 when the card's middle sits a full travel below the viewport
         middle, -1 when it sits that far above it. */
      var span = (vh + r.height) / 2;
      var p = ((r.top + r.height / 2) - vh / 2) / span;
      if (p > 1) p = 1; else if (p < -1) p = -1;
      var off = -p * MAX;
      var prev = last.get(img);
      if (prev !== null && prev !== undefined && Math.abs(off - prev) < 0.3) continue;
      last.set(img, off);
      img.style.translate = '0px ' + off.toFixed(2) + 'px';
    }
  }

  function onScroll() {
    if (raf || !live.length || reduced()) return;
    raf = requestAnimationFrame(paint);
  }

  function startCovers() {
    if (!covers.length) return;
    if (reduced()) { clearCovers(); return; }
    if (!('IntersectionObserver' in window)) return;  /* no depth, no harm */

    coverIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var at = live.indexOf(e.target);
        if (e.isIntersecting && at === -1) live.push(e.target);
        else if (!e.isIntersecting && at !== -1) {
          live.splice(at, 1);
          e.target.style.translate = '';   /* leave nothing running off screen */
          last.set(e.target, null);
        }
      });
      onScroll();
    }, { rootMargin: '12% 0px' });

    covers.forEach(function (img) { coverIO.observe(img); });
  }

  /* ──────────────────────────────────────────────────────────────────
     4 · Wiring
     ────────────────────────────────────────────────────────────────── */
  startRise();
  startCovers();

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('scroll', scheduleSweep, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  window.addEventListener('resize', scheduleSweep, { passive: true });
  /* A deep link handled after load, and the back/forward cache restoring a
     scroll position, both land here rather than on a scroll event. */
  window.addEventListener('hashchange', scheduleSweep);
  window.addEventListener('pageshow', function () { sweep(); onScroll(); });
  window.addEventListener('load', function () {
    sweep(); onScroll();
    setTimeout(function () { sweep(); onScroll(); }, 900);
  });

  /* Live preference change, both directions. Turning reduced motion ON
     reveals everything immediately and parks the covers. Turning it OFF
     again deliberately does NOT re-hide anything that is already visible —
     content never disappears because a setting changed. */
  function onPreference() {
    if (reduced()) {
      if (riseIO) riseIO.disconnect();
      showAll();
      clearCovers();
      live.length = 0;
      if (coverIO) { coverIO.disconnect(); coverIO = null; }
    } else if (!coverIO) {
      startCovers();
      onScroll();
    }
  }
  if (mq) {
    if (mq.addEventListener) mq.addEventListener('change', onPreference);
    else if (mq.addListener) mq.addListener(onPreference);
  }

  /* Read-only handle for `tools/qa-scroll-cover.html`. No behaviour hangs
     off it; it exists so the QA harness can assert against real numbers
     instead of against screenshots alone. */
  window.__smaScrollCinematic = {
    version: '2026-11-11',
    max: MAX,
    items: function () { return items.slice(); },
    covers: function () { return covers.slice(); },
    live: function () { return live.slice(); },
    reduced: reduced,
    pending: function () { return all('.sc-rise:not(.sc-in)').length; }
  };
})();
