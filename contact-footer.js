/* SMA PLAYER — CONTACT DELIVERY, client-review build 2026-11-11.
   Explicit proof of delivery only when a verified email endpoint responds.
   With no coach email: WhatsApp opens with a COPIED message; the visitor
   must paste and send themselves. Never claim a form was emailed. */
(function(){
  'use strict';
  if(document.documentElement.lang!=='ar') return;
  const form=document.getElementById('coach-contact-form');
  if(!form) return;
  const status=document.getElementById('coach-contact-result');
  const label=document.getElementById('coach-contact-submit-label');
  const submit=document.getElementById('coach-contact-submit');
  const deliveryNote=document.getElementById('coach-delivery-note');
  const manual=document.getElementById('coach-manual-copy');
  const manualText=document.getElementById('coach-manual-text');
  const again=document.getElementById('coach-copy-again');
  const whatsapp='https://wa.me/message/VFFUXVLVYHTOM1';
  const config={mode:'whatsapp',recipient_email:'',formspree_endpoint:'',recipient_verified:false,whatsapp_url:whatsapp};
  let emailActive=false;
  function setResult(text,isError){
    status.textContent=text;status.dataset.state=isError?'err':'ok';
  }
  function validEmail(email){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email||''));}
  function verifiedEndpoint(url){
    try{const u=new URL(url);return u.protocol==='https:'&&u.hostname==='formspree.io'&&/^\/f\/[a-zA-Z0-9]{5,}$/.test(u.pathname)&&!u.search&&!u.hash;}
    catch(e){return false;}
  }
  function mailIsLive(){
    return config.mode==='email'&&config.recipient_verified===true&&validEmail(config.recipient_email)&&verifiedEndpoint(config.formspree_endpoint);
  }
  function setMode(){
    emailActive=mailIsLive();
    label.textContent=emailActive?'إرسال الرسالة إلى فريق SMA':'تواصل مع SMA';
    deliveryNote.textContent=emailActive?
      'سيُرسل الطلب عبر خدمة البريد المعتمدة إلى البريد الرسمي لفريق SMA PLAYER. لا يتم إرسال بياناتك قبل الضغط على الزر.':
      'نموذج البريد قيد الربط. حاليًا تُنسخ رسالتك ويُفتح واتساب الرسمي، ثم تلصقها وترسلها بنفسك.';
    const reply=form.elements.namedItem('email');
    if(reply){reply.required=emailActive;const head=reply.closest('label');if(head){let small=head.querySelector('small');if(small)small.textContent=emailActive?'مطلوب للرد':'للرد عليك';}}
  }
  // Client preview also works over file://. Only a pre-verified endpoint can
  // ever enable service delivery; fetching unavailable config is safe.
  if(window.fetch){
    fetch('assets/contact-config.json',{cache:'no-store'})
      .then(r=>r.ok?r.json():null)
      .then(json=>{
        if(!json||typeof json!=='object')return;
        for(const k of ['mode','recipient_email','formspree_endpoint','recipient_verified'])if(Object.prototype.hasOwnProperty.call(json,k))config[k]=json[k];
        setMode();
      }).catch(()=>setMode());
  }
  setMode();
  function value(name){const el=form.elements.namedItem(name);return el?String(el.value||'').trim():'';}
  function compose(){
    const topic=value('topic');
    const arr=[
      'استفسار عبر موقع SMA PLAYER',
      '————————————',
      'الاسم: '+value('name'),
      'الموضوع: '+topic
    ];
    if(value('email'))arr.push('بريد التواصل: '+value('email'));
    if(value('phone'))arr.push('رقم التواصل: '+value('phone'));
    arr.push('','الرسالة:',''+value('message'));
    return arr.join('\n');
  }
  async function copy(text){
    if(navigator.clipboard&&navigator.clipboard.writeText){
      try{await navigator.clipboard.writeText(text);return true;}catch(e){}
    }
    try{
      let ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;left:-9999px;top:0;opacity:0';document.body.append(ta);ta.select();
      const result=document.execCommand('copy');ta.remove();return Boolean(result);
    }catch(e){return false;}
  }
  // No HTML or JS URL injection into the recipient/endpoint:
  // only the official WhatsApp link or a verified Formspree URL is allowed.
  form.addEventListener('submit',async function(e){
    e.preventDefault();
    const fields=[...form.querySelectorAll('input,select,textarea')].filter(el=>el.id!=='coach-manual-text');
    fields.forEach(x=>x.removeAttribute('aria-invalid'));
    const invalid=fields.find(x=>!x.checkValidity());
    if(invalid){invalid.setAttribute('aria-invalid','true');invalid.focus();invalid.reportValidity();setResult('راجِع الحقول المطلوبة وصحة البريد الإلكتروني.',true);return;}
    if(emailActive&&!value('email')){document.getElementById('coach-reply').focus();setResult('اكتب بريدًا إلكترونيًا صالحًا حتى نتمكن من الرد عليك.',true);return;}
    const msg=compose();
    if(emailActive){
      submit.disabled=true;label.textContent='جارٍ إرسال الرسالة…';
      manual.hidden=true;setResult('',false);
      try{
        const response=await fetch(config.formspree_endpoint,{
          method:'POST',
          headers:{'Content-Type':'application/json','Accept':'application/json'},
          body:JSON.stringify({
            name:value('name'),email:value('email'),phone:value('phone'),topic:value('topic'),
            message:value('message'),_subject:'SMA PLAYER · تواصل مع SMA · '+value('topic')
          })
        });
        let data=null;
        try{data=await response.json();}catch(e){}
        if(!response.ok || (data&&Array.isArray(data.errors)&&data.errors.length)){
          throw new Error('The email provider did not accept the request.');
        }
        setResult('استلمت خدمة البريد طلبك بنجاح. شكرًا لتواصلك؛ سيصل إلى البريد المرتبط بالخدمة.',false);
        form.reset();
      }catch(err){
        setResult('تعذّر إرسال الرسالة عبر البريد الآن. لم نؤكد وصولها. يمكنك إعادة المحاولة أو استخدام واتساب الرسمي.',true);
      }finally{
        submit.disabled=false;label.textContent='إرسال الرسالة إلى فريق SMA';
      }
      return;
    }
    // The linked WhatsApp Business short code is authoritative; it cannot
    // guarantee that a "text" query prefills the message, so copy separately.
    // Open at the user's click (before awaiting Clipboard) to avoid pop-up
    // blockers that otherwise suppress async opening.
    window.open(whatsapp,'_blank','noopener,noreferrer');
    manual.hidden=false;manualText.value=msg;
    const copied=await copy(msg);
    if(copied)setResult('نُسخت رسالتك. افتح محادثة واتساب وألصقها ثم اضغط إرسال؛ لم تُرسل تلقائيًا.',false);
    else setResult('حُضّرت رسالتك أدناه. انسخ النص وافتح واتساب الرسمي ثم أرسله بنفسك.',true);
  });
  again.addEventListener('click',async function(){
    const success=await copy(manualText.value);
    setResult(success?'تم نسخ النص؛ الصقه داخل واتساب وأرسله بنفسك.':'لم يسمح المتصفح بالنسخ؛ حدّد النص يدويًا وانسخه.',!success);
  });
})();
