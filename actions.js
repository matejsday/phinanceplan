// ━━━ ACTIONS.JS — Benutzeraktionen ━━━
// Abhängig von: data.js, calc.js, render.js (für Re-Render nach Aktion)

// ── Helpers ──
function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function showDlg(title, msg, btns) {
  const dt = document.getElementById('dt');
  const dm = document.getElementById('dm');
  const da = document.getElementById('da');
  const dlg = document.getElementById('dlg');
  if (!dlg) return;
  if (dt) dt.textContent = title;
  if (dm) dm.textContent = msg;
  if (da) {
    da.innerHTML = '';
    btns.forEach(b => {
      const btn = document.createElement('button');
      btn.className = 'dbt' + (b.cls ? ' ' + b.cls : '');
      btn.textContent = b.l;
      btn.onclick = () => { dlg.style.display = 'none'; b.fn(); };
      da.appendChild(btn);
    });
  }
  dlg.style.display = 'flex';
}

function confirmDelete(label, onOk) {
  showDlg('Löschen', `"${label || 'Eintrag'}" wirklich löschen?`, [
    {l: 'Abbrechen', fn: () => {}},
    {l: 'Löschen', cls: 'ok', fn: onOk}
  ]);
}

// ── Amount Popup ──
let _amtCb = null;

window.openAmtPopup = function(type, cid, eid, label) {
  let cur = 0;

  if (type === 'goal') {
    const g = S.goals.find(x => x.id === eid);
    if (g) cur = getAmtFor({amounts: g.amounts || {}}, mk());
    _amtCb = function(val) {
      const g2 = S.goals.find(x => x.id === eid);
      if (!g2) return;
      if (!g2.amounts) g2.amounts = {};
      showDlg('Rate ändern', 'Nur ' + MN[M] + ' oder alle Monate?', [
        {l: 'Nur diesen Monat', fn: () => { sA({amounts: g2.amounts}, val, false); syncG(); rGoals(); rBudget(); if (window.cloudSave) cloudSave(); }},
        {l: 'Alle Monate', cls: 'grn', fn: () => { sA({amounts: g2.amounts}, val, true); syncG(); rGoals(); rBudget(); if (window.cloudSave) cloudSave(); }}
      ]);
    };
  } else if (type === 'exp') {
    const e = fE(cid, eid);
    if (e) cur = gA(e);
    _amtCb = val => uEA(cid, eid, val);
  } else {
    // inc
    const ei = S.incomeFixed.find(x => x.id === eid);
    if (ei) cur = getAmtFor(ei, mk());
    _amtCb = val => uIA(eid, val);
  }

  const inp = document.getElementById('amt-popup-inp');
  const nm  = document.getElementById('amt-popup-name');
  const lbl = document.getElementById('amt-popup-label');
  if (inp) inp.value = cur || '';
  if (nm)  nm.textContent  = label || '';
  if (lbl) lbl.textContent = type === 'inc' ? 'Einnahme' : type === 'goal' ? 'Sparrate' : 'Ausgabe';

  const bg = document.getElementById('amt-popup-bg');
  if (bg) bg.classList.add('open');
  setTimeout(() => { if (inp) { inp.focus(); inp.select(); } }, 80);
};

window.closeAmtPopup = function() {
  const bg = document.getElementById('amt-popup-bg');
  if (bg) bg.classList.remove('open');
  _amtCb = null;
};

window.confirmAmtPopup = function() {
  const val = parseFloat(document.getElementById('amt-popup-inp').value) || 0;
  if (_amtCb) _amtCb(val);
  window.closeAmtPopup();
};

// ── Einnahmen ──
window.aI = () => {
  S.incomeFixed.push({id: uid(), name: '', amounts: {fixed: 0}, fix: false});
  rBudget();
  if (window.cloudSave) cloudSave();
};

window.rI = id => {
  const e = S.incomeFixed.find(x => x.id === id);
  confirmDelete(e ? e.name : 'Einnahme', () => {
    S.incomeFixed = S.incomeFixed.filter(x => x.id !== id);
    rBudget();
    if (window.cloudSave) cloudSave();
  });
};

window.uIN = (id, v) => {
  const e = S.incomeFixed.find(x => x.id === id);
  if (e) e.name = v;
};

window.uIA = (id, v) => {
  const num = parseFloat(v) || 0;
  const e = S.incomeFixed.find(x => x.id === id);
  if (!e) return;
  const label = e.name || 'Einnahme';
  showDlg('"' + label + '" speichern?', '', [
    {l: 'Nur ' + MN[M], fn: () => {
      e.amounts[mk()] = num;
      if (!('fixed' in e.amounts)) e.amounts.fixed = num;
      syncG(); rBudget(); if (window.cloudSave) cloudSave();
    }},
    {l: 'Ab ' + MN[M], fn: () => {
      e.amounts.fixed = num;
      e.createdAt = mk();
      syncG(); rBudget(); if (window.cloudSave) cloudSave();
    }},
    {l: 'Ganzes Jahr', cls: 'grn', fn: () => {
      for (let mi = 0; mi < 12; mi++) { e.amounts[mk(Y, mi)] = num; }
      e.amounts.fixed = num;
      syncG(); rBudget(); if (window.cloudSave) cloudSave();
    }},
    {l: 'Abbrechen', fn: () => {}}
  ]);
};

window.tFixInc = function(id) {
  const e = S.incomeFixed.find(x => x.id === id);
  if (!e) return;
  e.fix = !e.fix;
  if (e.fix && e.amounts.fixed === undefined) {
    e.amounts.fixed = e.amounts[mk()] || 0;
  }
  rBudget();
  if (window.cloudSave) cloudSave();
};

// ── Ausgaben ──
window.aC = () => {
  S.cats.push({id: uid(), name: '', entries: []});
  rExp();
  toast('✓ Kategorie erstellt');
  setTimeout(() => {
    const el = document.getElementById('el');
    if (el) el.lastElementChild && el.lastElementChild.scrollIntoView({behavior:'smooth', block:'end'});
  }, 100);
  if (window.cloudSave) cloudSave();
};

window.rC = id => {
  const c = S.cats.find(x => x.id === id);
  confirmDelete(c ? c.name : 'Kategorie', () => {
    S.cats = S.cats.filter(x => x.id !== id);
    syncG(); rBudget(); rGoals();
    if (window.cloudSave) cloudSave();
  });
};

window.uCN = (id, v) => {
  const c = S.cats.find(x => x.id === id);
  if (c) c.name = v;
};

window.tC = id => {
  const el  = document.getElementById('cb-' + id);
  const tog = document.getElementById('ct-' + id);
  if (el) {
    el.classList.toggle('open');
    if (tog) tog.textContent = el.classList.contains('open') ? '▾' : '▸';
  }
};

window.aEC = cid => {
  const c = S.cats.find(x => x.id === cid);
  if (c) {
    const isSparen = c.name && c.name.toLowerCase().includes('sparen');
    c.entries.push({id: uid(), name: '', fix: false, amounts: {fixed:0}, tag: isSparen ? 'sparen' : null, createdAt: mk()});
    if (isSparen) { syncG(); rGoals(); }
  }
  rExp();
  if (window.cloudSave) cloudSave();
};

// aU removed - uncategorized entries not used


window.rE = (cid, eid) => {
  const e = fE(cid, eid);
  if (!e) return;
  const label = e.name || 'Ausgabe';
  showDlg('"' + label + '" löschen?', 'Wie soll gelöscht werden?', [
    {l: 'Nur ' + MN[M], fn: () => {
      // Nur diesen Monat → Betrag auf 0
      if (!e.amounts) e.amounts = {};
      e.amounts[mk()] = 0;
      syncG(); rBudget(); rGoals();
      if (window.cloudSave) cloudSave();
      toast('✓ ' + label + ' für ' + MN[M] + ' auf 0 gesetzt');
    }},
    {l: 'Ab ' + MN[M], fn: () => {
      // Ab diesem Monat → deletedFrom setzen
      e.deletedFrom = mk();
      syncG(); rBudget(); rGoals();
      if (window.cloudSave) cloudSave();
      toast('✓ ' + label + ' ab ' + MN[M] + ' entfernt');
    }},
    {l: 'Aus ganzem Jahr', cls: 'ok', fn: () => {
      // Komplett entfernen
      if (cid === null) {
        S.unc = S.unc.filter(x => x.id !== eid);
      } else {
        const c = S.cats.find(x => x.id === cid);
        if (c) c.entries = c.entries.filter(x => x.id !== eid);
      }
      syncG(); rBudget(); rGoals();
      if (window.cloudSave) cloudSave();
      toast('✓ ' + label + ' komplett entfernt');
    }},
    {l: 'Abbrechen', fn: () => {}},
  ]);
};

window.uEN = (cid, eid, v) => {
  const e = fE(cid, eid);
  if (e) e.name = v;
  syncG(); rBudget(); rGoals();
  if (window.cloudSave) cloudSave();
};

// tFixExp removed - no dispatcher handler


window.uEA = (cid, eid, v) => {
  const e = fE(cid, eid);
  if (!e) return;
  const num = parseFloat(v) || 0;
  const label = e.name || 'Ausgabe';
  showDlg('"' + label + '" speichern?', '', [
    {l: 'Nur ' + MN[M], fn: () => {
      e.amounts[mk()] = num;
      if (!('fixed' in e.amounts)) e.amounts.fixed = num;
      syncG(); rBudget(); rGoals(); if (window.cloudSave) cloudSave();
    }},
    {l: 'Ab ' + MN[M], fn: () => {
      e.amounts.fixed = num;
      e.createdAt = mk();
      // Zukünftige spezifische Werte entfernen
      Object.keys(e.amounts).forEach(k => { if (k !== 'fixed' && k >= mk()) delete e.amounts[k]; });
      syncG(); rBudget(); rGoals(); if (window.cloudSave) cloudSave();
    }},
    {l: 'Ganzes Jahr', cls: 'grn', fn: () => {
      for (let mi = 0; mi < 12; mi++) { e.amounts[mk(Y, mi)] = num; }
      e.amounts.fixed = num;
      syncG(); rBudget(); rGoals(); if (window.cloudSave) cloudSave();
    }},
    {l: 'Abbrechen', fn: () => {}}
  ]);
};

// Schnelleingabe
window.toggleCatQuick = cid => {
  const panel = document.getElementById('cq-' + cid);
  const totEl = document.getElementById('ctot-' + cid);
  if (!panel) return;
  const isOpen = panel.classList.contains('open');
  document.querySelectorAll('.cat-quick.open').forEach(el => el.classList.remove('open'));
  document.querySelectorAll('.cat-total.active').forEach(el => el.classList.remove('active'));
  if (!isOpen) {
    panel.classList.add('open');
    if (totEl) totEl.classList.add('active');
  }
};

window.saveCatQuick = cid => {
  const panel = document.getElementById('cq-' + cid);
  if (!panel) return;
  panel.querySelectorAll('.cat-quick-inp').forEach(inp => {
    const eid = parseInt(inp.dataset.eid);
    const val = parseFloat(inp.value) || 0;
    const e = fE(cid, eid);
    if (e) sA(e, val, true);
  });
  syncG(); rBudget(); rGoals();
  if (window.cloudSave) cloudSave();
  panel.classList.remove('open');
  const totEl = document.getElementById('ctot-' + cid);
  if (totEl) totEl.classList.remove('active');
  toast('✓ Alle Monate aktualisiert');
};

// ── Tags ──
window.setEntryTag = function(cid, eid, tag) {
  const e = fE(cid, eid);
  if (!e) return;
  if (tag === 'none')      { e.tag = null; e.fix = false; }
  else if (tag === 'fix')  { e.tag = 'fix'; e.fix = true; }
  else                     { e.tag = tag; e.fix = false; }
  syncG(); rBudget(); rGoals();
  if (window.cloudSave) cloudSave();
};

// ── Sparziele ──
window.aG = () => {
  const newId = uid();
  const entryId = uid();
  // Sparen-Kategorie finden oder erstellen
  let sparenCat = S.cats.find(c => c.name && c.name.toLowerCase().includes('sparen'));
  if (!sparenCat) {
    sparenCat = {id: uid(), name: 'Sparen', entries: []};
    S.cats.push(sparenCat);
  }
  const newEntry = {id: entryId, name: '', fix: false, tag: 'sparen', amounts: {fixed:0}, createdAt: mk()};
  sparenCat.entries.push(newEntry);
  // Goal mit currentAmounts, syncG NICHT aufrufen (leerer Name wird herausgefiltert)
  S.goals.push({
    id: newId, name: '', target: 0, current: 0,
    currentAmounts: {fixed: 0},
    amounts: newEntry.amounts // shared reference
  });
  rGoals(); rExp();
  if (window.cloudSave) cloudSave();
};

window.rG = id => {
  const g = S.goals.find(x => x.id === id);
  confirmDelete(g ? g.name : 'Sparziel', () => {
    const name = g ? g.name : null;
    S.goals = S.goals.filter(x => x.id !== id);
    // Auch den passenden Sparen-Eintrag entfernen
    if (name) {
      S.cats.forEach(c => {
        c.entries = c.entries.filter(e =>
          !(e.tag === 'sparen' && e.name &&
            e.name.toLowerCase().trim() === name.toLowerCase().trim())
        );
      });
    }
    syncG(); rBudget(); rGoals();
    if (window.cloudSave) cloudSave();
    toast('✓ ' + (name||'Sparziel') + ' gelöscht');
  });
};

window.uG = (id, f, v, noRender) => {
  const g = S.goals.find(x => x.id === id);
  if (!g) return;
  if (f === 'name') {
    const oldName = g.name;
    g.name = v;
    // Auch den passenden Sparen-Eintrag umbenennen
    if (v) {
      S.cats.forEach(c => {
        c.entries.forEach(e => {
          if (e.tag === 'sparen' && (!e.name || !e.name.trim() ||
              (oldName && e.name.toLowerCase().trim() === oldName.toLowerCase().trim()))) {
            e.name = v;
          }
        });
      });
    }
  } else if (f === 'target') {
    g.target = parseFloat(v) || 0;
  } else if (f === 'current') {
    const num = parseFloat(v) || 0;
    // Save to currentAmounts for this specific month
    if (!g.currentAmounts) g.currentAmounts = {fixed: 0};
    g.currentAmounts[mk()] = num;
    g.current = num; // legacy sync
  }
  if (!noRender) { syncG(); rGoals(); }
  if (window.cloudSave) cloudSave();
};

// ── Navigation ──
window.sTab = t => {
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById('pg-' + t);
  if (pg) pg.classList.add('active');
  ['b','g','o','j'].forEach(x => {
    const bn = document.getElementById('bnav-' + x);
    const sn = document.getElementById('snav-' + x);
    if (bn) bn.classList.toggle('active', x === t);
    if (sn) sn.classList.toggle('active', x === t);
  });
  if (t === 'j') rYear();
  if (t === 'g') { syncG(); rGoals(); }
  if (t === 'o') rOpt();
};

window.cM = (d, r=false) => {
  if (r) { Y = new Date().getFullYear(); M = new Date().getMonth(); }
  else {
    M += d;
    if (M > 11) { M = 0; Y++; }
    if (M < 0)  { M = 11; Y--; }
  }
  syncG(); rAll();
};

window.toggleDesktop = () => {
  const sh = document.getElementById('shell');
  if (sh) sh.classList.toggle('desktop');
};

window.toggleMenu = () => {
  const m = document.getElementById('dropdown-menu');
  const o = document.getElementById('menu-overlay');
  if (!m) return;
  const isOpen = m.classList.contains('open');
  if (isOpen) { window.closeMenu(); }
  else { m.classList.add('open'); if (o) { o.style.display = 'block'; o.classList.add('open'); } }
};

window.closeMenu = () => {
  const m = document.getElementById('dropdown-menu');
  const o = document.getElementById('menu-overlay');
  if (m) m.classList.remove('open');
  if (o) { o.classList.remove('open'); o.style.display = 'none'; }
};

// ── Profil ──
window.updateTopbarName = name => {
  const el = document.getElementById('topbar-name');
  const sn = document.getElementById('sidebar-name');
  if (el) el.textContent = name ? name + '\u2019s ' : '';
  if (sn) sn.textContent = name ? name + '\u2019s Sfinanzph\u00e4re' : '';
};

window.openProfil = () => {
  const ps = document.getElementById('profil-screen');
  if (ps) ps.style.display = 'flex';
  const pn = document.getElementById('profil-name');
  if (pn && window._userName) pn.value = window._userName;
  const pe = document.getElementById('profil-email');
  if (pe && window.currentUser) pe.value = window.currentUser.email || '';
  window.delReset();
  const nf = document.getElementById('name-feedback');
  const ef = document.getElementById('email-feedback');
  if (nf) nf.textContent = '';
  if (ef) ef.textContent = '';
};

window.closeProfil = () => {
  const ps = document.getElementById('profil-screen');
  if (ps) ps.style.display = 'none';
};

window.delStep1 = () => {
  document.getElementById('del-s1').style.display = 'none';
  document.getElementById('del-s2').style.display = 'block';
  document.getElementById('del-s3').style.display = 'none';
};
window.delStep2 = () => {
  document.getElementById('del-s1').style.display = 'none';
  document.getElementById('del-s2').style.display = 'none';
  document.getElementById('del-s3').style.display = 'block';
  document.getElementById('delete-feedback').textContent = '';
};
window.delReset = () => {
  document.getElementById('del-s1').style.display = 'block';
  document.getElementById('del-s2').style.display = 'none';
  document.getElementById('del-s3').style.display = 'none';
};

// ── Reset ──
window.resetAll = function() {
  showDlg('Betr\u00e4ge auf Null',
    'Alle Betr\u00e4ge werden auf 0 gesetzt. Kategorien und Eintr\u00e4ge bleiben erhalten.',
    [
      {l: 'Abbrechen', fn: () => {}},
      {l: 'Ja, nullen', cls: 'ok', fn: () => {
        S.incomeFixed.forEach(e => { e.amounts = {}; });
        S.cats.forEach(cat => { cat.entries.forEach(e => { e.amounts = {}; }); });
        S.unc.forEach(e => { e.amounts = {}; });
        S.goals.forEach(g => { g.current = 0; g.amounts = {}; });
        syncG(); rAll();
        if (window.cloudSave) cloudSave();
        const fb = document.getElementById('reset-feedback');
        if (fb) { fb.className = 'profil-feedback ok'; fb.textContent = '\u2713 Alle Betr\u00e4ge auf Null.'; }
        toast('\u2713 Betr\u00e4ge auf Null');
      }}
    ]
  );
};

// ── Export CSV ──
window.exportCSV = () => {
  const rows = [['Typ','Kategorie','Name','Monat','Betrag']];
  S.incomeFixed.forEach(e => {
    rows.push(['Einnahme (fix)','—',e.name||'','alle Monate', e.amounts.fixed||0]);
    Object.entries(e.amounts).forEach(([k,v]) => {
      if (k !== 'fixed') rows.push(['Einnahme (Monat)','—',e.name||'',k,v]);
    });
  });
  S.cats.forEach(cat => {
    cat.entries.forEach(e => {
      const amt = e.amounts.fixed !== undefined ? e.amounts.fixed : 0;
      rows.push(['Ausgabe', cat.name, e.name||'', e.fix?'alle Monate':'variabel', amt]);
      Object.entries(e.amounts).forEach(([k,v]) => {
        if (k !== 'fixed') rows.push(['Ausgabe (Monat)', cat.name, e.name||'', k, v]);
      });
    });
  });
  S.goals.forEach(g => {
    rows.push(['Sparziel','—',g.name||'','—',g.target||0]);
    rows.push(['Gespart','—',g.name||'','—',g.current||0]);
  });
  const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'phinancplan_export.csv'; a.click();
  URL.revokeObjectURL(url);
};

// ── Notes ──
window.toggleNote = function(cid, eid) {
  const cs = cid === null ? 'null' : String(cid);
  const nw = document.getElementById('nw-' + cs + '-' + eid);
  const btn = document.querySelector('[data-note="' + cs + '|' + eid + '"]');
  if (!nw) return;
  const isOpen = nw.classList.contains('open');
  nw.classList.toggle('open');
  if (!isOpen) { const inp = nw.querySelector('.note-inp'); if (inp) inp.focus(); }
};

window.saveNote = function(cid, eid, val) {
  const e = fE(cid, eid);
  if (!e) return;
  e.note = val;
  // Update note button style
  const cs = cid === null ? 'null' : String(cid);
  const btn = document.querySelector('[data-note="' + cs + '|' + eid + '"]');
  if (btn) btn.classList.toggle('has-note', !!(val && val.trim()));
  if (window.cloudSave) cloudSave();
};

// ── Budget Rules Popup ──
window.openRulePopup = function(field) {
  const p = S.pct || {fix:50, lifestyle:30, save:20};
  const cur = p[field] || (field==='fix'?50:field==='lifestyle'?30:20);
  const labels = {fix:'Fixkosten %', lifestyle:'Lifestyle %', save:'Sparen %'};
  showDlg(labels[field] || 'Ziel %', 'Neuen Zielwert eingeben (Summe sollte 100% ergeben)', [
    {l: 'Abbrechen', fn: () => {}},
    {l: 'Speichern', cls: 'grn', fn: () => {
      const inp = document.getElementById('rule-pct-inp');
      if (!inp) return;
      const val = parseInt(inp.value) || cur;
      if (!S.pct) S.pct = {fix:50, lifestyle:30, save:20};
      S.pct[field] = Math.max(1, Math.min(99, val));
      rOpt();
      if (window.cloudSave) cloudSave();
    }}
  ]);
  // Inject input into dialog
  setTimeout(() => {
    const dm = document.getElementById('dm');
    if (dm) dm.innerHTML += '<br><input id="rule-pct-inp" type="number" min="1" max="99" value="' + cur + '" style="margin-top:12px;width:80px;font-size:20px;font-family:var(--mono);font-weight:600;text-align:center;border:none;border-bottom:2px solid var(--sage);outline:none;background:none;color:var(--ink)">';
    const inp = document.getElementById('rule-pct-inp');
    if (inp) { inp.focus(); inp.select(); }
  }, 50);
};

// ── DEBUG: Monatsgutschrift testen ──
// Simuliert Login im nächsten Monat
window.testCreditNextMonth = function() {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextKey = mk(nextMonth.getFullYear(), nextMonth.getMonth());
  
  // Temporär: setze lastCredited so als ob wir im nächsten Monat sind
  const origM = M, origY = Y;
  M = nextMonth.getMonth();
  Y = nextMonth.getFullYear();
  
  applyCreditedMonths();
  
  M = origM; Y = origY;
  syncG(); rGoals();
  if (window.cloudSave) cloudSave();
  
  const credited = S.goals.map(g => g.name + ': ' + fmt(getCurrent(g, nextKey))).join(', ');
  toast('✓ Mai-Gutschrift: ' + credited);
};

// ── Welcome Popup ──
window.closeWelcome = function() {
  const el = document.getElementById('welcome-overlay');
  if (el) {
    el.style.opacity = '0';
    el.style.transition = 'opacity .2s';
    setTimeout(() => el.classList.add('hidden'), 200);
  }
  localStorage.setItem('phinance-welcomed', '1');
};

// Show welcome on first visit
(function() {
  if (localStorage.getItem('phinance-welcomed') !== '1') {
    // Show after short delay so app loads first
    setTimeout(function() {
      const el = document.getElementById('welcome-overlay');
      if (el) el.classList.remove('hidden');
    }, 800);
  } else {
    // Already seen — hide immediately
    window.addEventListener('DOMContentLoaded', function() {
      const el = document.getElementById('welcome-overlay');
      if (el) el.classList.add('hidden');
    });
  }
})();
