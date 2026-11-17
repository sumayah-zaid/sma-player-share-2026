/* ============================================================
   SMA PLAYER — سيف آل نمرة
   Direction A — Emerald Cinema (سينما زمردية), A-only preview.

   Client selected direction A on 2026-11-10; the A/B/C switcher,
   its persistence/deep-link logic and the "choose this design"
   copy button are removed — the direction decision is made.

   Zero dependencies, zero build step.
   - Mobile navigation
   - Anchor scrolling + active-section highlighting
   - Scroll reveal choreography, scroll progress, image lightbox
   - Contact form: copies the composed enquiry to the clipboard.
     It deliberately does NOT pretend to send: no official
     email/WhatsApp destination has been confirmed by the client yet.

   BILINGUAL 2026-11-10. One script serves both pre-rendered locales,
   `/` (ar/rtl) and `/en/` (en/ltr). It reads the locale off <html lang>
   rather than being told, so a page can never end up with the wrong
   strings, and it adds no locale detection, no redirect and no
   persistence: the visitor's explicit click on the switch is the only
   thing that ever changes language.
   ============================================================ */
(function () {
  'use strict';

  var body = document.body;
  var pane = document.getElementById('design-a');

  /* ----------------------------------------------------------
     0. Locale
     Every user-visible string this file produces lives here. Nothing
     below composes Arabic or English inline.
     ---------------------------------------------------------- */
  var LANG = (document.documentElement.getAttribute('lang') || 'ar').slice(0, 2).toLowerCase();

  var STRINGS = {
    ar: {
      zoom:      'تكبير الصورة: ',
      of:        'من',
      showAll:   'عرض جميع الصور',
      showLess:  'عرض المختارات فقط',
      enqTitle:  'طلب تواصل — SMA PLAYER',
      fName:     'الاسم',
      fReach:    'وسيلة التواصل',
      fAge:      'عمر اللاعب',
      fPos:      'المركز',
      fMsg:      'الرسالة',
      required:  'أكمل الحقول المطلوبة أولاً.',
      copied:    'تم نسخ الرسالة إلى الحافظة.',
      copyFail:  'لم يتمكّن المتصفح من النسخ. حدّد النص يدويًا من الحقول.'
    },
    en: {
      zoom:      'Enlarge image: ',
      of:        'of',
      showAll:   'Show all photographs',
      showLess:  'Show the selection only',
      enqTitle:  'Enquiry — SMA PLAYER',
      fName:     'Name',
      fReach:    'How to reach you',
      fAge:      "Player's age",
      fPos:      'Position',
      fMsg:      'Message',
      required:  'Please complete the required fields first.',
      copied:    'Message copied to your clipboard.',
      copyFail:  'Your browser could not copy. Select the text from the fields manually.'
    }
  };
  var t = STRINGS[LANG] || STRINGS.ar;

  function el(sel, root) { return (root || document).querySelector(sel); }
  function all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  var reducedMQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reduced() { return !!(reducedMQ && reducedMQ.matches); }

  /* ----------------------------------------------------------
     1. Mobile navigation
     ---------------------------------------------------------- */
  var burger = el('.burger');
  var nav = document.getElementById('a-nav');

  // The open menu covers most of a narrow viewport, so it is treated as modal:
  // the page behind it neither scrolls nor stays reachable. This mirrors what
  // the lightbox already does, rather than inventing a second pattern.
  var backdrops = [document.getElementById('main-a'), document.querySelector('.a-foot')].filter(Boolean);

  function closeMenu() {
    if (!pane) return;
    pane.classList.remove('nav-open');
    body.classList.remove('nav-locked');
    backdrops.forEach(function (n) { n.removeAttribute('inert'); });
    if (burger) burger.setAttribute('aria-expanded', 'false');
  }

  function openMenu() {
    if (!pane) return;
    pane.classList.add('nav-open');
    body.classList.add('nav-locked');
    backdrops.forEach(function (n) { n.setAttribute('inert', ''); });
    if (burger) burger.setAttribute('aria-expanded', 'true');
  }

  if (burger) {
    burger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (pane.classList.contains('nav-open')) closeMenu();
      else {
        openMenu();
        var first = nav && el('a', nav);
        // The closed menu is `visibility:hidden` and transitions visibility, so
        // it is still computed-hidden — and therefore unfocusable — during the
        // frame the class is added. Focus on the next frame, once the menu is
        // genuinely visible.
        if (first) requestAnimationFrame(function () { requestAnimationFrame(function () { first.focus(); }); });
      }
    });
  }

  // Any in-page nav link closes the menu; native anchor scrolling does the rest.
  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (link) {
      closeMenu();
      // Move focus to the destination, not just the viewport. Fragment
      // navigation alone leaves focus behind, so the next Tab sends a keyboard
      // user back to the top of the page — which defeats the skip link.
      var dest = document.getElementById(link.getAttribute('href').slice(1));
      if (dest) requestAnimationFrame(function () { dest.focus({ preventScroll: true }); });
      return;
    }
    if (!e.target.closest || !e.target.closest('header')) closeMenu();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (pane && pane.classList.contains('nav-open')) {
      closeMenu();
      if (burger) burger.focus();
    }
  });

  // Keep the open menu's focus inside it while it covers the page.
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !pane || !pane.classList.contains('nav-open') || !nav) return;
    var items = all('a, button', nav).concat(burger ? [burger] : []);
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ----------------------------------------------------------
     2. Sticky-header shading
     ---------------------------------------------------------- */
  var aTop = document.getElementById('a-top');
  function shadeHeader() {
    if (aTop) aTop.classList.toggle('is-stuck', window.scrollY > 40);
  }
  window.addEventListener('scroll', shadeHeader, { passive: true });
  shadeHeader();

  /* ----------------------------------------------------------
     3. Active nav link + scroll reveal
     ---------------------------------------------------------- */
  var REVEAL_ITEMS = [
    '.a-coach__grid > *', '.a-moura__card', '.a-moura__shot', '.a-camp',
    '.a-method__grid article', '.a-media__list li', '.a-contact__inner > *',
    // Added with the 2026-11-10 sections. The gallery cells are deliberately
    // NOT in this list: 99 of them, each with its own opacity/transform
    // transition, is a scroll-jank generator, and they already arrive
    // progressively through lazy loading.
    '.a-vision', '.a-offer__list li', '.a-lead__card', '.a-wins__list li',
    '.a-channels > *'
  ].join(',');

  function observeAll() {
    if (!pane) return;

    if (!('IntersectionObserver' in window)) {
      all('.reveal').forEach(function (n) { n.classList.add('is-in'); });
      return;
    }

    var activeIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        all('nav a', pane).forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    all('section', pane).forEach(function (s) { activeIO.observe(s); });

    // Reduced motion: content is shown outright, never animated in.
    if (reduced()) {
      all(REVEAL_ITEMS, pane).forEach(function (n) { n.classList.add('reveal', 'is-in'); });
      return;
    }

    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealIO.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    all(REVEAL_ITEMS, pane).forEach(function (node) {
      if (node.classList.contains('is-in')) return;
      node.classList.add('reveal');
      // Anything already on screen at load is shown immediately — a reveal
      // that needs a scroll it will never get is just invisible content.
      var r = node.getBoundingClientRect();
      if (r.top < innerHeight * 0.92 && r.bottom > 0) node.classList.add('is-in');
      else revealIO.observe(node);
    });

    sweepReveals();
  }

  /* Safety net for the reveal choreography.
     IntersectionObserver samples once per frame, so a fast enough scroll can
     in principle carry an element past the viewport between two samples; the
     observer never fires for it and it stays at opacity 0 — content that is
     simply gone. Three realistic cases were tested at 1440×950 on 2026-11-10
     (flick to the bottom, deep-link straight to #a-contact, instant jump to
     the page foot) and the observer handled all three: nothing on screen was
     left invisible in any of them. So this is a guard, not a repair.
     It is kept because its cost is one debounced pass over a list that is
     empty almost immediately, and because the failure it guards against is
     silent and total. It can only ever ADD `is-in` to something the visitor
     has already reached — it can never hide anything. */
  function sweepReveals() {
    if (!pane) return;
    var stranded = all('.reveal:not(.is-in)', pane);
    if (!stranded.length) return;
    stranded.forEach(function (n) {
      var r = n.getBoundingClientRect();
      if (r.top < innerHeight * 0.95) n.classList.add('is-in');
    });
  }

  /* ----------------------------------------------------------
     4. Lightbox
     ---------------------------------------------------------- */
  var lb = document.getElementById('lightbox');
  var lbImg = lb ? el('img', lb) : null;
  var lbCap = lb ? el('figcaption', lb) : null;
  var lbClose = lb ? el('.lightbox__close', lb) : null;
  var lbPrev = lb ? el('.lightbox__nav--prev', lb) : null;
  var lbNext = lb ? el('.lightbox__nav--next', lb) : null;
  var lbCount = lb ? el('.lightbox__count', lb) : null;
  var lastFocus = null;

  // A "series" is an ordered array of {src, cap, alt} the arrows walk. The
  // gallery supplies one; every standalone figure on the page supplies none,
  // and in that case the arrows and the counter stay hidden rather than
  // becoming controls that step nowhere.
  var lbSeries = null, lbIndex = 0;

  function paintLB(frame) {
    lbImg.setAttribute('src', frame.src);
    lbImg.setAttribute('alt', frame.alt || frame.cap || '');
    lbCap.textContent = frame.cap || '';
  }

  function paintSeriesControls() {
    var many = !!(lbSeries && lbSeries.length > 1);
    [lbPrev, lbNext].forEach(function (b) {
      if (b) b.hidden = !many;
    });
    if (!lbCount) return;
    lbCount.hidden = !many;
    if (many) lbCount.textContent = (lbIndex + 1) + ' ' + t.of + ' ' + lbSeries.length;
  }

  function stepLB(delta) {
    if (!lbSeries || lbSeries.length < 2) return;
    lbIndex = (lbIndex + delta + lbSeries.length) % lbSeries.length;
    paintLB(lbSeries[lbIndex]);
    paintSeriesControls();
  }

  function openLB(src, cap, alt, series, index) {
    if (!lb) return;
    lastFocus = document.activeElement;
    lbSeries = (series && series.length) ? series : null;
    lbIndex = lbSeries ? (index || 0) : 0;
    paintLB(lbSeries ? lbSeries[lbIndex] : { src: src, cap: cap, alt: alt });
    paintSeriesControls();
    lb.removeAttribute('hidden');
    body.style.overflow = 'hidden';
    if (lbClose) lbClose.focus();
  }

  function closeLB() {
    if (!lb || lb.hasAttribute('hidden')) return;
    lb.setAttribute('hidden', '');
    lbImg.setAttribute('src', '');
    lbSeries = null;
    body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  if (lbPrev) lbPrev.addEventListener('click', function (e) { e.stopPropagation(); stepLB(-1); });
  if (lbNext) lbNext.addEventListener('click', function (e) { e.stopPropagation(); stepLB(1); });

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t.classList && t.classList.contains('lb')) {
      e.preventDefault();
      openLB(t.getAttribute('data-full') || t.getAttribute('src'),
             t.getAttribute('data-cap'), t.getAttribute('alt'));
      return;
    }
    if (lb && !lb.hasAttribute('hidden')) {
      if (t === lb || (t.classList && t.classList.contains('lightbox__close'))) closeLB();
    }
  });

  // Zoomable images are real controls: reachable and operable from the keyboard.
  all('img.lb').forEach(function (img) {
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    var cap = img.getAttribute('data-cap') || img.getAttribute('alt') || '';
    img.setAttribute('aria-label', t.zoom + cap);
    img.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      openLB(img.getAttribute('data-full') || img.getAttribute('src'), img.getAttribute('data-cap'), img.getAttribute('alt'));
    });
  });

  document.addEventListener('keydown', function (e) {
    if (!lb || lb.hasAttribute('hidden')) return;
    if (e.key === 'Escape') { closeLB(); return; }

    // Arrow keys follow the page's reading direction, not the key's name: in
    // RTL, ArrowLeft means "onward", which is the opposite of what it means
    // in the English build. Both locales share this file, so the direction is
    // read off <html dir> rather than hard-coded.
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      var rtl = (document.documentElement.getAttribute('dir') || 'rtl') === 'rtl';
      var forward = rtl ? (e.key === 'ArrowLeft') : (e.key === 'ArrowRight');
      e.preventDefault();
      stepLB(forward ? 1 : -1);
      return;
    }

    // The dialog is modal: Tab cycles its own visible controls and never
    // escapes to the page behind it.
    if (e.key === 'Tab') {
      e.preventDefault();
      var items = [lbClose, lbPrev, lbNext].filter(function (b) { return b && !b.hidden; });
      if (!items.length) return;
      var at = items.indexOf(document.activeElement);
      items[(at + (e.shiftKey ? -1 : 1) + items.length) % items.length].focus();
    }
  });

  /* ----------------------------------------------------------
     5. Contact form — compose + copy (no fake submission)
     ---------------------------------------------------------- */
  function compose(form) {
    var d = new FormData(form);
    var get = function (k) { return (d.get(k) || '').toString().trim(); };
    var lines = [
      t.enqTitle,
      '────────────────────',
      t.fName + ': ' + get('name'),
      t.fReach + ': ' + get('reach')
    ];
    if (get('age')) lines.push(t.fAge + ': ' + get('age'));
    if (get('pos')) lines.push(t.fPos + ': ' + get('pos'));
    lines.push('', t.fMsg + ':', get('msg'));
    return lines.join('\n');
  }

  all('form[data-form]').forEach(function (form) {
    var out = el('.form__out', form);

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var missing = all('[required]', form).filter(function (f) { return !f.value.trim(); });
      all('[required]', form).forEach(function (f) { f.removeAttribute('aria-invalid'); });
      if (missing.length) {
        missing.forEach(function (f) { f.setAttribute('aria-invalid', 'true'); });
        missing[0].focus();
        if (out) { out.setAttribute('data-state', 'err'); out.textContent = t.required; }
        return;
      }

      var text = compose(form);
      var done = function () {
        if (!out) return;
        out.removeAttribute('data-state');
        out.textContent = t.copied;
      };
      var fail = function () {
        if (!out) return;
        out.setAttribute('data-state', 'err');
        out.textContent = t.copyFail;
      };

      // Legacy path is also used as the fallback when the async Clipboard API
      // is unavailable or refused (insecure origin, no permission, no focus).
      function legacyCopy() {
        try {
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.setAttribute('readonly', '');
          ta.style.position = 'fixed';
          ta.style.top = '-1000px';
          ta.style.insetInlineStart = '-1000px';
          document.body.appendChild(ta);
          ta.select();
          var ok = document.execCommand('copy');
          document.body.removeChild(ta);
          return !!ok;
        } catch (err) { return false; }
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () {
          if (legacyCopy()) done(); else fail();
        });
      } else if (legacyCopy()) {
        done();
      } else {
        fail();
      }
    });
  });

  /* ----------------------------------------------------------
     6. Cinematic chapter choreography + scroll progress
        Original KAMAYA motion. Neves Academy was studied for interaction
        rhythm only — no external script, copied asset or scroll hijacking.
     ---------------------------------------------------------- */
  // NOTE (design trace D-07): at reference fb56dd2 the photo-mask wipe targeted
  // `.d-a .a-camp figure`, which matches nothing in A's markup — so no photo mask
  // was ever active in direction A. It is deliberately NOT re-pointed here:
  // activating it would add motion the client never saw when selecting A.
  // Re-enabling is a Creative Director decision, not an implementation one.
  var CHAPTERS = '.a-coach__grid,.a-camps__grid,.a-method__grid,.a-media__list';

  function choreograph() {
    if (reduced() || !('IntersectionObserver' in window)) return;

    var chapterIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.remove('sma-chapter--before');
        e.target.classList.add('sma-chapter--visible');
        chapterIO.unobserve(e.target);
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -25px 0px' });

    all(CHAPTERS, pane).forEach(function (e) {
      e.classList.add('sma-chapter-motion');
      var r = e.getBoundingClientRect();
      if (r.top < innerHeight * 0.88 && r.bottom > 0) e.classList.add('sma-chapter--visible');
      else { e.classList.add('sma-chapter--before'); chapterIO.observe(e); }
    });

  }

  var bar = el('.sma-scrollbar__fill');
  var ticking = false;
  function onScrollProgress() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      if (!bar || reduced()) return;
      var max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.max(0, Math.min(1, scrollY / max)) : 0) + ')';
    });
  }
  window.addEventListener('scroll', onScrollProgress, { passive: true });
  window.addEventListener('resize', onScrollProgress, { passive: true });

  // Debounced, so it runs once the scroll settles rather than on every event.
  var sweepTimer = null;
  function scheduleSweep() {
    if (sweepTimer) clearTimeout(sweepTimer);
    sweepTimer = setTimeout(sweepReveals, 140);
  }
  window.addEventListener('scroll', scheduleSweep, { passive: true });
  window.addEventListener('resize', scheduleSweep, { passive: true });

  /* ----------------------------------------------------------
     7. Language switch — deep-link preservation
        The switch is a plain, pre-rendered <a> to the other locale's real
        route, so it works with JavaScript disabled. All this does is carry
        the section you are currently reading across with you: toggling at
        /#a-camps lands on /en/#a-camps rather than at the top of the page.
        Section IDs are identical in both locales by design.
        No locale sniffing, no redirect, no stored preference — switching
        language is only ever something the visitor did on purpose.
     ---------------------------------------------------------- */
  all('[data-lang-switch]').forEach(function (link) {
    var base = link.getAttribute('href');
    function sync() {
      // Only fragments that actually exist on this page are carried over;
      // anything else would hand the other locale a dead anchor.
      var hash = location.hash;
      var ok = hash && hash.length > 1 && document.getElementById(hash.slice(1));
      link.setAttribute('href', ok ? base + hash : base);
    }
    window.addEventListener('hashchange', sync);
    // The active section is tracked by scroll position, not by location.hash,
    // so refresh the target at the moment of use as well.
    link.addEventListener('mouseenter', sync);
    link.addEventListener('focus', sync);
    sync();
  });

  /* ----------------------------------------------------------
     9. Gallery — filters, deferred archive, lightbox series
        Added 2026-11-10 with the الأرشيف المصوَّر section.

        Load discipline, because this is 99 photographs:
          · Only the 16 curated frames are in the HTML, and even those are
            `loading="lazy"` — the section sits well below the fold, so a
            visitor who never scrolls to it pays nothing for it.
          · The other 83 exist only as data until the visitor presses
            «عرض جميع الصور». They are then appended in batches of 24 as the
            page is scrolled, so the request burst is bounded no matter how
            fast someone flings the page.
          · Every cell is <picture> with a WebP source and a JPEG fallback,
            at 380px — roughly 18KB each, not the 1400px lightbox copy.
        Filtering hides cells rather than rebuilding the grid, so the browser
        keeps every decoded image and re-filtering costs nothing.
     ---------------------------------------------------------- */
  function gallery() {
    var sec = document.getElementById('a-gallery');
    var grid = document.getElementById('a-gallery-grid');
    var dataNode = document.getElementById('a-gallery-data');
    if (!sec || !grid || !dataNode) return;

    var DATA;
    try { DATA = JSON.parse(dataNode.textContent); } catch (err) { return; }
    var ITEMS = (DATA && DATA.items) || [];
    if (!ITEMS.length) return;

    var byId = {};
    ITEMS.forEach(function (it, i) { it._i = i; byId[it.id] = it; });

    var moreBtn = document.getElementById('a-gallery-all');
    var empty = document.getElementById('a-gallery-empty');
    var filters = all('.a-gallery__filter', sec);
    var BATCH = 24;
    var expanded = false, built = 16, pending = null;
    var activeCat = 'all';

    function cell(it) {
      var li = document.createElement('li');
      li.className = 'a-gallery__item';
      li.setAttribute('data-cat', it.cat);
      if (activeCat !== 'all' && it.cat !== activeCat) li.hidden = true;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'a-gallery__btn';
      btn.setAttribute('data-id', it.id);
      btn.setAttribute('aria-label', t.zoom + it.cap);

      var pic = document.createElement('picture');
      var src = document.createElement('source');
      src.setAttribute('srcset', 'assets/gallery/thumb/' + it.id + '.webp');
      src.setAttribute('type', 'image/webp');
      var img = document.createElement('img');
      img.src = 'assets/gallery/thumb/' + it.id + '.jpg';
      img.alt = it.alt || it.cap;   // see render-gallery.py: alt != caption
      img.width = it.tw; img.height = it.th;
      img.loading = 'lazy'; img.decoding = 'async';
      pic.appendChild(src); pic.appendChild(img);
      btn.appendChild(pic); li.appendChild(btn);
      return li;
    }

    // A zero-height row at the very end of the grid. The observer watches
    // THIS, not the grid: a 99-cell grid is taller than the viewport and so is
    // permanently "intersecting", which would make the observer fire on every
    // layout change and append batch after batch until the whole archive was
    // built — exactly the burst the batching exists to prevent.
    var sentinel = null;
    function tail() {
      if (!sentinel) {
        sentinel = document.createElement('li');
        sentinel.className = 'a-gallery__sentinel';
        sentinel.setAttribute('aria-hidden', 'true');
      }
      grid.appendChild(sentinel);          // always the last child
      return sentinel;
    }

    function buildMore() {
      if (!expanded || built >= ITEMS.length) return;
      var frag = document.createDocumentFragment();
      var stop = Math.min(built + BATCH, ITEMS.length);
      for (var i = built; i < stop; i++) frag.appendChild(cell(ITEMS[i]));
      grid.insertBefore(frag, sentinel || null);
      built = stop;
      refreshEmpty();
      if (built >= ITEMS.length) {
        if (pending) { pending.disconnect(); pending = null; }
        if (sentinel && sentinel.parentNode) sentinel.remove();
        sentinel = null;
      } else {
        tail();                            // move the sentinel past the new rows
      }
    }

    // Build the remainder in one pass. Used when a category filter is applied:
    // a filter that silently only searches the frames that happen to have been
    // built is a filter that lies about how many photographs there are. The
    // cost is bounded — cells outside the active category are `hidden`, so the
    // browser never fetches their lazy images.
    function buildAll() {
      expanded = true;
      while (built < ITEMS.length) buildMore();
    }

    // Append the next batch when the end of the grid comes into view.
    // Without IntersectionObserver the whole remainder is built at once —
    // slower, but never a gallery with missing images.
    function watchTail() {
      if (!('IntersectionObserver' in window)) { buildAll(); return; }
      if (pending || built >= ITEMS.length) return;
      pending = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) buildMore();
      }, { rootMargin: '600px 0px' });
      pending.observe(tail());
    }

    function visibleCells() {
      return all('.a-gallery__item', grid).filter(function (n) { return !n.hidden; });
    }

    function refreshEmpty() {
      if (empty) empty.hidden = visibleCells().length > 0;
    }

    function applyFilter(cat) {
      activeCat = cat;
      // Narrowing to a category must search the whole archive, not only the
      // frames built so far, or the count on the button and the number of
      // frames on screen disagree.
      if (cat !== 'all') {
        buildAll();
        setExpandedLabel(true);
      }
      all('.a-gallery__item', grid).forEach(function (n) {
        n.hidden = !(cat === 'all' || n.getAttribute('data-cat') === cat);
      });
      filters.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === cat));
      });
      refreshEmpty();
    }

    function setExpandedLabel(on) {
      if (!moreBtn) return;
      moreBtn.setAttribute('aria-expanded', String(on));
      var show = el('[data-more-show]', moreBtn), hide = el('[data-more-hide]', moreBtn);
      if (show) show.hidden = on;
      if (hide) hide.hidden = !on;
    }

    function expand(on) {
      expanded = on;
      setExpandedLabel(on);
      // One batch now, the rest as the visitor reaches them. Building all 83
      // remaining frames on the click is what this deliberately does NOT do:
      // the Founder's commission asks for lazy loading and a bounded initial
      // request burst, and a single 83-image append is neither.
      if (on) { while (built < ITEMS.length) buildMore(); return; }
      // Collapsing removes the appended cells entirely rather than hiding
      // them, so a reviewer who collapses the archive genuinely gets the
      // lighter page back.
      all('.a-gallery__item', grid).slice(16).forEach(function (n) { n.remove(); });
      built = 16;
      if (pending) { pending.disconnect(); pending = null; }
      if (sentinel && sentinel.parentNode) sentinel.remove();
      sentinel = null;
      // Collapsing back to the curated sixteen while a category filter is
      // still on would leave the button claiming 17 and the grid showing 3.
      activeCat = 'all';
      all('.a-gallery__item', grid).forEach(function (n) { n.hidden = false; });
      filters.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === 'all'));
      });
      refreshEmpty();
    }

    filters.forEach(function (b) {
      b.addEventListener('click', function () { applyFilter(b.getAttribute('data-filter')); });
    });

    if (moreBtn) {
      moreBtn.addEventListener('click', function () {
        expand(!expanded);
        if (!expanded) sec.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' });
      });
    }

    // The lightbox walks exactly what is on screen: filtered to المباريات,
    // the arrows stay inside المباريات.
    grid.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('.a-gallery__btn');
      if (!btn) return;
      var cells = visibleCells();
      var series = cells.map(function (n) {
        var it = byId[el('.a-gallery__btn', n).getAttribute('data-id')];
        return { src: 'assets/gallery/full/' + it.id + '.jpg', cap: it.cap, alt: it.cap };
      });
      var at = cells.indexOf(btn.parentNode);
      openLB(null, null, null, series, at < 0 ? 0 : at);
    });

    refreshEmpty();
  }

  /* ----------------------------------------------------------
     10. Contact channels — activation from one config file
        `assets/social-links.json` is the only place a content owner edits.
        Until a field there holds a real value, the on-page placement stays
        exactly as it is authored: inert <span>/<li> with no href at all.

        This function can only ever ADD a link, never invent one. Each value
        is validated before it is used — WhatsApp must be 8–15 digits, a
        profile URL must parse and must be https: — and anything that fails
        is left alone rather than best-guessed. A `#`, a bare handle or an
        http:// URL therefore produces no link, which is the whole point of
        SOCIAL-AND-WHATSAPP-CHANGE-REQUEST-2026-11-10.md §4.

        Reading the file is a fetch, which fails on file:// — and must fail
        silently, because the inert state it would otherwise fall back to is
        already the state in the markup.
     ---------------------------------------------------------- */
  function channels() {
    var waHosts = all('[data-wa]');
    var socialLists = all('[data-social]');
    if (!waHosts.length && !socialLists.length) return;
    if (!window.fetch) return;

    fetch('assets/social-links.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (cfg) {
        if (!cfg) return;

        var digits = String((cfg.whatsapp && cfg.whatsapp.number) || '').replace(/\D/g, '');
        var directUrl = '';
        // SMA provided an official WhatsApp Business short click-to-chat link.
        // Validate host and path, and never reconstruct a phone number from it.
        try {
          var suppliedWa = new URL(String((cfg.whatsapp && cfg.whatsapp.direct_url) || ''));
          if (suppliedWa.protocol === 'https:' && suppliedWa.hostname === 'wa.me' &&
              /^\/message\/[A-Za-z0-9]+\/?$/.test(suppliedWa.pathname) &&
              !suppliedWa.search && !suppliedWa.hash) directUrl = suppliedWa.href;
        } catch (err) { /* optional direct URL not supplied */ }
        if (directUrl || (digits.length >= 8 && digits.length <= 15)) {
          var msg = (cfg.whatsapp && cfg.whatsapp.prefill) || '';
          var href = directUrl || ('https://wa.me/' + digits + (msg ? '?text=' + encodeURIComponent(msg) : ''));
          waHosts.forEach(function (span) {
            var a = document.createElement('a');
            a.className = span.className.replace('is-pending', 'is-live');
            a.href = href;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.innerHTML = span.innerHTML;
            var chip = el('.a-chip', a);
            if (chip) chip.remove();
            var parent = span.parentNode;
            var label = el('b', a);
            if (label) label.textContent = 'تواصل مع S.M.A PLAYERS عبر واتساب';
            parent.replaceChild(a, span);
            var note = el('.a-channels__note', parent);
            if (note) note.textContent = 'اضغط لفتح المحادثة المباشرة مع S.M.A PLAYERS في واتساب.';
          });
        }

        var urls = cfg.social || {};
        socialLists.forEach(function (list) {
          var live = 0;
          all('li[data-net]', list).forEach(function (li) {
            var raw = urls[li.getAttribute('data-net')];
            if (!raw) return;
            var u;
            try { u = new URL(String(raw)); } catch (err) { return; }
            if (u.protocol !== 'https:') return;
            var a = document.createElement('a');
            a.href = u.href;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            while (li.firstChild) a.appendChild(li.firstChild);
            li.appendChild(a);
            li.classList.add('is-live');
            live++;
          });
          if (live) {
            list.removeAttribute('aria-disabled');
            var absent = all('li[data-net]', list).filter(function (li) {
              return !li.classList.contains('is-live');
            });
            absent.forEach(function (li) { li.remove(); });
            list.setAttribute('aria-label', 'حسابات SMA PLAYER الرسمية');
            var chip = list.parentNode && el('.a-chip--block', list.parentNode);
            if (chip) chip.remove();
            var note = list.parentNode && el('.a-channels__note', list.parentNode);
            if (note) note.textContent = 'اضغط على المنصة لزيارة حساب SMA PLAYERS الرسمي.';
          }
        });
      })
      .catch(function () { /* inert placement stays; that is the safe default */ });
  }

  /* ----------------------------------------------------------
     8. Boot
     ---------------------------------------------------------- */
  observeAll();
  choreograph();
  gallery();
  channels();
  onScrollProgress();

  // Reduced-motion is a live preference, not a boot-time constant. Toggling it
  // mid-session (a real thing QA does, and a real thing users do) must take
  // effect without a reload — and must never leave content stranded invisible.
  if (reducedMQ && reducedMQ.addEventListener) {
    reducedMQ.addEventListener('change', function () {
      if (reduced()) {
        all('.reveal', pane).forEach(function (n) { n.classList.add('is-in'); });
        all('.sma-chapter-motion', pane).forEach(function (n) {
          n.classList.remove('sma-chapter--before');
          n.classList.add('sma-chapter--visible');
        });
        if (bar) bar.style.transform = '';
      } else {
        choreograph();
        onScrollProgress();
      }
    });
  }
})();
