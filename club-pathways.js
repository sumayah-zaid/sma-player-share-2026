/* SMA PLAYER A — 5 club announcement posters / tactile horizontal gallery.
   Preserves original submitted posters, Arabic site only until Saif approves. */
(function(){
  'use strict';
  if (document.documentElement.lang !== 'ar') return;
  var rail=document.getElementById('a-clubs-rail');
  var counter=document.getElementById('a-clubs-progress');
  if(!rail||!counter)return;
  var cards=Array.prototype.slice.call(rail.querySelectorAll('.a-clubs__card'));
  var previous=document.querySelector('[data-clubs-back]');
  var next=document.querySelector('[data-clubs-next]');
  var index=0,drag=null,justDragged=false;
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  function update(n){
    index=Math.max(0,Math.min(cards.length-1,n));
    counter.textContent=(index+1)+' من '+cards.length;
    if(previous)previous.disabled=index===0;
    if(next)next.disabled=index===cards.length-1;
  }
  function focusCard(n){
    n=Math.max(0,Math.min(cards.length-1,n));
    cards[n].scrollIntoView({block:'nearest',inline:'start',behavior:reduced.matches?'instant':'smooth'});
    update(n);
  }
  if(previous)previous.addEventListener('click',function(){focusCard(index-1)});
  if(next)next.addEventListener('click',function(){focusCard(index+1)});
  rail.addEventListener('keydown',function(e){
    if(e.target!==rail)return;
    if(e.key==='ArrowLeft'){e.preventDefault();focusCard(index+1);}
    if(e.key==='ArrowRight'){e.preventDefault();focusCard(index-1);}
  });
  // On touch devices native momentum scrolling and scroll snapping handle swipe.
  // For desktop mouse users enable click-and-drag across the track.
  rail.addEventListener('pointerdown',function(e){
    if(e.pointerType!=='mouse'||e.button!==0)return;
    drag={x:e.clientX,left:rail.scrollLeft,moved:false};
  });
  rail.addEventListener('pointermove',function(e){
    if(!drag)return;
    var delta=e.clientX-drag.x;
    if(Math.abs(delta)>8)drag.moved=true;
    if(drag.moved)rail.scrollLeft=drag.left-delta;
  });
  function stopDrag(){
    if(drag&&drag.moved){justDragged=true;setTimeout(function(){justDragged=false},90);}
    drag=null;
  }
  rail.addEventListener('pointerup',stopDrag);
  rail.addEventListener('pointercancel',stopDrag);
  rail.addEventListener('click',function(e){
    if(!justDragged)return;
    e.preventDefault();e.stopImmediatePropagation();justDragged=false;
  },true);
  // Reflect the rightmost fully or partially visible card (RTL reading start).
  var raf=0;
  rail.addEventListener('scroll',function(){
    if(raf)return;
    raf=requestAnimationFrame(function(){
      raf=0;
      var right=rail.getBoundingClientRect().right,chosen=0,best=Infinity;
      cards.forEach(function(card,i){
        var dist=Math.abs(card.getBoundingClientRect().right-right);
        if(dist<best){best=dist;chosen=i;}
      });
      update(chosen);
    });
  },{passive:true});
  update(0);
})();