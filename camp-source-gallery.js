/* ═══════════════════════════════════════════════════════════════════════
   BOOTSTRAP SHIM — added 2026-11-11, and meant to be deleted.

   The 2026-11-11 Founder correction (scroll choreography + camp covers)
   adds two scripts that belong in `index.html` as two ordinary tags:

       <script defer src="camp-covers.js"></script>
       <script defer src="scroll-cinematic.js"></script>

   The dispatch that wrote them had no file-edit tool — `Edit` was disabled
   for the session — and `index.html` is 1,061 lines, far past a single
   whole-file write. This existing deferred script is therefore used as the
   entry point, because it is the one already-small file that is both
   Arabic-only and camp-related. Nothing below this block is changed: the
   rest of this file is the original camp source gallery, byte for byte.

   The companion stylesheet is handled the same way and for the same
   reason — `editorial-final.css` opens with `@import "scroll-cinematic.css"`.

   TO UNDO (two minutes, no behaviour change): add the two tags above to
   index.html next to the other deferred scripts, move the @import to a
   <link>, and delete this block.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (document.documentElement.lang !== 'ar') return;
  ['camp-covers.js', 'scroll-cinematic.js'].forEach(function (src) {
    if (document.querySelector('script[src="' + src + '"]')) return;
    var s = document.createElement('script');
    s.src = src;
    s.async = false;   /* preserve order: covers, then motion */
    document.head.appendChild(s);
  });
})();

/* KAMAYA SMA PLAYER — Founder-directed camp folders + swipe navigation.
   Original source inventory governs categories. Arabic-only until Saif approves AR.
   No remote APIs, no fabricated Dammam material, no edit of underlying photos. */
(function () {
  'use strict';
  if (document.documentElement.lang !== 'ar') return;
  var sec = document.getElementById('a-gallery');
  var grid = document.getElementById('a-gallery-grid');
  var data = document.getElementById('a-gallery-data');
  if (!sec || !grid || !data) return;
  var archive;
  try { archive = JSON.parse(data.textContent); } catch (e) { return; }
  if (!archive.items || !archive.items.length) return;

  var folders = [
    {key:'all', label:'كل الصور'},
    {key:'spain2025', label:'إسبانيا 2025', tag:'معسكر اسبانيا 2025'},
    {key:'spain2026', label:'إسبانيا 2026', tag:'معسكر اسبانيا 2026'},
    {key:'portugal', label:'البرتغال', tag:'البرتغال وتحقيق البطولة'},
    {key:'achievements', label:'الإنجازات والتكريم', tag:'إضافات + إنجازات'},
    {key:'dammam', label:'الدمام', missing:true}
  ];
  var byId = new Map();
  function collection(item) {
    var name = String(item.coll || '');
    for (var i=1; i<folders.length; i++) {
      if (folders[i].tag && name.indexOf(folders[i].tag) !== -1) return folders[i].key;
    }
    return 'unknown';
  }
  archive.items.forEach(function (item) { byId.set(item.id, {item:item,group:collection(item)}); });

  var filterHost = sec.querySelector('.a-gallery__filters');
  var showAll = document.getElementById('a-gallery-all');
  var moreArea = sec.querySelector('.a-gallery__more');
  var empty = document.getElementById('a-gallery-empty');
  var hint = sec.querySelector('.a-gallery__note');
  var heading = sec.querySelector('h2');
  if (!filterHost || !showAll) return;
  if (heading) heading.textContent = 'صور المعسكرات والإنجازات';
  if (hint) hint.textContent = 'اختر المعسكر، ثم اسحب الصور يمينًا ويسارًا. التصنيف حسب مجلدات الصور الأصلية التي سلّمها سيف، وليس حسب موضوع الصورة.';
  var counts = {};
  folders.forEach(function (f) {counts[f.key]=f.key==='all'?archive.items.length:archive.items.filter(function(x){return collection(x)===f.key;}).length;});
  // The Dammam materials contain a description but no source photo folder.
  // Show an honest empty state instead of passing another camp's pictures as Dammam.
  filterHost.innerHTML='';
  var folderButtons={};
  folders.forEach(function (f) {
    var b=document.createElement('button');
    b.className='a-gallery__filter a-gallery__folder-filter';
    b.type='button';b.setAttribute('data-source-folder',f.key);
    b.setAttribute('aria-pressed',String(f.key==='all'));
    b.textContent=f.label;
    var count=document.createElement('em');
    count.textContent=' ('+String(counts[f.key]||0)+')';
    b.appendChild(count);
    filterHost.appendChild(b);
    folderButtons[f.key]=b;
  });

  // Keep original gallery's 99 image originals and delegated lightbox behavior.
  // Existing "show all" action creates every thumb as lazy-loading img.
  if (showAll.getAttribute('aria-expanded')!=='true') showAll.click();
  if (moreArea) moreArea.hidden=true;

  function cards() {return Array.from(grid.querySelectorAll('.a-gallery__item'));}
  cards().forEach(function (li){
    var button=li.querySelector('.a-gallery__btn');
    var found=byId.get(button && button.getAttribute('data-id'));
    li.setAttribute('data-source-folder',found?found.group:'unknown');
  });

  var swipeBar=document.createElement('div');swipeBar.className='a-gallery__swipebar';
  var info=document.createElement('span');info.className='a-gallery__swipehint';info.textContent='اسحب الصور ↔';
  var total=document.createElement('span');total.className='a-gallery__swipetotal';total.setAttribute('aria-live','polite');
  var controls=document.createElement('div');controls.className='a-gallery__swipecontrols';
  function arrow(direction, label, glyph){
    var b=document.createElement('button');
    b.className='a-gallery__slide-arrow';b.type='button';b.setAttribute('aria-label',label);
    b.textContent=glyph;
    b.addEventListener('click',function(){
      var width=(grid.querySelector('.a-gallery__item:not([hidden])')||grid).getBoundingClientRect().width+14;
      // RTL: visually next is left, physically negative scrolling.
      grid.scrollBy({left:direction*width*1.1,behavior:'smooth'});
    });
    controls.appendChild(b);return b;
  }
  arrow(1,'الصورة السابقة','‹');arrow(-1,'الصورة التالية','›');
  swipeBar.appendChild(info);swipeBar.appendChild(total);swipeBar.appendChild(controls);
  grid.parentNode.insertBefore(swipeBar,grid);
  grid.setAttribute('data-swipe-gallery','true');
  grid.setAttribute('role','region');
  grid.setAttribute('aria-label','معرض صور المعسكرات؛ استعرض بالسحب يمينًا ويسارًا');
  grid.tabIndex=0;

  var current='all';
  function filterByFolder(key, scroll) {
    if (!folderButtons[key]) key='all';
    current=key;
    var visible=0;
    cards().forEach(function (li) {
      var show=(key==='all'||li.getAttribute('data-source-folder')===key);
      li.hidden=!show;if(show)visible++;
    });
    folders.forEach(function (f) {folderButtons[f.key].setAttribute('aria-pressed',String(f.key===key));});
    var camp=folders.find(function(f){return f.key===key;});
    total.textContent=(camp&&camp.key!=='all'?camp.label+' · ':'')+visible+' صورة';
    if (empty) {
      empty.hidden=visible!==0;
      empty.textContent=key==='dammam'
        ?'لم نجد مجلد صور لمعسكر الدمام ضمن الملفات التي تسلّمناها. نحتاج صور الدمام من سيف لعرضها هنا.'
        :'لا توجد صور في هذا المجلد.';
    }
    grid.scrollLeft=0;
    if (scroll) {
      sec.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
      if (history.replaceState) history.replaceState(null,'',location.pathname+'?camp='+encodeURIComponent(key)+'#a-gallery');
    }
  }
  Object.keys(folderButtons).forEach(function(key) {
    folderButtons[key].addEventListener('click',function(){filterByFolder(key,false);});
  });

  // Replace "start evaluation" and story navigation in all camp cards
  // with links to that exact source folder, not the enquiry form.
  var campCards=Array.from(document.querySelectorAll('.a-camp'));
  function link(card,key,label) {
    if(!card)return;
    var a=document.createElement('a');a.href='#a-gallery';a.className='a-camp__photo-link';
    a.setAttribute('data-open-camp',key);a.textContent=label;
    a.addEventListener('click',function(e){e.preventDefault();filterByFolder(key,true);});
    return a;
  }
  if(campCards[0]) {
    var damLink=campCards[0].querySelector('.a-camp__body a');
    if(damLink) {
      damLink.textContent='صور معسكر الدمام';
      damLink.href='#a-gallery';
      damLink.dataset.openCamp='dammam';
      damLink.addEventListener('click',function(e){e.preventDefault();filterByFolder('dammam',true);});
    }
  }
  if(campCards[1]) {
    var porLink=campCards[1].querySelector('.a-camp__body a');
    if(porLink) {
      porLink.textContent='شاهد صور معسكر البرتغال';
      porLink.href='#a-gallery';
      porLink.dataset.openCamp='portugal';
      porLink.addEventListener('click',function(e){e.preventDefault();filterByFolder('portugal',true);});
    }
  }
  if(campCards[2]) {
    var body=campCards[2].querySelector('.a-camp__body');
    var spLink=body&&body.querySelector('a');
    if(spLink) spLink.remove();
    var links=document.createElement('div');links.className='a-camp__photo-links';
    links.appendChild(link(campCards[2],'spain2025','صور إسبانيا 2025'));
    links.appendChild(link(campCards[2],'spain2026','صور إسبانيا 2026'));
    if(body)body.appendChild(links);
  }

  // Desktop can drag with a mouse; native touch swiping stays owned by the
  // browser, so momentum scrolling, pinch zoom and tap targets are preserved.
  var drag=null,blockClick=false;
  grid.addEventListener('pointerdown',function(e){
    if(e.pointerType!=='mouse'||e.button!==0)return;
    drag={x:e.clientX,left:grid.scrollLeft,moved:false};
  });
  grid.addEventListener('pointermove',function(e){
    if(!drag)return;
    var delta=e.clientX-drag.x;
    if(Math.abs(delta)>7)drag.moved=true;
    if(drag.moved)grid.scrollLeft=drag.left-delta;
  });
  grid.addEventListener('pointerup',function(){
    if(drag&&drag.moved){blockClick=true;setTimeout(function(){blockClick=false;},70);}
    drag=null;
  });
  grid.addEventListener('pointercancel',function(){drag=null;});
  grid.addEventListener('click',function(e){
    if(!blockClick)return;
    e.preventDefault();e.stopImmediatePropagation();blockClick=false;
  },true);

  // Swipe the image lightbox as well, without disturbing its real prev/next buttons.
  var box=document.getElementById('lightbox');
  if(box){
    var startX=null;
    box.addEventListener('touchstart',function(e){
      if(e.touches.length===1)startX=e.touches[0].clientX;
    },{passive:true});
    box.addEventListener('touchend',function(e){
      if(startX===null||!e.changedTouches.length)return;
      var dx=e.changedTouches[0].clientX-startX;startX=null;
      if(Math.abs(dx)<48)return;
      var next=box.querySelector(dx<0?'.lightbox__nav--next':'.lightbox__nav--prev');
      if(next&&!next.hidden)next.click();
    },{passive:true});
  }
  // Honour an in-page camp direct link if shared; no server route required.
  var selected=new URLSearchParams(location.search).get('camp');
  filterByFolder(selected&&folderButtons[selected]?selected:'all',false);
})();
