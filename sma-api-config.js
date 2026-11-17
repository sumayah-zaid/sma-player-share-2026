/* SMA PLAYER — single source of truth for the frontend side of the API contract.
   apply.html, receipt.html, track.html, staff-login.html and admin-preview.html
   resolve every endpoint, limit and status label from here, so adapting to the
   backend contract is a change in THIS FILE ONLY.

   Hard rules enforced by this layer:
   - same-origin requests only (no absolute host, credentials: same-origin);
   - no PII and no tokens in localStorage — the track token lives in memory;
   - a non-JSON or missing response is reported as "unavailable", never as success,
     so no page can show a received/approved state the server did not confirm. */
(function(){
"use strict";

/* ------------------------------------------------------------------ endpoints */
var ENDPOINTS={
  publicConfig:"/api/public/config",
  applications:"/api/applications",
  trackRequestCode:"/api/track/request-code",
  trackVerifyCode:"/api/track/verify-code",
  trackStatus:"/api/track/status",
  authLogin:"/api/auth/login",
  authMe:"/api/auth/me",
  authLogout:"/api/auth/logout",
  adminApplications:"/api/admin/applications",
  adminApplicationStatus:"/api/admin/applications/{reference}/status"
};

/* Fallback upload limits. The server copy in GET /api/public/config wins when present;
   these keep the form honest and enforceable before the contract is wired. */
var DEFAULT_LIMITS={
  video:{maxFiles:4,maxSizeMb:150,accept:["video/mp4","video/quicktime","video/webm","video/x-m4v"],extensions:["mp4","mov","m4v","webm"]},
  photo:{maxFiles:8,maxSizeMb:8,accept:["image/jpeg","image/png","image/webp","image/heic","image/heif"],extensions:["jpg","jpeg","png","webp","heic","heif"]},
  totalMb:400
};

var DEFAULTS={
  requestTimeoutMs:15000,
  uploadTimeoutMs:900000,
  guardianBirthYearFrom:2008,
  referencePattern:"^[A-Za-z0-9][A-Za-z0-9_-]{3,39}$",
  otpLength:6,
  otpResendSeconds:60
};

var MESSAGES={
  network:"تعذّر الوصول إلى خدمة SMA. تحقّق من الاتصال بالإنترنت ثم أعد المحاولة.",
  timeout:"انتهت مدة الانتظار دون رد من الخادم. أعد المحاولة.",
  server:"حدث خطأ غير متوقع في الخادم. أعد المحاولة بعد قليل.",
  unavailable:"غير متاح — الخدمة غير مفعّلة على الخادم بعد.",
  badRequest:"تحقّق من البيانات المدخلة ثم أعد المحاولة.",
  unauthorized:"الجلسة غير صالحة أو منتهية. سجّل الدخول من جديد.",
  forbidden:"لا تملك صلاحية الوصول إلى هذه الشاشة.",
  tooMany:"عدد المحاولات كبير. انتظر قليلًا ثم أعد المحاولة.",
  conflict:"تمت معالجة هذا الطلب مسبقًا."
};

/* ------------------------------------------------------------- status vocabulary */
/* Operational lifecycle: received -> under_review -> trial_invited -> accepted | rejected.
   waitlisted is kept because the admin surface already uses it. */
var STATUS={
  received:{key:"received",label:"تم الاستلام",symbol:"✓",stage:1,
    description:"وصل طلبك إلى إدارة SMA وتم إصدار رقم مرجعي له.",
    next:"ستبدأ الإدارة مراجعة ملف اللاعب"},
  under_review:{key:"under_review",label:"قيد المراجعة",symbol:"◎",stage:2,
    description:"يراجع الفريق الفني البيانات والخبرة الرياضية والمقاطع المرفقة.",
    next:"انتظار نتيجة المراجعة الفنية"},
  trial_invited:{key:"trial_invited",label:"دعوة للاختبار",symbol:"◈",stage:3,
    description:"تمت دعوتك لاختبار الأداء. تفاصيل الموعد والمكان تصل من الإدارة.",
    next:"متابعة إشعار الاختبار والتعليمات الصادرة من الإدارة"},
  accepted:{key:"accepted",label:"مقبول نهائيًا",symbol:"★",stage:4,
    description:"اعتُمد قبول اللاعب في البرنامج.",
    next:"استكمال متطلبات تأكيد المشاركة عند وصولها"},
  rejected:{key:"rejected",label:"مرفوض",symbol:"—",stage:4,
    description:"لم يتم اختيار اللاعب لهذا البرنامج في هذه المرحلة.",
    next:"استكشاف برامج أخرى أو الاستفسار عن الفرص القادمة"},
  waitlisted:{key:"waitlisted",label:"قائمة الانتظار",symbol:"◷",stage:2,
    description:"ملف اللاعب محتفظ به للمراجعة إذا توفّرت فرصة إضافية في البرنامج.",
    next:"متابعة إشعارات SMA بشأن توفر فرصة"}
};

/* Tolerant aliases: the backend may name these differently; map, never guess a stage. */
var STATUS_ALIASES={
  received:"received",new:"received",submitted:"received",pending:"received",
  under_review:"under_review",review:"under_review",in_review:"under_review",reviewing:"under_review",pending_review:"under_review",
  trial_invited:"trial_invited",trial:"trial_invited",trial_invite:"trial_invited",invited:"trial_invited",testing:"trial_invited",
  accepted:"accepted",approved:"accepted",final_accepted:"accepted",accepted_final:"accepted",
  rejected:"rejected",declined:"rejected",refused:"rejected",not_accepted:"rejected",
  waitlisted:"waitlisted",waitlist:"waitlisted",on_hold:"waitlisted"
};

var STAGES=[
  {name:"تم استلام الطلب",desc:"تأكيد استلام الملف"},
  {name:"المراجعة الفنية",desc:"فحص البيانات والمقاطع"},
  {name:"دعوة للاختبار",desc:"حسب شروط البرنامج"},
  {name:"القرار النهائي",desc:"اعتماد نتيجة الطلب"}
];

function statusOf(value){
  var key=STATUS_ALIASES[String(value==null?"":value).toLowerCase().trim()];
  return key?STATUS[key]:null;
}

/* ------------------------------------------------------------------- utilities */
function resolve(target,params){
  var path=Object.prototype.hasOwnProperty.call(ENDPOINTS,target)?ENDPOINTS[target]:String(target);
  if(params)Object.keys(params).forEach(function(key){
    path=path.replace("{"+key+"}",encodeURIComponent(String(params[key])));
  });
  return path;
}

function readValue(source,keys){
  if(!source||typeof source!=="object")return undefined;
  for(var i=0;i<keys.length;i++)if(source[keys[i]]!==undefined&&source[keys[i]]!==null)return source[keys[i]];
  return undefined;
}
function readBool(source,keys,fallback){
  var value=readValue(source,keys);
  if(value===undefined)return fallback;
  if(typeof value==="boolean")return value;
  if(typeof value==="number")return value===1;
  var text=String(value).toLowerCase().trim();
  return text==="true"||text==="1"||text==="yes"||text==="open"||text==="enabled"||text==="on";
}
function readNumber(source,keys,fallback){
  var value=Number(readValue(source,keys));
  return Number.isFinite(value)&&value>0?value:fallback;
}
function readText(source,keys,fallback){
  var value=readValue(source,keys);
  return typeof value==="string"&&value.trim()?value.trim():fallback;
}
function readList(source,keys,fallback){
  var value=readValue(source,keys);
  if(Array.isArray(value)&&value.length)return value.map(function(x){return String(x).toLowerCase().trim()});
  if(typeof value==="string"&&value.trim())return value.split(",").map(function(x){return x.toLowerCase().trim()}).filter(Boolean);
  return fallback;
}

function formatMb(value){
  var number=Number(value);
  if(!Number.isFinite(number))return "—";
  return new Intl.NumberFormat("ar-SA",{maximumFractionDigits:number<10?1:0}).format(number);
}
function bytesToMb(bytes){return Number(bytes)/(1024*1024)}
/* Human size for a selected file set: kilobytes under 1 MB, megabytes above. */
function formatSize(mb){
  var value=Number(mb);
  if(!Number.isFinite(value))return "—";
  if(value<1)return formatMb(Math.max(1,Math.round(value*1024)))+" ك.ب";
  return formatMb(value)+" م.ب";
}
function extensionOf(name){
  var parts=String(name||"").toLowerCase().split(".");
  return parts.length>1?parts.pop():"";
}

function isValidReference(value,pattern){
  var text=String(value==null?"":value).trim();
  if(!text)return false;
  var source=pattern||DEFAULTS.referencePattern;
  try{return new RegExp(source).test(text)}catch(error){return new RegExp(DEFAULTS.referencePattern).test(text)}
}

/* Saudi-friendly phone normalisation: keeps a leading +, strips separators. */
function normalisePhone(value){
  var text=String(value==null?"":value).replace(/[\s‏‎()\-.]/g,"").replace(/^00/,"+");
  if(/^0\d{8,}$/.test(text))return "+966"+text.slice(1);
  return text;
}
function isValidPhone(value){
  var text=normalisePhone(value);
  return /^\+?\d{9,15}$/.test(text);
}

/* ---------------------------------------------------------------- HTTP helpers */
function httpMessage(status,data){
  var fromServer=data&&typeof data==="object"?(data.message||data.error_message||(typeof data.error==="string"?data.error:"")):"";
  if(typeof fromServer==="string"&&fromServer.trim()&&fromServer.trim().length<300)return fromServer.trim();
  if(status===400||status===422)return MESSAGES.badRequest;
  if(status===401)return MESSAGES.unauthorized;
  if(status===403)return MESSAGES.forbidden;
  if(status===404||status===405||status===501||status===502||status===503)return MESSAGES.unavailable;
  if(status===409)return MESSAGES.conflict;
  if(status===429)return MESSAGES.tooMany;
  return MESSAGES.server;
}

function parseJson(text){
  if(typeof text!=="string"||!text.trim())return undefined;
  try{return JSON.parse(text)}catch(error){return undefined}
}

/* A static host answers unknown /api paths with HTML. That is "not wired yet",
   never a success — surface it as kind:"contract". */
function contractFailure(status){
  return {ok:false,status:status||0,data:null,kind:"contract",error:MESSAGES.unavailable};
}

function request(target,options){
  var opts=options||{};
  var url=resolve(target,opts.params);
  var controller=typeof AbortController!=="undefined"?new AbortController():null;
  var timeoutMs=opts.timeoutMs||DEFAULTS.requestTimeoutMs;
  var timer=controller&&timeoutMs?setTimeout(function(){controller.abort()},timeoutMs):0;
  var headers={Accept:"application/json"};
  Object.keys(opts.headers||{}).forEach(function(key){headers[key]=opts.headers[key]});
  var body;
  if(opts.json!==undefined){headers["Content-Type"]="application/json";body=JSON.stringify(opts.json)}
  else if(opts.body!==undefined)body=opts.body;
  if(opts.token)headers.Authorization="Bearer "+opts.token;
  return fetch(url,{
    method:opts.method||(body!==undefined?"POST":"GET"),
    headers:headers,body:body,credentials:"same-origin",cache:"no-store",
    signal:controller?controller.signal:undefined
  }).then(function(response){
    clearTimeout(timer);
    return response.text().then(function(text){return {response:response,text:text}},function(){return {response:response,text:""}});
  }).then(function(payload){
    var response=payload.response;
    var type=String(response.headers.get("content-type")||"").toLowerCase();
    var data=type.indexOf("json")>-1?parseJson(payload.text):parseJson(payload.text);
    if(!response.ok)return {ok:false,status:response.status,data:data||null,kind:"http",error:httpMessage(response.status,data)};
    if(data===undefined||data===null||typeof data!=="object")return contractFailure(response.status);
    return {ok:true,status:response.status,data:data,kind:"ok",error:""};
  },function(error){
    clearTimeout(timer);
    var aborted=error&&error.name==="AbortError";
    return {ok:false,status:0,data:null,kind:aborted?"timeout":"network",error:aborted?MESSAGES.timeout:MESSAGES.network};
  });
}

/* XHR because the application form uploads video and needs real upload progress. */
function upload(target,formData,options){
  var opts=options||{};
  var url=resolve(target,opts.params);
  return new Promise(function(settle){
    var xhr=new XMLHttpRequest();
    var settled=false;
    function finish(result){if(!settled){settled=true;settle(result)}}
    try{xhr.open(opts.method||"POST",url,true)}catch(error){finish(contractFailure(0));return}
    xhr.timeout=opts.timeoutMs||DEFAULTS.uploadTimeoutMs;
    xhr.setRequestHeader("Accept","application/json");
    if(opts.token)xhr.setRequestHeader("Authorization","Bearer "+opts.token);
    if(xhr.upload&&typeof opts.onProgress==="function")xhr.upload.addEventListener("progress",function(event){
      if(event.lengthComputable)opts.onProgress(Math.min(1,event.loaded/event.total));
    });
    xhr.addEventListener("timeout",function(){finish({ok:false,status:0,data:null,kind:"timeout",error:MESSAGES.timeout})});
    xhr.addEventListener("error",function(){finish({ok:false,status:0,data:null,kind:"network",error:MESSAGES.network})});
    xhr.addEventListener("abort",function(){finish({ok:false,status:0,data:null,kind:"abort",error:""})});
    xhr.addEventListener("load",function(){
      var data=parseJson(xhr.responseText);
      if(xhr.status<200||xhr.status>=300)return finish({ok:false,status:xhr.status,data:data||null,kind:"http",error:httpMessage(xhr.status,data)});
      if(!data||typeof data!=="object")return finish(contractFailure(xhr.status));
      finish({ok:true,status:xhr.status,data:data,kind:"ok",error:""});
    });
    if(typeof opts.onStart==="function")opts.onStart(xhr);
    xhr.send(formData);
  });
}

/* ------------------------------------------------------------- public config */
var configPromise=null;

function mergeLimits(raw){
  var source=raw&&typeof raw==="object"?raw:{};
  var video=source.video||source.videos||source.performance_videos||{};
  var photo=source.photo||source.photos||source.sports_photos||source.image||{};
  return {
    video:{
      maxFiles:readNumber(video,["max_files","maxFiles","count"],DEFAULT_LIMITS.video.maxFiles),
      maxSizeMb:readNumber(video,["max_size_mb","maxSizeMb","size_mb"],DEFAULT_LIMITS.video.maxSizeMb),
      accept:readList(video,["accept","mime_types","types"],DEFAULT_LIMITS.video.accept),
      extensions:readList(video,["extensions","ext"],DEFAULT_LIMITS.video.extensions)
    },
    photo:{
      maxFiles:readNumber(photo,["max_files","maxFiles","count"],DEFAULT_LIMITS.photo.maxFiles),
      maxSizeMb:readNumber(photo,["max_size_mb","maxSizeMb","size_mb"],DEFAULT_LIMITS.photo.maxSizeMb),
      accept:readList(photo,["accept","mime_types","types"],DEFAULT_LIMITS.photo.accept),
      extensions:readList(photo,["extensions","ext"],DEFAULT_LIMITS.photo.extensions)
    },
    totalMb:readNumber(source,["total_upload_mb","totalUploadMb","max_total_mb","total_mb"],DEFAULT_LIMITS.totalMb)
  };
}

function closedConfig(result){
  return {
    available:false,
    error:result?result.error:MESSAGES.unavailable,
    kind:result?result.kind:"contract",
    flags:{applicationsOpen:false,smsTracking:false,staffAuth:false},
    limits:mergeLimits(null),
    guardianBirthYearFrom:DEFAULTS.guardianBirthYearFrom,
    referencePattern:DEFAULTS.referencePattern,
    otpLength:DEFAULTS.otpLength,
    otpResendSeconds:DEFAULTS.otpResendSeconds,
    notices:{},
    raw:null
  };
}

function normaliseConfig(result){
  if(!result.ok)return closedConfig(result);
  var raw=result.data&&typeof result.data==="object"?result.data:{};
  var root=raw.config&&typeof raw.config==="object"?raw.config:raw;
  var flagSource=root.flags&&typeof root.flags==="object"?Object.assign({},root,root.flags):root;
  var notices=root.messages&&typeof root.messages==="object"?root.messages:{};
  return {
    available:true,error:"",kind:"ok",
    flags:{
      applicationsOpen:readBool(flagSource,["applications_open","applicationsOpen","registration_open","apply_open","intake_open"],false),
      smsTracking:readBool(flagSource,["sms_tracking_enabled","smsTrackingEnabled","sms_enabled","tracking_enabled","otp_enabled"],false),
      staffAuth:readBool(flagSource,["staff_auth_enabled","staffAuthEnabled","auth_enabled","staff_login_enabled"],false)
    },
    limits:mergeLimits(root.limits||root.upload_limits||root.uploads),
    guardianBirthYearFrom:readNumber(root,["guardian_required_birth_year_from","guardianBirthYearFrom","minor_birth_year_from"],DEFAULTS.guardianBirthYearFrom),
    referencePattern:readText(root,["reference_pattern","referencePattern"],DEFAULTS.referencePattern),
    otpLength:readNumber(root,["otp_length","otpLength","code_length"],DEFAULTS.otpLength),
    otpResendSeconds:readNumber(root,["otp_resend_seconds","otpResendSeconds","resend_after_seconds"],DEFAULTS.otpResendSeconds),
    notices:{
      applicationsClosed:readText(notices,["applications_closed","closed_notice"],""),
      trackingClosed:readText(notices,["tracking_closed","sms_closed"],""),
      staffClosed:readText(notices,["staff_closed","auth_closed"],"")
    },
    raw:root
  };
}

function publicConfig(force){
  if(!configPromise||force)configPromise=request("publicConfig",{timeoutMs:9000}).then(normaliseConfig,function(){return closedConfig(null)});
  return configPromise;
}

/* ------------------------------------------------------------- response readers */
/* The one place that decides "did the server really accept this application?" */
function readSubmission(data){
  var root=data&&typeof data==="object"?(data.application&&typeof data.application==="object"?data.application:(data.data&&typeof data.data==="object"?data.data:data)):{};
  var reference=readText(root,["reference","reference_number","request_number","application_reference","id"],"");
  if(!reference)return null;
  var status=statusOf(readText(root,["status","state","application_status"],"received"))||STATUS.received;
  return {reference:reference,status:status,raw:root};
}

function readStatusPayload(data){
  var root=data&&typeof data==="object"?(data.application&&typeof data.application==="object"?data.application:(data.data&&typeof data.data==="object"?data.data:data)):{};
  var status=statusOf(readText(root,["status","state","application_status"],""));
  if(!status)return null;
  return {
    reference:readText(root,["reference","reference_number","request_number"],""),
    status:status,
    updatedAt:readText(root,["updated_at","updatedAt","status_changed_at","last_update"],""),
    note:readText(root,["public_note","note","message_to_applicant"],""),
    nextStep:readText(root,["next_step","nextStep"],""),
    trial:root.trial&&typeof root.trial==="object"?root.trial:null,
    raw:root
  };
}

function readSession(data){
  var root=data&&typeof data==="object"?(data.user&&typeof data.user==="object"?data.user:(data.staff&&typeof data.staff==="object"?data.staff:data)):{};
  var role=readText(root,["role","staff_role","user_role"],"").toLowerCase();
  var known={admin:"admin",administrator:"admin",supervisor:"supervisor",technical_supervisor:"supervisor",evaluator:"evaluator",assessor:"evaluator"};
  if(!known[role])return null;
  return {
    role:known[role],
    name:readText(root,["name","full_name","display_name"],""),
    email:readText(root,["email","username"],""),
    token:readText(root,["token","access_token","session_token"],""),
    raw:root
  };
}

function readTrackToken(data){
  var root=data&&typeof data==="object"?(data.session&&typeof data.session==="object"?data.session:data):{};
  var token=readText(root,["token","session_token","access_token","tracking_token"],"");
  if(!token)return null;
  return {token:token,expiresIn:readNumber(root,["expires_in","expiresIn","ttl_seconds"],600)};
}

/* Arabic role names used across the staff surfaces. */
var ROLE_LABELS={admin:"الإداري",supervisor:"المشرف الفني",evaluator:"المقيّم"};

window.SMA_API=Object.freeze({
  endpoints:ENDPOINTS,
  defaults:DEFAULTS,
  messages:MESSAGES,
  limits:DEFAULT_LIMITS,
  stages:STAGES,
  statuses:STATUS,
  roleLabels:ROLE_LABELS,
  resolve:resolve,
  request:request,
  upload:upload,
  publicConfig:publicConfig,
  statusOf:statusOf,
  readSubmission:readSubmission,
  readStatusPayload:readStatusPayload,
  readSession:readSession,
  readTrackToken:readTrackToken,
  isValidReference:isValidReference,
  isValidPhone:isValidPhone,
  normalisePhone:normalisePhone,
  formatMb:formatMb,
  bytesToMb:bytesToMb,
  formatSize:formatSize,
  extensionOf:extensionOf
});
})();
