/* SMA cinematic motion. No changes to the server-driven application contract. */
(()=>{'use strict';
const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const reveals=document.querySelectorAll('.sma-story-chapter,.sma-story-lead,.sma-exp-card,.sma-exp-heading,.sma-feature-strip__content,.sma-live-gallery figure,.sma-day-steps article,.sma-investment__card,.sma-steps-grid article,.sma-facility,.sma-facilities__intro,.sma-facilities__more');
reveals.forEach(el=>el.classList.add('sma-reveal'));
if(!reduced&&'IntersectionObserver' in window){
  const io=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');io.unobserve(entry.target);}});},{threshold:.1,rootMargin:'0px 0px -30px 0px'});
  reveals.forEach(el=>io.observe(el));
}else reveals.forEach(el=>el.classList.add('is-visible'));
const fields=Array.from(document.querySelectorAll('#sma-player-intake fieldset.sma-intake-section[data-stage]'));
const tabs=Array.from(document.querySelectorAll('.sma-form-journey__nav a'));
const meter=document.getElementById('sma-form-meter');
if(fields.length===4&&tabs.length===4){
  const activate=(index)=>{
    const ix=Math.min(3,Math.max(0,index));
    tabs.forEach((a,i)=>{a.classList.toggle('is-current',i===ix);if(i===ix)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});
    fields.forEach((el,i)=>el.classList.toggle('is-current',i===ix));
    if(meter)meter.style.width=((ix+1)*25)+'%';
  };
  activate(0);
  tabs.forEach((a,i)=>a.addEventListener('click',()=>activate(i)));
  fields.forEach((field,i)=>{field.addEventListener('focusin',()=>activate(i));field.addEventListener('change',()=>activate(i));});
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{let visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);if(visible.length)activate(fields.indexOf(visible[0].target));},{rootMargin:'-20% 0px -55% 0px',threshold:[0,.1,.3,.6]});
    fields.forEach(field=>observer.observe(field));
  }
}
})();
