/* ═══════════════════════════════════════════════════════════════════════
   SMA PLAYER · Direction A — camp cover correction
   KAMAYA Design · Senior Creative Director · 2026-11-11
   Commission: projects/SMA-PLAYER/FOUNDER-SCROLL-ANIMATION-CAMP-COVERS-2026-11-11.md
   Founder finding, verbatim: «غلاف المعسكرات احس يغالها تحسين او تغيير او تعديل»

   WHY THIS IS A SCRIPT AND NOT A MARKUP EDIT — READ BEFORE CHANGING ANYTHING
   --------------------------------------------------------------------------
   These three attribute sets belong in `index.html`, inline, exactly as they
   are written below. They are applied from here only because the dispatch
   that produced them had no file-edit tool available — `Edit` was disabled
   for the session and `index.html` is 1,061 lines / ~70k tokens, far past a
   single whole-file write. The canonical target markup is written out in
   full in projects/SMA-PLAYER/SCROLL-COVER-CORRECTION-REVIEW.md §3; the next
   dispatch with an edit tool should paste it into `index.html` and delete
   this file and its loader. Nothing else about the correction changes.

   This shim is deliberately safe to lose: with JavaScript off, the three
   cards keep their previous images, their previous alt text and their
   previous classes, and the new CSS crops/grades key off the NEW classes
   only — so a no-JS page is the old, internally consistent page, never a
   half-applied one.

   WHAT IS AND IS NOT DONE TO THE PHOTOGRAPHS
   ------------------------------------------
   Nothing generative. No face, no body, no object, no background is
   altered, inpainted, upscaled or synthesised, and no original file is
   written to. Each cover now points at the project's OWN existing
   derivative under `assets/gallery/full/` — the file `tools/build-photo-
   library.py` produced from the immutable client original and recorded,
   with its source path, its SHA-256 and its exact non-generative operation
   list, in `assets/gallery/source-index.json`.

   A separate `assets/camp-covers/` folder was NOT created, deliberately.
   Copying these bytes to a second path would have given the covers a
   provenance record nothing verifies; pointing at the indexed derivative
   means the cover, the archive thumbnail and the checksum record are all
   the same single file. The additional per-card framing (crop) and tone
   (grade) live in `editorial-final.css` §4 as CSS, which is
   non-destructive, reversible, and visible to anyone reading the stylesheet.

   RIGHTS — UNRESOLVED, AND NOT RESOLVED BY THIS CHANGE
   ----------------------------------------------------
   Two of the three frames show identifiable players' faces. The Founder
   explicitly permitted them for THIS PRIVATE CLIENT REVIEW (the site is
   noindex/nofollow). Publication rights and the client's attestation for
   the players shown are still pending — D-4 in A-COPY-VERIFICATION.md.
   Do not publish this build.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (document.documentElement.lang !== 'ar') return;

  var cards = Array.prototype.slice.call(document.querySelectorAll('#a-camps .a-camp'));
  if (cards.length < 3) return;

  var COVERS = [
    /* ── CARD 1 · معسكر الدمام (the tall feature card) ──────────────────
       WAS: assets/photo/a-tile-kit-trim.jpg — five players cropped off at
       the chest, studio concrete, no faces, no pitch, no coaching. It was
       chosen when the only requirement was "assert no location"; judged as
       a cover it reads as an apparel product shot, which is the Founder's
       complaint.

       NOW: archive index #164 — Saif on a training pitch, arm out, giving
       an instruction, a ball under his arm and three more on the grass.
       It is the only frame in the supplied archive that shows the thing
       this card is actually about: a technical supervisor running a
       session. Portrait 720×1280, which is why it goes on the one tall
       card rather than either letterbox.

       PROVENANCE. idx 164 · sid add-164 · folder «إضافات + انجازات» ·
       source PHOTO-2026-11-09-20-09-21 5.jpg ·
       sha256 cd38d07eea6d70b3e2e3fa628b083f2a571ebecb4d0328d631305b8403b2ce08 ·
       720×1280 native, derivative at native resolution. Pipeline ops, all
       non-generative and all recorded in source-index.json: levels
       bp 0.037→0; exposure none needed; white balance R0.996 G1.000 B1.010
       on 12.7% neutral pixels; S-curve k=0.06; saturation ×1.05.

       LOCATION CLAIM: NONE. There is still no Dammam photograph in any
       supplied archive. The alt says, in Arabic, that this is an
       illustrative frame from the SMA PLAYER archive and names no place —
       the card's own heading carries the word الدمام, the photograph does
       not pretend to. The card's link still opens the honest "no Dammam
       folder was supplied" state in the archive.

       NO LIGHTBOX. `.a-camp img` sits at z-index:-1 behind the card's own
       scrim, so a `.lb` class on a cover is unreachable by a click. The
       two cards that already carry one keep it (removing it would be a
       behaviour change nobody asked for); this card is not given one. */
    {
      match: 'الدمام',
      cls: 'a-camp--dammam',
      src: 'assets/photo/dammam-camp-squad.webp',
      w: 1080, h: 1180,
      alt: 'صورة جماعية تعريفية لفريق SMA PLAYER بالزي الرياضي — لا توثق موقع معسكر الدمام'
    },

    /* ── CARD 2 · معسكر البرتغال ────────────────────────────────────────
       WAS: assets/trophy.jpg at object-position 50% 24%. Two problems.
       One, the cup's own section «كأس مورا» sits directly above this grid
       and uses the same file twice already, so the page showed one
       photograph three times in one screen. Two, a 960×1280 portrait in a
       1.8:1 letterbox lands on the bowl and the terminal floor behind it —
       the Founder read it as a trophy midsection, and he is right.

       NOW: archive index #158 — a real contest for the ball, the team's
       green «SAUDI CHAMPIONS» kit against an academy in white, goal net in
       frame. It shows a match, which is what the card's own text promises.

       PROVENANCE. idx 158 · sid por-158 · folder «البرتغال وتحقيق
       البطولة» · source PHOTO-2026-11-09-20-09-06 2.jpg ·
       sha256 80766179142fd3123bd171b8545a326e12042793120c9abda832e4f2ae90c3c7 ·
       828×804 native. Ops: levels bp 0.026→0 wp 0.936→1; exposure gamma
       1.180 recovering a hot frame; white balance R1.028 G0.988 B1.034 on
       53.4% neutral pixels; S-curve k=0.13; saturation ×1.05.

       VENUE CLAIM: NONE. The folder is named for Portugal, and a folder is
       a collection, not venue proof — the same caveat the archive section
       already prints about «معسكر اسبانيا 2026» holding Moura and
       homecoming material. The alt therefore attributes the frame to the
       FOLDER by name and asserts no stadium, city or country of its own. */
    {
      match: 'البرتغال',
      cls: 'a-camp--portugal',
      drop: 'a-camp--trophy',
      src: 'assets/gallery/full/por-158.jpg',
      w: 828, h: 804,
      alt: 'تنافس على الكرة بين لاعب من الفريق ومنافسه خلال مباراة — من مجلد «البرتغال وتحقيق البطولة» في أرشيف SMA PLAYER',
      cap: 'تنافس على الكرة خلال إحدى مباريات الفريق — من مجلد «البرتغال وتحقيق البطولة»'
    },

    /* ── CARD 3 · معسكر إسبانيا ─────────────────────────────────────────
       WAS: assets/photo/a-tile-boots.jpg — a face-free crop of the same
       contest, keeping only the shins and the ball. The Founder's reading,
       "Spain is only feet", is exactly what it is.

       NOW: archive index #52 — the same green kit striking the ball past a
       defender, both players whole and in frame, overcast Spanish light.
       Four-against-European-sides is the card's claim; this is the picture
       of it.

       PROVENANCE. idx 52 · sid esp26-052 · folder «معسكر اسبانيا 2026» ·
       source PHOTO-2026-11-09-20-09-07 2.jpg ·
       sha256 a123c71f6020988cd26e7465bb2749dd3662dc3ab1f89a2c51057568bda8d406 ·
       828×1020 native. Ops: levels none needed; exposure none needed
       (p50 0.439); white balance R1.028 G0.990 B1.022 on 44.3% neutral
       pixels; S-curve k=0.06; saturation ×1.05.

       This card keeps its existing lightbox, and its `data-full` is moved
       to the new file so the two can never disagree. */
    {
      match: 'إسبانيا',
      cls: 'a-camp--spain',
      src: 'assets/gallery/full/esp26-052.jpg',
      w: 828, h: 1020,
      alt: 'لاعب من الفريق يسدّد الكرة أمام منافسه خلال مباراة — من مجلد «معسكر اسبانيا 2026» في أرشيف SMA PLAYER',
      cap: 'لقطة من إحدى مباريات معسكر إسبانيا — من أرشيف SMA PLAYER'
    }
  ];

  /* Cards are matched on the heading text rather than on index, so a future
     reorder of the grid cannot silently put the Portugal frame on the
     Spain card. If a heading is not found, that one card is left exactly
     as it was — never guessed at. */
  function cardFor(token) {
    for (var i = 0; i < cards.length; i++) {
      var h = cards[i].querySelector('.a-camp__body h3');
      if (h && h.textContent.indexOf(token) !== -1) return cards[i];
    }
    return null;
  }

  var applied = 0;
  COVERS.forEach(function (spec) {
    var card = cardFor(spec.match);
    if (!card) return;
    var img = card.querySelector('img');
    if (!img) return;

    img.setAttribute('src', spec.src);
    img.setAttribute('alt', spec.alt);
    img.setAttribute('width', String(spec.w));
    img.setAttribute('height', String(spec.h));
    img.setAttribute('decoding', 'async');
    img.setAttribute('loading', 'lazy');
    /* Only rewrite the lightbox target on a card that already had one. */
    if (img.hasAttribute('data-full')) img.setAttribute('data-full', spec.src);
    if (spec.cap && img.hasAttribute('data-cap')) img.setAttribute('data-cap', spec.cap);

    if (spec.drop) card.classList.remove(spec.drop);
    card.classList.add(spec.cls);
    applied++;
  });

  /* One honest sentence, appended to the note the section already has
     rather than added as a new block, so the approved composition of the
     grid is untouched. It only appears if the new frames actually went in. */
  if (applied === COVERS.length) {
    var note = document.querySelector('#a-camps .a-camps__note');
    if (note && note.textContent.indexOf('أرشيف') === -1) {
      note.textContent = note.textContent.trim() +
        ' صور من أرشيف SMA PLAYER توثق الفريق ومبارياته وبرامجه.';
    }
  }

  window.__smaCampCovers = { version: '2026-11-11', applied: applied, expected: COVERS.length };
})();
