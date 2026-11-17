/* SMA PLAYER · read-only Arabic client presentation. 
 * Feedback happens with KAMAYA in a meeting or call, not through an
 * on-site form.  All original assets and media links remain available. */
(function(){
"use strict";
var gallery=document.getElementById("all-gallery"), more=document.getElementById("archive-more");
var filter=document.getElementById("archive-filter"),counter=document.getElementById("archive-count");
var all=[],filtered=[],shown=0,perPage=32;
var lb=document.getElementById("lightbox"),lbImg=document.getElementById("lightbox-img"),lbCap=document.getElementById("lightbox-caption");
var opener=null;
function openLightbox(item,op){
  opener=op;lbImg.src=item.src;lbImg.alt=item.label;lbCap.textContent=item.label+" · المصدر الأصلي";lb.hidden=false;
  document.body.style.overflow="hidden";document.getElementById("lightbox-close").focus();
}
function closeLightbox(){lb.hidden=true;lbImg.removeAttribute("src");document.body.style.overflow="";if(opener)opener.focus()}
document.getElementById("lightbox-close").addEventListener("click",closeLightbox);
lb.addEventListener("click",function(e){if(e.target===lb)closeLightbox()});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!lb.hidden)closeLightbox()});
function addItems(){
  var slice=filtered.slice(shown,shown+perPage);
  var frag=document.createDocumentFragment();
  slice.forEach(function(item){
    var figure=document.createElement("figure");figure.className="gallery-figure";figure.style.margin="0";
    var btn=document.createElement("button");btn.type="button";btn.setAttribute("aria-label","فتح صورة "+item.label);
    var img=document.createElement("img");img.loading="lazy";img.decoding="async";img.src=item.thumb;img.alt="صورة من أرشيف SMA PLAYER";img.width=250;img.height=145;
    btn.append(img);btn.addEventListener("click",function(){openLightbox(item,btn)});
    var caption=document.createElement("figcaption");caption.textContent=item.id+" · "+item.label;
    figure.append(btn,caption);frag.append(figure);
  });
  gallery.append(frag);shown+=slice.length;
  counter.textContent="يعرض "+shown+" من أصل "+filtered.length;
  more.hidden=shown>=filtered.length;
}
function setCategory(){
  var value=filter.value;
  filtered=all.filter(function(x){return value==="all"||x.category===value});
  gallery.replaceChildren();shown=0;addItems();
}
filter.addEventListener("change",setCategory);more.addEventListener("click",addItems);
(document.getElementById("source-archive-data") ? Promise.resolve(JSON.parse(document.getElementById("source-archive-data").textContent)) : fetch("assets/client-review/all-original-assets.json").then(function(r){if(!r.ok)throw Error("archive HTTP "+r.status);return r.json()}))
 .then(function(json){all=json.items.filter(function(i){return i.type!=="video"});setCategory()})
 .catch(function(err){counter.textContent="تعذر تحميل فهرس الملفات الأصلية: "+err.message});
(document.getElementById("source-press-data") ? Promise.resolve(JSON.parse(document.getElementById("source-press-data").textContent)) : fetch("assets/press/media-register.json").then(function(r){if(!r.ok)throw Error("press HTTP "+r.status);return r.json()}))
 .then(function(json){
   var holder=document.getElementById("full-press-list");holder.replaceChildren();
   var list=(json.verified||[]).filter(function(x){return typeof x.url==="string"&&x.url.startsWith("https://")});
   list.forEach(function(x){
     var anchor=document.createElement("a");anchor.href=x.url;anchor.target="_blank";anchor.rel="noopener noreferrer";
     var b=document.createElement("b");b.textContent=(x.title||x.outlet||"تغطية صحفية").replace(/سيف\s+آل\s+نمرة/g,"سيف ال نمرة");var detail=document.createElement("small");detail.textContent=(x.outlet||"")+" · "+(x.date||"");
     anchor.append(b,detail);holder.append(anchor);
   });
   if(!list.length)holder.textContent="لا توجد روابط متاحة في السجل المحلي.";
 })
 .catch(function(err){document.getElementById("full-press-list").textContent="تعذر قراءة سجل الإعلام: "+err.message});
})();