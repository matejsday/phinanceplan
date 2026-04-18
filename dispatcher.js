// ━━━ DISPATCHER.JS — Master Event Dispatcher ━━━
// Abhängig von: allen anderen JS-Dateien
// Wird zuletzt geladen.

document.addEventListener('DOMContentLoaded', function() {

  // ── ACTIONS-MAP ──
  const ACTIONS = {
    switchAuthTab:      a  => switchAuthTab(a),
    handleGoogleAuth:  () => handleGoogleAuth(),
    handleAuth:        () => handleAuth(),
    showForgot:        () => showForgot(),
    hideForgot:        () => hideForgot(),
    handleForgot:      () => handleForgot(),
    checkVerification: () => checkVerification(),
    resendVerification:() => resendVerification(),
    handleLogout:      () => handleLogout(),
    toggleMenu:        () => toggleMenu(),
    closeMenu:         () => closeMenu(),
    toggleDesktop:     () => toggleDesktop(),
    openProfil:        () => openProfil(),
    closeProfil:       () => closeProfil(),
    openFaq:   () => { const f=document.getElementById('faq-screen'); if(f) f.style.display='flex'; },
    closeFaq:  () => { const f=document.getElementById('faq-screen'); if(f) f.style.display='none'; },
    saveProfilName:    () => saveProfilName(),
    saveProfilEmail:   () => saveProfilEmail(),
    exportCSV:         () => exportCSV(),
    resetAll:          () => resetAll(),
    delStep1:          () => delStep1(),
    delStep2:          () => delStep2(),
    delReset:          () => delReset(),
    delFinal:          () => delFinal(),
    openMonthPicker:   () => openMonthPicker(),
    loadBackups:       () => { if(window.loadBackups) loadBackups(); },
    aI:  () => aI(),
    aC:  () => aC(),
    aG:  () => aG(),
    rG:   a => rG(parseInt(a)),
    sTab: a => sTab(a),
    cM:   a => cM(parseInt(a)),
    closeAmtPopup:   () => closeAmtPopup(),
    confirmAmtPopup: () => confirmAmtPopup(),
    testCreditNextMonth: () => { if(window.testCreditNextMonth) testCreditNextMonth(); },
    goToday: () => { const n=new Date(); M=n.getMonth(); Y=n.getFullYear(); syncG(); rAll(); },
    closeWelcome: () => { if(window.closeWelcome) closeWelcome(); },
  };

  // ── HAUPT-KLICK-DISPATCHER ──
  document.addEventListener('click', function(e) {
    // Tag-Dropdowns schließen bei Klick außerhalb
    if (!e.target.closest('.tag-wrap')) {
      document.querySelectorAll('.tag-dropdown.open').forEach(m => m.classList.remove('open'));
    }

    // Amount Popup Backdrop
    const amtBg = document.getElementById('amt-popup-bg');
    if (amtBg && e.target === amtBg) { closeAmtPopup(); return; }

    // ea-btn → Amount Popup öffnen
    const eaBtn = e.target.closest('.ea-btn');
    if (eaBtn) {
      const popup = eaBtn.getAttribute('data-popup');
      if (popup) {
        const p = popup.split('|');
        if (window.openAmtPopup) openAmtPopup(p[0], p[1]==='null'?null:parseInt(p[1]), parseInt(p[2]), p[3]||'');
      }
      return;
    }

    // Tag-Dropdown öffnen/schließen
    const tagBtn = e.target.closest('[data-tagmenu]');
    if (tagBtn) {
      e.stopPropagation();
      const p = tagBtn.getAttribute('data-tagmenu').split('|');
      const menu = document.getElementById('td-' + p[0] + '-' + p[1]);
      document.querySelectorAll('.tag-dropdown.open').forEach(m => { if(m!==menu) m.classList.remove('open'); });
      if (menu) menu.classList.toggle('open');
      return;
    }

    // Tag-Option wählen
    const tagOpt = e.target.closest('[data-settag]');
    if (tagOpt) {
      e.stopPropagation();
      const p = tagOpt.getAttribute('data-settag').split('|');
      if (window.setEntryTag) setEntryTag(p[0]==='null'?null:parseInt(p[0]), parseInt(p[1]), p[2]);
      document.querySelectorAll('.tag-dropdown.open').forEach(m => m.classList.remove('open'));
      return;
    }

    // Kategorie Toggle (nicht wenn Input oder Button angeklickt)
    const catHdr = e.target.closest('[data-action-cat]');
    if (catHdr && e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON' && !e.target.closest('.drag-handle')) { tC(parseInt(catHdr.getAttribute('data-action-cat'))); return; }

    // Kategorie Schnelleingabe Toggle
    const catQuick = e.target.closest('[data-action-catquick]');
    if (catQuick) { toggleCatQuick(parseInt(catQuick.getAttribute('data-action-catquick'))); return; }

    // Kategorie Schnelleingabe Speichern
    const saveCat = e.target.closest('[data-action-savecatquick]');
    if (saveCat) { saveCatQuick(parseInt(saveCat.getAttribute('data-action-savecatquick'))); return; }

    // Eintrag zu Kategorie hinzufügen
    const addEntry = e.target.closest('[data-action-aec]');
    if (addEntry) { aEC(parseInt(addEntry.getAttribute('data-action-aec'))); return; }

    // Kategorie löschen
    const catRmv = e.target.closest('[data-rmv-cat]');
    if (catRmv) { rC(parseInt(catRmv.getAttribute('data-rmv-cat'))); return; }

    // Eintrag/Einnahme löschen
    const rmvBtn = e.target.closest('[data-rmv]');
    if (rmvBtn) {
      const p = rmvBtn.getAttribute('data-rmv').split('|');
      if (p[0]==='exp') rE(p[1]==='null'?null:parseInt(p[1]), parseInt(p[2]));
      else if (p[0]==='inc') rI(parseInt(p[2]));
      return;
    }

    // Note button toggle
    const noteBtn = e.target.closest('[data-note]');
    if (noteBtn) {
      const p = noteBtn.getAttribute('data-note').split('|');
      toggleNote(p[0]==='null'?null:parseInt(p[0]), parseInt(p[1]));
      return;
    }

    // Rule % badge click
    const ruleBtn = e.target.closest('[data-edit-rule]');
    if (ruleBtn) { openRulePopup(ruleBtn.getAttribute('data-edit-rule')); return; }

    // Bar collapsible toggle
    const barRow = e.target.closest('[data-bar-tag]');
    if (barRow) {
      const tag = barRow.getAttribute('data-bar-tag');
      const detail = document.getElementById('bar-detail-' + tag);
      if (detail) {
        const isOpen = detail.classList.contains('open');
        document.querySelectorAll('.bar-detail.open').forEach(d => d.classList.remove('open'));
        document.querySelectorAll('.bar-collapsible.open').forEach(d => d.classList.remove('open'));
        if (!isOpen) { detail.classList.add('open'); barRow.classList.add('open'); }
      }
      return;
    }

    // #fix Toggle für Einnahmen
    const fixInc = e.target.closest('[data-fix-inc]');
    if (fixInc) { tFixInc(parseInt(fixInc.getAttribute('data-fix-inc'))); return; }

    // data-action Buttons
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const actions = (btn.getAttribute('data-action') || '').split(' ');
    const arg = btn.getAttribute('data-arg') || btn.getAttribute('data-id') || '';
    actions.forEach(action => { if (action && ACTIONS[action]) ACTIONS[action](arg); });
  });

  // ── CHANGE-EVENTS (Inputs) ──
  document.addEventListener('change', function(e) {
    // Editierbare Prozentsätze
    const pctInp = e.target.closest('[data-pct-field]');
    if (pctInp) {
      const field = pctInp.getAttribute('data-pct-field');
      const val = Math.max(1, Math.min(99, parseInt(pctInp.value) || 0));
      if (!S.pct) S.pct = {fix:50, lifestyle:30, save:20};
      S.pct[field] = val;
      const fields = ['fix','lifestyle','save'];
      const others = fields.filter(f => f !== field);
      const remaining = 100 - val;
      const otherSum = others.reduce((s,f) => s + S.pct[f], 0);
      if (otherSum > 0) others.forEach(f => { S.pct[f] = Math.round(S.pct[f] / otherSum * remaining); });
      rOpt(); if (window.cloudSave) cloudSave();
      return;
    }
    // Sparziel-Felder
    const goalInp = e.target.closest('[data-change-goal]');
    if (goalInp) {
      const p = goalInp.getAttribute('data-change-goal').split('|');
      // Name changes: save without re-render (prevents card jump)
      // Target/current changes: re-render to update progress
      const noRender = p[1] === 'name';
      uG(parseInt(p[0]), p[1], goalInp.value, noRender);
      return;
    }
    // Normale Einträge
    const inp = e.target.closest('[data-change]');
    if (!inp) return;
    const p = inp.getAttribute('data-change').split('|');
    if      (p[0]==='uEN') uEN(p[1]==='null'?null:parseInt(p[1]), parseInt(p[2]), inp.value);
    else if (p[0]==='uIN') uIN(parseInt(p[1]), inp.value);
    else if (p[0]==='uCN') uCN(parseInt(p[1]), inp.value);
    // Note input
    const noteInp = e.target.closest('[data-note-change]');
    if (noteInp) {
      const pn = noteInp.getAttribute('data-note-change').split('|');
      if(window.saveNote) saveNote(pn[0]==='null'?null:parseInt(pn[0]), parseInt(pn[1]), noteInp.value);
    }

  });

  // ── INPUT-EVENTS (Live-Berechnung) ──
  document.addEventListener('input', function(e) {
    // Erreichungsrechner
    const simInp = e.target.closest('[data-sim]');
    if (simInp) {
      const gid = parseInt(simInp.getAttribute('data-sim'));
      const g = S.goals.find(x => x.id === gid);
      const rate = parseFloat(simInp.value) || 0;
      const result = document.getElementById('gsim-' + gid);
      if (result && g) {
        if (rate <= 0 || !g.target) { result.textContent = '—'; return; }
        const months = Math.ceil((g.target - (g.current||0)) / rate);
        if (months <= 0) { result.textContent = '✓ Bereits erreicht'; return; }
        const d = new Date();
        d.setMonth(d.getMonth() + months);
        result.textContent = String(d.getMonth()+1).padStart(2,'0') + '.' + d.getFullYear();
      }
    }
  });

  // ── Cursor ans Ende bei Fokus (global) ──
  document.addEventListener('focusin', function(e) {
    const inp = e.target;
    if (!inp || inp.tagName !== 'INPUT') return;
    setTimeout(function() {
      try {
        if (inp.type === 'number') {
          // Number inputs: convert to text briefly to set cursor
          inp.type = 'text';
          const len = (inp.value || '').length;
          inp.setSelectionRange(len, len);
          inp.type = 'number';
        } else if (inp.type === 'text' || inp.type === '') {
          const len = (inp.value || '').length;
          inp.setSelectionRange(len, len);
        }
      } catch(e) {}
    }, 0);
  });

  // ── Amount Popup Keyboard ──
  const amtInp = document.getElementById('amt-popup-inp');
  if (amtInp) amtInp.addEventListener('keydown', function(e) {
    if (e.key === 'Enter')  { if(window.confirmAmtPopup) confirmAmtPopup(); }
    if (e.key === 'Escape') { if(window.closeAmtPopup)   closeAmtPopup(); }
  });

  // ── Monatsnavigation ──
  const mlbl = document.getElementById('mlbl');
  if (mlbl) mlbl.addEventListener('click', () => { if(window.openMonthPicker) openMonthPicker(); });
  const mlbl2 = document.getElementById('mlbl2');
  if (mlbl2) mlbl2.addEventListener('click', () => { if(window.openMonthPicker) openMonthPicker(); });

  // ── Backdrops ──
  const profilBg = document.getElementById('profil-screen');
  if (profilBg) profilBg.addEventListener('click', e => { if(e.target===profilBg) closeProfil(); });
  const faqBg = document.getElementById('faq-screen');
  if (faqBg) faqBg.addEventListener('click', e => { if(e.target===faqBg) faqBg.style.display='none'; });
  const dlgBg = document.getElementById('dlg');
  if (dlgBg) dlgBg.addEventListener('click', e => { if(e.target===dlgBg) dlgBg.style.display='none'; });

  // ── Backups ──
  const lbBtn = document.getElementById('load-backups-btn');
  if (lbBtn) lbBtn.addEventListener('click', () => { if(window.loadBackups) loadBackups(); });

  // ── CSV Import ──
  const importInput = document.getElementById('import-csv-input');
  if (importInput) importInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file && window.importCSV) importCSV(file);
    e.target.value = '';
  });

  // ── PLACEHOLDER CLEAR für neue Kategorie ──
  document.addEventListener('focusin', function(e) {
    const inp = e.target.closest('[data-clear-new]');
    if (inp && inp.value === 'Neue Kategorie') inp.value = '';
  });

  // ── Auth Keyboard ──
  const authPw = document.getElementById('auth-password');
  if (authPw) authPw.addEventListener('keydown', e => { if(e.key==='Enter') handleAuth(); });
  const authEmail = document.getElementById('auth-email');
  if (authEmail) authEmail.addEventListener('keydown', e => { if(e.key==='Enter') { const pw=document.getElementById('auth-password'); if(pw) pw.focus(); } });
  const forgotInp = document.getElementById('forgot-email');
  if (forgotInp) forgotInp.addEventListener('keydown', e => { if(e.key==='Enter') handleForgot(); });

  // Mobile zuerst - Desktop nur manuell via Menü einschalten

  // ── Swipe Navigation ──
  let touchStartX = 0;
  const mainContent = document.getElementById('shell');
  if (mainContent) {
    mainContent.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, {passive:true});
    mainContent.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 60) cM(diff > 0 ? 1 : -1);
    }, {passive:true});
  }

  // ── DRAG & DROP (Desktop) ──
  let _dragSrcCat = null, _dragSrcEid = null, _dragSrcEcid = null, _dragSrcGoal = null;

  document.addEventListener('dragstart', function(e) {
    const entryEl = e.target.closest('[data-drag-eid]');
    const catEl   = e.target.closest('[data-drag-cat]');
    const goalEl  = e.target.closest('[data-drag-goal]');

    if (entryEl) {
      // Entry drag (takes priority over cat)
      _dragSrcEid   = parseInt(entryEl.getAttribute('data-drag-eid'));
      _dragSrcEcid  = entryEl.getAttribute('data-drag-ecid') === 'null' ? null : parseInt(entryEl.getAttribute('data-drag-ecid'));
      _dragSrcCat   = null;
      _dragSrcGoal  = null;
      entryEl.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    } else if (catEl) {
      // Category drag
      _dragSrcCat   = parseInt(catEl.getAttribute('data-drag-cat'));
      _dragSrcEid   = null;
      _dragSrcGoal  = null;
      catEl.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    } else if (goalEl) {
      // Goal card drag
      _dragSrcGoal  = parseInt(goalEl.getAttribute('data-drag-goal'));
      _dragSrcCat   = null;
      _dragSrcEid   = null;
      goalEl.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    }
  });

  document.addEventListener('dragend', function() {
    document.querySelectorAll('.dragging,.drag-over').forEach(el => el.classList.remove('dragging','drag-over'));
  });

  document.addEventListener('dragover', function(e) {
    e.preventDefault();
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    const entryEl = e.target.closest('[data-drag-eid]');
    const catEl   = e.target.closest('[data-drag-cat]');
    if (_dragSrcEid !== null && entryEl && parseInt(entryEl.getAttribute('data-drag-eid')) !== _dragSrcEid) entryEl.classList.add('drag-over');
    else if (_dragSrcCat !== null && catEl && parseInt(catEl.getAttribute('data-drag-cat')) !== _dragSrcCat) catEl.classList.add('drag-over');
  });

  document.addEventListener('drop', function(e) {
    e.preventDefault();
    document.querySelectorAll('.dragging,.drag-over').forEach(el => el.classList.remove('dragging','drag-over'));
    if (_dragSrcCat !== null) {
      const catEl = e.target.closest('[data-drag-cat]');
      if (!catEl) return;
      const tgtId = parseInt(catEl.getAttribute('data-drag-cat'));
      if (tgtId === _dragSrcCat) return;
      const fi = S.cats.findIndex(c => c.id === _dragSrcCat);
      const ti = S.cats.findIndex(c => c.id === tgtId);
      if (fi>=0 && ti>=0) { const [m]=S.cats.splice(fi,1); S.cats.splice(ti,0,m); rExp(); if(window.cloudSave) cloudSave(); toast('✓ Kategorie verschoben'); }
    } else if (_dragSrcEid !== null) {
      const entryEl = e.target.closest('[data-drag-eid]');
      const catEl   = e.target.closest('[data-drag-cat]');
      let tgtCid = null;
      if (entryEl) { tgtCid = entryEl.getAttribute('data-drag-ecid') === 'null' ? null : parseInt(entryEl.getAttribute('data-drag-ecid')); }
      else if (catEl) { tgtCid = parseInt(catEl.getAttribute('data-drag-cat')); }
      let entry = null;
      if (_dragSrcEcid === null) { const i=S.unc.findIndex(x=>x.id===_dragSrcEid); if(i>=0) entry=S.unc.splice(i,1)[0]; }
      else { const c=S.cats.find(x=>x.id===_dragSrcEcid); if(c){const i=c.entries.findIndex(x=>x.id===_dragSrcEid);if(i>=0) entry=c.entries.splice(i,1)[0];} }
      if (!entry) return;
      if (tgtCid===null) { S.unc.push(entry); }
      else { const c=S.cats.find(x=>x.id===tgtCid); if(c){if(entryEl){const ti=c.entries.findIndex(x=>x.id===parseInt(entryEl.getAttribute('data-drag-eid')));c.entries.splice(ti>=0?ti:c.entries.length,0,entry);}else c.entries.push(entry);} }
      var movedName = entry.name || 'Ausgabe';
      var tgtCatName = tgtCid !== null ? (S.cats.find(x=>x.id===tgtCid)||{name:'Unkategorisiert'}).name : 'Unkategorisiert';
      syncG(); rExp(); rGoals(); if(window.cloudSave) cloudSave();
      toast('✓ ' + movedName + ' → ' + tgtCatName);
    }
    // Goal drag
    if (_dragSrcGoal !== null) {
      const tgtGoalEl = e.target.closest('[data-drag-goal]');
      if (tgtGoalEl) {
        const tgtId = parseInt(tgtGoalEl.getAttribute('data-drag-goal'));
        if (tgtId !== _dragSrcGoal) {
          const fi = S.goals.findIndex(g => g.id === _dragSrcGoal);
          const ti = S.goals.findIndex(g => g.id === tgtId);
          if (fi >= 0 && ti >= 0) {
            const [moved] = S.goals.splice(fi, 1);
            S.goals.splice(ti, 0, moved);
            rGoals();
            if (window.cloudSave) cloudSave();
            toast('✓ Sparziel verschoben');
          }
        }
      }
      _dragSrcGoal = null;
    }
    _dragSrcCat=null; _dragSrcEid=null; _dragSrcEcid=null;
  });

  // ── TOUCH DRAG (Mobile Long Press) ──
  let _tTimer=null, _tActive=false, _tEl=null, _tClone=null;
  document.addEventListener('touchstart', function(e) {
    const el = e.target.closest('[data-drag-eid]') || e.target.closest('[data-drag-cat]');
    if (!el) return;
    _tEl = el;
    _tTimer = setTimeout(function() {
      _tActive = true;
      el.classList.add('dragging');
      _tClone = el.cloneNode(true);
      _tClone.style.cssText='position:fixed;z-index:99999;opacity:.88;pointer-events:none;box-shadow:0 12px 40px rgba(0,0,0,.25);transform:scale(1.03) rotate(-1deg);border-radius:12px;background:var(--surface);width:'+el.offsetWidth+'px;transition:none';
      document.body.appendChild(_tClone);
      if(navigator.vibrate) navigator.vibrate(25);
    }, 450);
  }, {passive:true});

  document.addEventListener('touchmove', function(e) {
    clearTimeout(_tTimer);
    if (!_tActive || !_tClone) return;
    e.preventDefault();
    const t = e.touches[0];
    _tClone.style.left = (t.clientX - _tClone.offsetWidth/2)+'px';
    _tClone.style.top  = (t.clientY - 40)+'px';
    _tClone.style.display='none';
    const below = document.elementFromPoint(t.clientX, t.clientY);
    _tClone.style.display='';
    document.querySelectorAll('.drag-over').forEach(el=>el.classList.remove('drag-over'));
    if (below) {
      const de=below.closest('[data-drag-eid]'), dc=below.closest('[data-drag-cat]');
      if(de&&de!==_tEl) de.classList.add('drag-over');
      else if(dc&&dc!==_tEl) dc.classList.add('drag-over');
    }
  }, {passive:false});

  document.addEventListener('touchend', function(e) {
    clearTimeout(_tTimer);
    if (_tClone) { _tClone.remove(); _tClone=null; }
    document.querySelectorAll('.dragging,.drag-over').forEach(el=>el.classList.remove('dragging','drag-over'));
    if (!_tActive || !_tEl) { _tActive=false; _tEl=null; return; }
    _tActive=false;
    const t=e.changedTouches[0];
    const below=document.elementFromPoint(t.clientX, t.clientY);
    if (!below) { _tEl=null; return; }
    const isCat = !!_tEl.getAttribute('data-drag-cat') && !_tEl.getAttribute('data-drag-eid');
    if (isCat) {
      const srcId=parseInt(_tEl.getAttribute('data-drag-cat'));
      const dc=below.closest('[data-drag-cat]');
      if(dc){const ti=parseInt(dc.getAttribute('data-drag-cat'));if(ti!==srcId){const fi=S.cats.findIndex(c=>c.id===srcId),t2=S.cats.findIndex(c=>c.id===ti);if(fi>=0&&t2>=0){const[m]=S.cats.splice(fi,1);S.cats.splice(t2,0,m);rExp();if(window.cloudSave)cloudSave();toast('✓ Kategorie verschoben');}}}
    } else {
      const srcEid=parseInt(_tEl.getAttribute('data-drag-eid'));
      const srcEcid=_tEl.getAttribute('data-drag-ecid')==='null'?null:parseInt(_tEl.getAttribute('data-drag-ecid'));
      const de=below.closest('[data-drag-eid]'),dc=below.closest('[data-drag-cat]');
      let tgtCid=null;
      if(de){tgtCid=de.getAttribute('data-drag-ecid')==='null'?null:parseInt(de.getAttribute('data-drag-ecid'));}
      else if(dc){tgtCid=parseInt(dc.getAttribute('data-drag-cat'));}
      if(tgtCid===srcEcid){_tEl=null;return;}
      let entry=null;
      if(srcEcid===null){const i=S.unc.findIndex(x=>x.id===srcEid);if(i>=0)entry=S.unc.splice(i,1)[0];}
      else{const c=S.cats.find(x=>x.id===srcEcid);if(c){const i=c.entries.findIndex(x=>x.id===srcEid);if(i>=0)entry=c.entries.splice(i,1)[0];}}
      if(!entry){_tEl=null;return;}
      if(tgtCid===null){S.unc.push(entry);}else{const c=S.cats.find(x=>x.id===tgtCid);if(c)c.entries.push(entry);}
      syncG();rExp();rGoals();if(window.cloudSave)cloudSave();toast('✓ Ausgabe verschoben');
    }
    _tEl=null;
  }, {passive:true});

});
