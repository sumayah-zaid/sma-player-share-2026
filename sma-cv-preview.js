/* SMA PLAYER — intake UI preview. No fetch, no network calls, no persistence. */
(function(){
  "use strict";
  const form=document.getElementById("sma-player-intake");
  if(!form)return;
  form.addEventListener("submit",function(event){event.preventDefault();});
  // Each experience field is required only when the player answers "Yes".
  // On "No" we clear and disable the field so it is never accidentally submitted.
  for(const config of [
    ["played_for_club_or_academy","intake-club-experience"],
    ["joined_international_camps","intake-camp-experience"]
  ]){
    const radios=Array.from(form.querySelectorAll('input[name="'+config[0]+'"]'));
    const area=document.getElementById(config[1]);
    const wrapper=document.getElementById(config[1]+"-wrap");
    if(!radios.length||!area||!wrapper)continue;
    function update(){
      const yes=radios.some(radio=>radio.value==="yes"&&radio.checked);
      wrapper.hidden=!yes;
      area.required=yes;
      area.disabled=!yes;
      if(!yes)area.value="";
      for(const radio of radios)radio.setAttribute("aria-expanded",String(yes));
    }
    radios.forEach(radio=>radio.addEventListener("change",update));
    update();
  }
  // A birth year alone cannot establish the exact 18th birthday.
  // For the 2026 program, request guardian contact conservatively from birth year 2008 onward.
  const birthYear=document.getElementById("intake-birth-year");
  const guardian=document.getElementById("intake-guardian-wrap");
  const guardianName=document.getElementById("intake-guardian-name");
  const guardianPhone=document.getElementById("intake-guardian-phone");
  if(birthYear&&guardian&&guardianName&&guardianPhone){
    function updateGuardian(){
      const year=Number(birthYear.value);
      const minorContact=birthYear.value!==""&&Number.isFinite(year)&&year>=2008&&year<=2026;
      guardian.hidden=!minorContact;
      for(const input of [guardianName,guardianPhone]){
        input.required=minorContact;
        input.disabled=!minorContact;
        if(!minorContact)input.value="";
      }
    }
    birthYear.addEventListener("input",updateGuardian);
    birthYear.addEventListener("change",updateGuardian);
    updateGuardian();
  }
  for(const pair of [["intake-clips","intake-clips-selected","مقاطع"],["intake-photos","intake-photos-selected","صور"]]){
    const input=document.getElementById(pair[0]),output=document.getElementById(pair[1]);
    if(!input||!output)continue;
    input.addEventListener("change",function(){
      const count=input.files?input.files.length:0;
      output.textContent=count?"تم اختيار "+count+" "+pair[2]+" — لم تُرفع إلى أي خادم":"لم يتم اختيار ملفات";
    });
  }
})();
