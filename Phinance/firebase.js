// ━━━ FIREBASE.JS — Auth, Firestore, Backups ━━━







try{firebase.initializeApp({
  apiKey:"AIzaSyC2JHlKuCP9Rxj1P32qOWl09JvEERrYCLc",
  authDomain:"financplan-e2cf6.firebaseapp.com",
  projectId:"financplan-e2cf6",
  storageBucket:"financplan-e2cf6.firebasestorage.app",
  messagingSenderId:"619762936938",
  appId:"1:619762936938:web:2c782a22b3cd28d4b26e13"
});}catch(e){document.body.innerHTML='<div style="padding:40px;font-family:monospace;color:red">Firebase init error: '+e.message+'</div>';}
const auth=firebase.auth();
const db=firebase.firestore();
db.enablePersistence().catch(()=>{});
window.currentUser=null;
let saveTimer=null;
let authMode='login';
let resendCooldown=false;
window._userName='';

const userDoc=()=>db.collection('users').doc(currentUser.uid).collection('finanzplan').doc('v3');

// AUTH TAB
window.switchAuthTab=mode=>{
  authMode=mode;
  document.getElementById('tab-login').classList.toggle('active',mode==='login');
  document.getElementById('tab-register').classList.toggle('active',mode==='register');
  document.getElementById('register-fields').style.display=mode==='register'?'block':'none';
  var rf2b=document.getElementById('register-fields-2');if(rf2b)rf2b.style.display=mode==='register'?'block':'none';
  var rf2=document.getElementById('register-fields-2');if(rf2)rf2.style.display=mode==='register'?'block':'none';
  document.getElementById('auth-btn').textContent=mode==='login'?'Anmelden':'Registrieren';
  document.getElementById('forgot-wrap').style.display=mode==='login'?'block':'none';
  document.getElementById('auth-error').textContent='';
  document.getElementById('auth-password').value='';
  const p2=document.getElementById('auth-password2');if(p2)p2.value='';
  onPwInput();
};

// PW VALIDATION
window.onPwInput=()=>{
  if(authMode!=='register')return;
  const pw=document.getElementById('auth-password').value;
  const pw2=(document.getElementById('auth-password2')||{}).value||'';
  const rules={'rule-len':pw.length>=8,'rule-num':/[0-9]/.test(pw),'rule-sym':/[^a-zA-Z0-9]/.test(pw),'rule-match':pw.length>0&&pw===pw2};
  Object.entries(rules).forEach(([id,ok])=>{const el=document.getElementById(id);if(el)el.className='auth-rule '+(ok?'ok':'fail');});
};
function validatePw(pw,pw2){
  if(pw.length<8)return'Passwort muss mind. 8 Zeichen haben.';
  if(!/[0-9]/.test(pw))return'Passwort muss mind. 1 Zahl enthalten.';
  if(!/[^a-zA-Z0-9]/.test(pw))return'Passwort muss mind. 1 Sonderzeichen enthalten.';
  if(pw!==pw2)return'Passwörter stimmen nicht überein.';
  return null;
}

window.handleAuth=async()=>{
  const email=document.getElementById('auth-email').value.trim();
  const pw=document.getElementById('auth-password').value;
  const pw2=authMode==='register'?(document.getElementById('auth-password2')||{}).value||'':pw;
  const errEl=document.getElementById('auth-error');
  const btn=document.getElementById('auth-btn');
  errEl.textContent='';
  if(authMode==='register'){const err=validatePw(pw,pw2);if(err){errEl.textContent=err;return;}}
  btn.disabled=true;
  try{
    if(authMode==='login')await auth.signInWithEmailAndPassword(email,pw);
    else{
      const vorname=(document.getElementById('auth-vorname')||{}).value||'';
      const cred=await auth.createUserWithEmailAndPassword(email,pw);
      await cred.user.sendEmailVerification();
      if(vorname){window._userName=vorname;updateTopbarName(vorname);}
    }
  }catch(e){
    const msgs={'auth/invalid-credential':'E-Mail oder Passwort falsch.','auth/email-already-in-use':'E-Mail bereits registriert.','auth/weak-password':'Passwort zu schwach.','auth/invalid-email':'Ungültige E-Mail.','auth/user-not-found':'Kein Account.','auth/wrong-password':'Falsches Passwort.','auth/too-many-requests':'Zu viele Versuche.'};
    errEl.textContent=msgs[e.code]||e.message;
  }finally{btn.disabled=false;}
};
document.getElementById('auth-password').addEventListener('keydown',e=>{if(e.key==='Enter')window.handleAuth();});
document.getElementById('auth-email').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('auth-password').focus();});

window.handleGoogleAuth=async()=>{
  const btn=document.getElementById('google-btn');
  btn.disabled=true;const orig=btn.innerHTML;
  btn.innerHTML='<span style="font-size:13px;font-family:var(--mono)">Verbinde…</span>';
  try{await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());}
  catch(e){const msgs={'auth/popup-blocked':'Popup blockiert. Bitte erlauben.'};if(msgs[e.code])document.getElementById('auth-error').textContent=msgs[e.code];btn.disabled=false;btn.innerHTML=orig;}
};

window.handleLogout=()=>auth.signOut();

// FORGOT PW
window.showForgot=()=>{
  const fe=document.getElementById('forgot-email'),ae=document.getElementById('auth-email');
  if(fe&&ae)fe.value=ae.value;
  document.getElementById('forgot-error').textContent='';
  document.getElementById('forgot-success').style.display='none';
  document.getElementById('forgot-btn').disabled=false;
  document.getElementById('forgot-btn').textContent='Link senden';
  document.getElementById('forgot-screen').style.display='flex';
};
window.hideForgot=()=>{document.getElementById('forgot-screen').style.display='none';};
window.handleForgot=async()=>{
  const email=document.getElementById('forgot-email').value.trim();
  const errEl=document.getElementById('forgot-error');
  const successEl=document.getElementById('forgot-success');
  const btn=document.getElementById('forgot-btn');
  errEl.textContent='';successEl.style.display='none';
  if(!email){errEl.textContent='Bitte E-Mail eingeben.';return;}
  btn.disabled=true;btn.textContent='Wird gesendet…';
  try{await auth.sendPasswordResetEmail(email);successEl.style.display='block';btn.textContent='✓ Gesendet';}
  catch(e){const msgs={'auth/user-not-found':'Kein Account mit dieser E-Mail.','auth/invalid-email':'Ungültige E-Mail.'};errEl.textContent=msgs[e.code]||e.message;btn.disabled=false;btn.textContent='Link senden';}
};
document.getElementById('forgot-email').addEventListener('keydown',e=>{if(e.key==='Enter')window.handleForgot();});

// VERIFY
window.checkVerification=async()=>{
  if(!currentUser)return;
  await currentUser.reload();
  if(currentUser.emailVerified){
    document.getElementById('verify-screen').style.display='none';
    document.getElementById('shell').style.display='';
    await loadFromFirestore();
  }else{
    const note=document.getElementById('resend-note');
    if(note){note.textContent='Noch nicht bestätigt. Prüfe Posteingang und Spam.';note.style.color='var(--ember)';}
  }
};
window.resendVerification=async()=>{
  if(!currentUser||resendCooldown)return;
  const btn=document.getElementById('resend-btn');const note=document.getElementById('resend-note');
  resendCooldown=true;btn.disabled=true;
  try{
    await currentUser.sendEmailVerification();
    if(note){note.textContent='✓ E-Mail gesendet.';note.style.color='var(--sage2)';}
    let secs=60;const iv=setInterval(()=>{secs--;btn.textContent=`Erneut senden (${secs}s)`;if(secs<=0){clearInterval(iv);btn.disabled=false;btn.textContent='E-Mail erneut senden';resendCooldown=false;}},1000);
  }catch(e){if(note){note.textContent='Fehler.';note.style.color='var(--ember)';}btn.disabled=false;resendCooldown=false;}
};

// AUTH STATE
auth.onAuthStateChanged(async user=>{
  window.currentUser=user||null;
  if(user){
    currentUser=user;
    await user.reload();
    const isGoogle=user.providerData.some(p=>p.providerId==='google.com');
    if(!user.emailVerified&&!isGoogle){
      document.getElementById('auth-screen').style.display='none';
      document.getElementById('verify-screen').style.display='flex';
      document.getElementById('shell').style.display='none';
      const vl=document.getElementById('verify-email-lbl');if(vl)vl.textContent=user.email;
    }else{
      document.getElementById('auth-screen').style.display='none';
      document.getElementById('verify-screen').style.display='none';
      document.getElementById('shell').style.display='';
      const lbl=document.getElementById('user-email-lbl');if(lbl)lbl.textContent=user.email;
      await loadFromFirestore();
    }
  }else{
    currentUser=null;
    document.getElementById('auth-screen').style.display='flex';
    document.getElementById('verify-screen').style.display='none';
    document.getElementById('shell').style.display='none';
  }
});

// FIRESTORE

// ── DATA MIGRATION: old structure → new amounts-based structure ──
function migrateData(){
  // Migrate incomeFixed: amount → amounts:{fixed:X}
  S.incomeFixed.forEach(function(e){
    if(e.amount!==undefined&&(!e.amounts||Object.keys(e.amounts).length===0)){
      e.amounts={fixed:e.amount};
    }
    if(!e.amounts)e.amounts={};
    delete e.amount;
  });
  // Migrate monthIncome → incomeFixed with month-specific amounts
  if(S.monthIncome){
    Object.keys(S.monthIncome).forEach(function(mk){
      (S.monthIncome[mk]||[]).forEach(function(me){
        // Find matching entry in incomeFixed
        var existing=S.incomeFixed.find(function(e){return e.id===me.id||e.name===me.name;});
        if(existing){
          existing.amounts[mk]=me.amount||0;
        } else {
          // New entry not in incomeFixed
          me.amounts=me.amounts||{};
          me.amounts[mk]=me.amount||0;
          delete me.amount;
          S.incomeFixed.push(me);
        }
      });
    });
    delete S.monthIncome;
  }
  // Migrate goals: monthly → amounts:{fixed:X}, remove kw/history
  S.goals.forEach(function(g){
    if(!g.amounts)g.amounts={};
    if(g.monthly!==undefined&&g.monthly>0&&!g.amounts.fixed){
      g.amounts={fixed:g.monthly};
    }
    // Keep target/current, remove old fields
    delete g.monthly;
    delete g.kw;
    delete g.history;
  });
  // Migrate cat entries: amount → amounts:{fixed:X}
  S.cats.forEach(function(c){
    c.entries.forEach(function(e){
      if(e.amount!==undefined&&(!e.amounts||Object.keys(e.amounts).length===0)){
        e.amounts={fixed:e.amount};
      }
      if(!e.amounts)e.amounts={};
      delete e.amount;
    });
  });
  // Migrate goals.current → currentAmounts
  S.goals.forEach(function(g){
    if(!g.currentAmounts){
      g.currentAmounts={fixed:g.current||0};
    }
  });
  // Auto-tag sparen entries
  S.cats.forEach(function(c){
    if(c.name&&c.name.toLowerCase().includes('sparen')){
      c.entries.forEach(function(e){
        if(!e.tag)e.tag='sparen';
      });
    }
  });
}
async function loadFromFirestore(){
  try{
    const snap=await userDoc().get();
    if(snap.exists){
      const d=snap.data();
      if(d.incomeFixed)S.incomeFixed=d.incomeFixed;
      if(d.monthIncome)S.monthIncome=d.monthIncome;
      if(d.cats)S.cats=d.cats;
      if(d.unc)S.unc=d.unc;
      if(d.goals)S.goals=d.goals;
      if(d.nid)nid=d.nid;
      if(d.pct)S.pct=d.pct; else S.pct={fix:50,lifestyle:30,save:20};
      if(d.userName){window._userName=d.userName;updateTopbarName(d.userName);}
      else if(currentUser&&currentUser.displayName&&!window._userName){
        var firstName=currentUser.displayName.split(' ')[0];
        window._userName=firstName;
        updateTopbarName(firstName);
      }
    } else if(currentUser&&currentUser.displayName&&!window._userName){
      var firstName=currentUser.displayName.split(' ')[0];
      window._userName=firstName;
      updateTopbarName(firstName);
    }
  }catch(e){console.error('Load:',e);}
  migrateData();
  applyCreditedMonths();
  syncG();rAll();
}
window.cloudSave=()=>{
  if(!currentUser)return;
  clearTimeout(saveTimer);
  saveTimer=setTimeout(async()=>{
    try{
      // Daten bereinigen - kein undefined, kein monthIncome
      const clean = obj => JSON.parse(JSON.stringify(obj, (k,v) => v === undefined ? null : v));
      await userDoc().set({
        incomeFixed: clean(S.incomeFixed),
        cats:        clean(S.cats),
        unc:         clean(S.unc),
        goals:       clean(S.goals),
        pct:         clean(S.pct || {fix:50,lifestyle:30,save:20}),
        nid,
        userName:    window._userName||''
      });
      var now = Date.now();
      if(now - lastBackupTime > 5*60*1000){ lastBackupTime=now; saveBackup(); }
    }
    catch(e){console.error('Save:',e);}
  },800);
};

// PROFIL SAVE NAME — saved to Firestore
window.saveProfilName=async()=>{
  const name=document.getElementById('profil-name').value.trim();
  window._userName=name;
  updateTopbarName(name);
  if(window.cloudSave)cloudSave();
  const fb=document.getElementById('name-feedback');
  fb.className='profil-feedback ok';fb.textContent='✓ Name gespeichert';
  setTimeout(()=>fb.textContent='',2000);
};

// PROFIL SAVE EMAIL
window.saveProfilEmail=async()=>{
  const newEmail=document.getElementById('profil-email').value.trim();
  const pw=document.getElementById('profil-pw-confirm').value;
  const fb=document.getElementById('email-feedback');
  fb.className='profil-feedback';fb.textContent='';
  if(!newEmail){fb.className='profil-feedback err';fb.textContent='E-Mail eingeben.';return;}
  if(!pw){fb.className='profil-feedback err';fb.textContent='Passwort eingeben.';return;}
  try{
    const cred=firebase.auth.EmailAuthProvider.credential(currentUser.email,pw);
    await currentUser.reauthenticateWithCredential(cred);
    await currentUser.updateEmail(newEmail);
    fb.className='profil-feedback ok';fb.textContent='✓ E-Mail geändert!';
    document.getElementById('user-email-lbl').textContent=newEmail;
  }catch(e){
    const msgs={'auth/wrong-password':'Falsches Passwort.','auth/email-already-in-use':'E-Mail bereits in Verwendung.','auth/invalid-email':'Ungültige E-Mail.'};
    fb.className='profil-feedback err';fb.textContent=msgs[e.code]||e.message;
  }
};

// DELETE ACCOUNT
window.delFinal=async()=>{
  const fb=document.getElementById('delete-feedback');
  fb.textContent='';
  try{
    try{await userDoc().delete();}catch(e){}
    await currentUser.delete();
    window.closeProfil();
  }catch(e){
    if(e.code==='auth/requires-recent-login'){
      fb.textContent='Bitte erneut anmelden und dann nochmal versuchen.';
      setTimeout(()=>auth.signOut(),2000);
    }else{fb.textContent=e.message;}
  }
};

// Auto-detect desktop on load
(function(){
  if(typeof window !== 'undefined' && window.innerWidth >= 768){
    var sh = document.getElementById('shell');
    if(sh && !sh.classList.contains('desktop')) sh.classList.add('desktop');
  }
  window.addEventListener('resize', function(){
    var sh = document.getElementById('shell');
    if(!sh) return;
    if(window.innerWidth >= 768) sh.classList.add('desktop');
  });
})();

// ── MONTH PICKER ──
var mpSelected = 0;
var mpYearSelected = 2024;
window.openMonthPicker = function() {
  mpSelected = M;
  mpYearSelected = Y;
  renderMpicker();
  var bg = document.getElementById('mpicker-bg');
  if(bg) bg.style.display = 'flex';
};
function renderMpicker() {
  var title = document.getElementById('mpicker-title');
  if(title) title.textContent = String(mpYearSelected);
  var grid = document.getElementById('mpicker-grid');
  if(!grid) return;
  var mn = ['Jän','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
  grid.innerHTML = '';
  var now = new Date();
  mn.forEach(function(name, i) {
    var btn = document.createElement('button');
    var isCur = i === now.getMonth() && mpYearSelected === now.getFullYear();
    btn.className = 'mpicker-m' + (i === mpSelected ? ' selected' : '') + (isCur ? ' current' : '');
    btn.textContent = name;
    btn.addEventListener('click', function() {
      mpSelected = i;
      grid.querySelectorAll('.mpicker-m').forEach(function(b){ b.classList.remove('selected'); });
      btn.classList.add('selected');
    });
    grid.appendChild(btn);
  });
}
document.addEventListener('DOMContentLoaded', function() {
  var ok = document.getElementById('mpicker-ok');
  if(ok) ok.addEventListener('click', function() {
    var changed = mpSelected !== M || mpYearSelected !== Y;
    M = mpSelected; Y = mpYearSelected;
    if(changed){ syncG(); rAll(); }
    var bg = document.getElementById('mpicker-bg');
    if(bg) bg.style.display = 'none';
  });
  var cancel = document.getElementById('mpicker-cancel');
  if(cancel) cancel.addEventListener('click', function() {
    var bg = document.getElementById('mpicker-bg');
    if(bg) bg.style.display = 'none';
  });
  var bg = document.getElementById('mpicker-bg');
  if(bg) bg.addEventListener('click', function(e) {
    if(e.target === bg) bg.style.display = 'none';
  });
  var prev = document.getElementById('mpicker-year-prev');
  if(prev) prev.addEventListener('click', function() { mpYearSelected--; renderMpicker(); });
  var next = document.getElementById('mpicker-year-next');
  if(next) next.addEventListener('click', function() { mpYearSelected++; renderMpicker(); });
  var mlbl = document.getElementById('mlbl');
  if(mlbl) mlbl.addEventListener('click', window.openMonthPicker);
  var mlbl2 = document.getElementById('mlbl2');
  if(mlbl2) mlbl2.addEventListener('click', window.openMonthPicker);
  var lbBtn = document.getElementById('load-backups-btn');
  if(lbBtn) lbBtn.addEventListener('click', window.loadBackups);
});

// ── BACKUP SYSTEM ──
var MAX_BACKUPS = 30;
var lastBackupTime = 0;
function backupsRef() { return db.collection('users').doc(currentUser.uid).collection('backups'); }

function saveBackup() {
  if(!currentUser) return;
  try {
    var now = new Date();
    var key = now.toISOString().replace(/[:.]/g,'-').slice(0,19);
    var label = now.toLocaleDateString('de-AT',{day:'2-digit',month:'2-digit',year:'numeric'}) +
                ' ' + now.toLocaleTimeString('de-AT',{hour:'2-digit',minute:'2-digit'});
    backupsRef().doc(key).set({
      label: label,
      createdAt: now.toISOString(),
      data: {incomeFixed:S.incomeFixed,monthIncome:S.monthIncome,cats:S.cats,unc:S.unc,goals:S.goals,nid:nid,userName:window._userName||''}
    }).then(function() {
      return backupsRef().orderBy('createdAt','asc').get();
    }).then(function(snap) {
      if(snap.size > MAX_BACKUPS) {
        var toDelete = snap.docs.slice(0, snap.size - MAX_BACKUPS);
        toDelete.forEach(function(d){ d.ref.delete(); });
      }
    });
  } catch(e) { console.error('Backup error:', e); }
}

window.loadBackups = function() {
  var list = document.getElementById('backup-list');
  var fb = document.getElementById('backup-feedback');
  if(!list) return;
  list.style.display = 'block';
  list.innerHTML = '<div class="backup-empty">Lade...</div>';
  backupsRef().orderBy('createdAt','desc').limit(30).get().then(function(snap) {
    if(snap.empty) { list.innerHTML = '<div class="backup-empty">Noch keine Backups.</div>'; return; }
    list.innerHTML = '';
    snap.forEach(function(doc) {
      var d = doc.data();
      var row = document.createElement('div');
      row.className = 'backup-item';
      var span = document.createElement('span');
      span.className = 'backup-date';
      span.textContent = d.label || doc.id;
      var btn = document.createElement('button');
      btn.className = 'backup-restore';
      btn.textContent = 'Wiederherstellen';
      btn.addEventListener('click', function() { restoreBackup(doc.id, d.label, d.data); });
      row.appendChild(span);
      row.appendChild(btn);
      list.appendChild(row);
    });
  }).catch(function(e) {
    list.innerHTML = '<div class="backup-empty">Fehler beim Laden.</div>';
  });
};

function restoreBackup(docId, label, data) {
  if(!confirm('Stand vom ' + label + ' wiederherstellen?')) return;
  var fb = document.getElementById('backup-feedback');
  try {
    if(data.incomeFixed) S.incomeFixed = data.incomeFixed;
    if(data.pct) S.pct = data.pct; else S.pct = {fix:50,lifestyle:30,save:20};
    if(data.monthIncome) S.monthIncome = data.monthIncome;
    if(data.cats) S.cats = data.cats;
    if(data.unc) S.unc = data.unc;
    if(data.goals) S.goals = data.goals;
    if(data.nid) nid = data.nid;
    if(data.userName) { window._userName = data.userName; updateTopbarName(data.userName); }
    syncG(); rAll();
    if(window.cloudSave) cloudSave();
    if(fb) { fb.className='profil-feedback ok'; fb.textContent='✓ Wiederhergestellt: ' + label; }
    toast('✓ Backup wiederhergestellt');
  } catch(e) {
    if(fb) { fb.className='profil-feedback err'; fb.textContent='Fehler: ' + e.message; }
  }
}
// ── MASTER EVENT DISPATCHER ──