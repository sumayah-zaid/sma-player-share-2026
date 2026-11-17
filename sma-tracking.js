/* SMA PLAYER / client-only demonstration. Never authenticates, stores, fetches or sends a real application. */
(function(){
"use strict";
const $=(s)=>document.querySelector(s);
const view=document.body.dataset.view;
const fixedDemoNumber="SMA-DEMO-00124";
const scenarioData={
received:{name:"تم استلام الطلب",symbol:"✓",description:"نموذج الطلب اكتمل ووصل إلى مرحلة الاستلام. هذه بيانات افتراضية للمعاينة.",next:"ستبدأ الإدارة مراجعة ملف اللاعب",stage:1},
review:{name:"قيد المراجعة",symbol:"◎",description:"يراجع الفريق الفني البيانات والخبرة الرياضية والمقاطع المرفقة قبل تحديد الخطوة التالية.",next:"انتظار نتيجة المراجعة الفنية",stage:2},
trial:{name:"دعوة لتجربة الأداء",symbol:"◈",description:"أصبح الطلب في مرحلة الاختبار الفني. ستظهر تفاصيل الموعد والمكان بعد تحديدها رسميًا.",next:"التأكد من إشعار الاختبار والتعليمات الصادرة من الإدارة",stage:3},
accepted:{name:"مقبول مبدئيًا",symbol:"★",description:"اجتاز اللاعب المراحل الأولية. تنتظر الخطوات التنظيمية النهائية ومعلومات البرنامج من الإدارة.",next:"استكمال متطلبات تأكيد المشاركة عند وصولها",stage:4},
waitlist:{name:"في قائمة الانتظار",symbol:"◷",description:"ملف اللاعب محتفظ به للمراجعة إذا أصبحت فرصة إضافية متاحة في البرنامج.",next:"متابعة إشعارات SMA بشأن توفر فرصة",stage:2},
rejected:{name:"غير مقبول حاليًا",symbol:"—",description:"لم يتم اختيار اللاعب لهذا البرنامج في هذه المرحلة. هذا القرار لا يحدد مستقبل اللاعب الرياضي.",next:"استكشف برامجًا أخرى أو استفسر عن الفرص القادمة",stage:4}
};
const stages=[
{name:"تم استلام الطلب",desc:"تأكيد استلام الملف"},
{name:"المراجعة الفنية",desc:"فحص البيانات والمقاطع"},
{name:"تجربة الأداء",desc:"حسب شروط البرنامج"},
{name:"القرار",desc:"اعتماد نتيجة الطلب"}
];
function renderScenario(status){
 const value=scenarioData[status]||scenarioData.review;
 if(!$("#tracking-result"))return;
 $("#tracking-result").hidden=false;
 $("#result-status-symbol").textContent=value.symbol;
 $("#result-status-text").textContent=value.name;
 $("#result-description").textContent=value.description;
 $("#result-next").textContent=value.next;
 $("#result-timeline").replaceChildren(...stages.map((stage,i)=>{
  const row=document.createElement("div");row.className="result-step"+(i<value.stage?" is-done":"");
  const num=document.createElement("span");num.className="result-step-num";num.textContent=String(i+1).padStart(2,"0");
  const info=document.createElement("div");const strong=document.createElement("strong");strong.textContent=stage.name;
  const detail=document.createElement("p");detail.textContent=stage.desc;info.append(strong,detail);row.append(num,info);
  return row;
 }));
 const profile=$("#post-acceptance");
 if(profile)profile.hidden=status!=="accepted";
 document.querySelectorAll("[data-demo-status]").forEach(button=>{
  const active=button.dataset.demoStatus===status;
  button.classList.toggle("is-active",active);
  button.setAttribute("aria-pressed",String(active));
 });
}
if(view==="receipt"){
 const copy=$("#copy-demo-number");
 if(copy)copy.addEventListener("click",async()=>{
  // Clipboard is supported in secure contexts only; fallback copies to selectable field.
  try{
   if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(fixedDemoNumber);copy.textContent="نُسخ ✓";return;}
  }catch(_){}
  const select=document.createElement("textarea");select.value=fixedDemoNumber;select.style.cssText="position:fixed;opacity:0";
  document.body.appendChild(select);select.select();try{document.execCommand("copy");copy.textContent="نُسخ ✓"}catch(_){copy.textContent=fixedDemoNumber}select.remove();
 });
}
if(view==="track"){
 const f=$("#tracking-lookup-form");if(f)f.addEventListener("submit",e=>e.preventDefault());
 document.querySelectorAll("[data-demo-status]").forEach(button=>button.addEventListener("click",()=>renderScenario(button.dataset.demoStatus)));
 const params=new URLSearchParams(location.search);
 const status=params.get("demo");
 if(status&&Object.prototype.hasOwnProperty.call(scenarioData,status))renderScenario(status);
}
})();
