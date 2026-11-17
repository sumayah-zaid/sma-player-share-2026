/* SMA PLAYER: show persistent WhatsApp chat only after leaving the hero CTA.
   Prevents obstruction of the primary hero button on 320/390 mobile widths. */
(function(){
  'use strict';
  if (document.documentElement.lang !== 'ar') return;
  var button=document.querySelector('.sma-whatsapp-float');
  if (!button) return;
  function update(){
    var viewport=window.innerHeight||700;
    var threshold=Math.min(600,Math.max(280,viewport*.64));
    var visible=window.scrollY>threshold;
    // The fixed shortcut must never sit over the contact form or KAMAYA footer.
    // Both sections now contain their own primary WhatsApp / contact actions.
    var contact=document.getElementById('a-contact');
    var footer=document.getElementById('site-footer');
    function intersects(element){
      if(!element)return false;
      var box=element.getBoundingClientRect();
      return box.top<viewport*0.94 && box.bottom>viewport*0.10;
    }
    if(intersects(contact)||intersects(footer))visible=false;
    button.classList.toggle('is-visible',visible);
  }
  document.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',update,{passive:true});
  update();
})();