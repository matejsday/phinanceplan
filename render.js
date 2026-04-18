// ━━━ RENDER.JS — Render-Funktionen ━━━
// Abhängig von: data.js, calc.js, actions.js

// ── Haupt-Render ──
function rAll() {
  const lbl = `${MN[M]} ${Y}`;
  const mlbl = document.getElementById('mlbl');
  const mlbl2 = document.getElementById('mlbl2');
  if (mlbl) mlbl.textContent = lbl;
  if (mlbl2) mlbl2.textContent = lbl;
  // Subtiler Monat-Indikator
  const now = new Date();
  const isCurrent = M === now.getMonth() && Y === now.getFullYear();
  const monthNav = document.querySelector('.month-nav');
  if (monthNav) {
    monthNav.classList.toggle('past-month', !isCurrent && (Y < now.getFullYear() || (Y === now.getFullYear() && M < now.getMonth())));
    monthNav.classList.toggle('future-month', !isCurrent && (Y > now.getFullYear() || (Y === now.getFullYear() && M > now.getMonth())));
  }
  rBudget();
  rGoals();
  rOpt();
  rYear();
}

function rBudget() { rInc(); rExp(); rSum(); rBudgetBar(); }

function rBudgetBar() {
  const inc = tInc(), exp = tExp();
  const bar = document.getElementById('budget-progress-bar');
  const lbl = document.getElementById('budget-progress-lbl');
  const row = document.getElementById('budget-bar-row');
  if (!bar) return;
  if (!inc) { if (row) row.style.display = 'none'; return; }
  if (row) row.style.display = '';
  const pct = Math.min(100, Math.round(exp/inc*100));
  bar.style.width = pct + '%';
  bar.style.background = pct > 100 ? 'var(--ember)' : pct > 80 ? 'var(--sand)' : 'var(--sage)';
  if (lbl) lbl.textContent = pct + '%  VERPLANT  ·  ' + fmt(exp) + '  VON  ' + fmt(inc);
}

function rSum() {
  const i = tInc(), e = tExp(), f = tFix(), b = i - e;
  const si = document.getElementById('si');
  const sf = document.getElementById('sf');
  const se = document.getElementById('se');
  const sb = document.getElementById('sb');
  if (si) si.textContent = fmt(i);
  if (sf) sf.textContent = fmt(f);
  if (se) se.textContent = fmt(e);
  if (sb) { sb.textContent = fmt(b); sb.style.color = b >= 0 ? '#4d7d64' : '#c96b4a'; }
  // Budget-Warnung
  const warn = document.getElementById('budget-warn');
  if (warn) { warn.classList.toggle('show', b < 0); warn.textContent = '⚠ Ausgaben übersteigen Einnahmen um ' + fmt(Math.abs(b)); }
}

// ── Einnahmen ──
function rInc() {
  const list = document.getElementById('il');
  const ents = getInc();
  if (!list) return;
  if (!ents.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💶</div><div class="empty-state-title">Keine Einnahmen eingetragen</div><div class="empty-state-sub">Klicke auf "+ Hinzufügen"<br>um deine erste Einnahme einzutragen</div></div>';
    return;
  }
  list.innerHTML = '<div>' + ents.map(function(e) {
    const amt = getAmtFor(e, mk());
    return '<div class="irow' + (e.fix ? ' fix-inc' : '') + '">' +
      '<input class="en" type="text" value="' + (e.name||'').replace(/"/g,'&quot;') + '" placeholder="Bezeichnung" data-change="uIN|' + e.id + '">' +
      '<div class="aw"><button class="ea-btn' + (!amt ? ' empty' : '') + '" data-popup="inc|null|' + e.id + '|' + (e.name||'').replace(/'/g,'') + '">' + (amt||'0') + '</button><span class="eu">€</span></div>' +
      '<button class="tag-btn' + (e.fix ? ' active-fix' : '') + '" data-fix-inc="' + e.id + '">#fix</button>' +
      '<button class="brm" data-rmv="inc|null|' + e.id + '">×</button>' +
    '</div>';
  }).join('') + '</div>';
}

// ── Ausgaben ──
function eHTML(cid, e, catName) {
  const amt = gA(e);
  const cs = cid === null ? 'null' : String(cid);
  // Auto-tag für Sparen-Kategorie
  if (catName && catName.toLowerCase().includes('sparen') && e.tag !== 'sparen') {
    e.tag = 'sparen'; e.fix = false;
  }
  const tag = e.tag || (e.fix ? 'fix' : null);
  const tagLabel = tag ? ('#' + tag) : '#tag';
  const tagClass = tag ? ('active-' + tag) : '';
  const rowClass = tag === 'lifestyle' ? ' tag-lifestyle' : tag === 'sparen' ? ' tag-sparen' : tag === 'fix' ? ' fix-exp' : '';

  var hasNote = !!(e.note && e.note.trim());
  return '<div class="erow' + rowClass + '" draggable="true" data-drag-eid="' + e.id + '" data-drag-ecid="' + cs + '">' +
    '<span class="drag-handle" style="cursor:grab;color:var(--ink3);opacity:.3;font-size:11px">⠿</span>' +
    '<input class="en" type="text" value="' + (e.name||'').replace(/"/g,'&quot;') + '" placeholder="Bezeichnung" data-change="uEN|' + cs + '|' + e.id + '">' +
    '<div class="aw"><button class="ea-btn' + (!amt ? ' empty' : '') + '" data-popup="exp|' + cs + '|' + e.id + '|' + (e.name||'').replace(/'/g,'') + '">' + (amt||'0') + '</button><span class="eu">€</span></div>' +
    '<div class="tag-wrap"><button class="tag-btn ' + tagClass + '" data-tagmenu="' + cs + '|' + e.id + '">' + tagLabel + '</button>' +
    '<div class="tag-dropdown" id="td-' + cs + '-' + e.id + '">' +
    '<div class="tag-opt" data-settag="' + cs + '|' + e.id + '|fix"><span class="dot" style="background:var(--mauve)"></span>#fix</div>' +
    '<div class="tag-opt" data-settag="' + cs + '|' + e.id + '|lifestyle"><span class="dot" style="background:#c4a882"></span>#lifestyle</div>' +
    '<div class="tag-opt" data-settag="' + cs + '|' + e.id + '|sparen"><span class="dot" style="background:var(--sage)"></span>#sparen</div>' +
    '<div class="tag-opt" data-settag="' + cs + '|' + e.id + '|none"><span class="dot" style="background:rgba(0,0,0,.15)"></span>kein Tag</div>' +
    '</div></div>' +
    '<button class="note-btn' + (hasNote ? ' has-note' : '') + '" data-note="' + cs + '|' + e.id + '" title="Notiz">✎</button>' +
    '<button class="brm" data-rmv="exp|' + cs + '|' + e.id + '">×</button>' +
  '</div>' +
  '<div class="note-wrap' + (hasNote ? ' open' : '') + '" id="nw-' + cs + '-' + e.id + '">' +
    '<input class="note-inp" type="text" placeholder="Notiz..." value="' + (e.note||'').replace(/"/g,'&quot;') + '" data-note-change="' + cs + '|' + e.id + '">' +
  '</div>';
}

function rExp() {
  const el = document.getElementById('el');
  if (!el) return;
  let h = '';
  S.cats.forEach(c => {
    const tot = c.entries.reduce((s, e) => s + gA(e), 0);
    const ents = c.entries.filter(e => {
      // Verstecken wenn deletedFrom <= aktueller Monat
      if (e.deletedFrom && mk() >= e.deletedFrom) return false;
      // Kein Tag, kein fix → variabel: nur anzeigen wenn Betrag > 0 ODER neu/leer
      if (!e.tag && !e.fix) {
        const amt = gA(e);
        const hasAnyAmount = e.amounts && Object.keys(e.amounts).some(k => e.amounts[k] > 0);
        return amt > 0 || !hasAnyAmount;
      }
      return true;
    }).map(e => eHTML(c.id, e, c.name)).join('');
    // Schnelleingabe
    const qInps = c.entries.map(e =>
      '<div class="cq-row"><span class="cq-lbl">' + (e.name||'—') + '</span>' +
      '<input class="cat-quick-inp fi" type="number" placeholder="0" value="' + (gA(e)||'') + '" data-eid="' + e.id + '"></div>'
    ).join('');
    h += '<div class="cat-block" data-drag-cat="' + c.id + '" draggable="true">' +
      '<div class="cat-quick" id="cq-' + c.id + '">' +
        '<div style="font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink3);margin-bottom:10px">Schnelleingabe — alle Monate</div>' +
        qInps +
        '<button class="cat-save-btn" data-action-savecatquick="' + c.id + '">✓ Alle Monate speichern</button>' +
      '</div>' +
      '<div class="cat-hdr" data-action-cat="' + c.id + '">' +
        '<span class="drag-handle cat-drag" data-drag-cat-handle="' + c.id + '">⠿</span>' +
        '<span class="cat-toggle" id="ct-' + c.id + '">▾</span>' +
        '<input class="cat-name en" type="text" value="' + (c.name||'').replace(/"/g,'&quot;') + '" placeholder="Neue Kategorie" data-change="uCN|' + c.id + '">' +
        '<span class="cat-total" id="ctot-' + c.id + '" data-action-catquick="' + c.id + '">' + fmt(tot) + '</span>' +
        '<button class="bcrm" data-rmv-cat="' + c.id + '">×</button>' +
      '</div>' +
      '<div class="cat-body open" id="cb-' + c.id + '">' +
        ents +
        '<button class="add-entry-btn" data-action-aec="' + c.id + '" style="display:flex;align-items:center;justify-content:center;gap:6px;width:calc(100% - 32px);margin:8px 16px 12px;padding:9px 0;background:none;border:1.5px dashed rgba(107,158,130,.4);border-radius:8px;font-family:var(--mono);font-size:11px;letter-spacing:.08em;color:var(--sage);cursor:pointer;">＋ Zeile</button>' +
      '</div>' +
    '</div>';
  });
  if (S.unc.length) h += '<div>' + S.unc.map(e => eHTML(null, e, '')).join('') + '</div>';
  if (!h) h = '<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-title">Keine Ausgaben eingetragen</div><div class="empty-state-sub">Klicke auf "+ Kategorie" um<br>deine erste Ausgabe einzutragen</div></div>';
  el.innerHTML = h;
}

// ── Sparziele ──
function rGoals() {
  const sav = tSav();
  const gav = document.getElementById('gav');
  const gtr = document.getElementById('gtr');
  const gcu = document.getElementById('gcu');
  const gmo = document.getElementById('gmo');
  if (gav) gav.textContent = fmt(Math.max(0, tInc()-tExp()));
  if (gtr) gtr.textContent = fmt(S.goals.reduce((s,g) => s+g.target, 0));
  if (gcu) gcu.textContent = fmt(S.goals.reduce((s,g) => s+g.current, 0));
  if (gmo) gmo.textContent = fmt(sav);
  syncG();

  const grid = document.getElementById('gg');
  if (!grid) return;
  if (!S.goals.length) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎯</div><div class="empty-state-title">Keine Sparziele vorhanden</div><div class="empty-state-sub">Füge einen Eintrag mit #sparen Tag<br>in deinen Ausgaben hinzu</div></div>';
    return;
  }

  grid.innerHTML = S.goals.map(function(g, i) {
    const monthly = getAmtFor({amounts: g.amounts||{}}, mk());
    const realNow = new Date();
    const realKey = mk(realNow.getFullYear(), realNow.getMonth());
    const viewKey = mk(); // aktuell angeschauter Monat
    let currentSaved;
    if (viewKey <= realKey) {
      // Vergangenheit oder aktueller Monat: echten Wert zeigen
      currentSaved = getCurrent(g, viewKey);
    } else {
      // Zukunft: simulieren
      const baseVal = getCurrent(g, realKey);
      // Monate zwischen realKey und viewKey
      const [ry, rm] = realKey.split('-').map(Number);
      const [vy, vm] = viewKey.split('-').map(Number);
      const monthsAhead = (vy - ry) * 12 + (vm - rm);
      let simVal = baseVal;
      for (let i = 1; i <= monthsAhead; i++) {
        const simDate = new Date(ry, rm - 1 + i, 1);
        const simKey = mk(simDate.getFullYear(), simDate.getMonth());
        simVal += getAmtFor({amounts: g.amounts || {}}, simKey);
      }
      currentSaved = Math.min(simVal, g.target || Infinity);
    }
    const pct = g.target > 0 ? Math.min(100, Math.round(currentSaved/g.target*100)) : 0;
    const col = CL[i % CL.length];
    const rd  = reachDate2(g, monthly);
    const done = g.current >= g.target && g.target > 0;

    const reachStr = done ? '✓ erreicht' : rd ? fmtDate(rd) : '—';
    const reachColor = done ? 'var(--sage2)' : '#6aab8e';
    return '<div class="gc" draggable="true" data-drag-goal="' + g.id + '">' +
      '<div class="gc-inner">' +

      '<div class="gc-header" style="margin-bottom:2px">' +
        '<span class="drag-handle" style="cursor:grab;color:var(--sage);opacity:.5;font-size:12px;margin-right:6px;flex-shrink:0;padding-top:2px">⠿</span>' +
        '<input class="gni" type="text" value="' + (g.name||'').replace(/"/g,'&quot;') + '" placeholder="Zielname" data-change-goal="' + g.id + '|name">' +
        '<button class="brmg" data-action="rG" data-id="' + g.id + '" style="opacity:.3;font-size:13px;line-height:1;flex-shrink:0">×</button>' +
      '</div>' +
      (rd || done ? '<div style="font-family:var(--sans);font-size:11px;font-weight:500;color:' + reachColor + ';margin-bottom:8px;letter-spacing:.01em">' + (done ? '✓ Ziel erreicht' : 'accomplished by ' + reachStr) + '</div>' : '<div style="margin-bottom:8px"></div>') +

      '<div class="gc-prog" style="margin:0 0 10px">' +
        '<div class="gprogtrack" style="height:5px"><div class="gprogfill" style="height:5px;width:' + pct + '%;background:' + col + '"></div></div>' +
        '<div style="display:flex;justify-content:space-between;margin-top:4px">' +
          '<span style="font-family:var(--mono);font-size:9px;color:var(--ink3)">' + fmt(currentSaved) + ' gespart</span>' +
          '<span style="font-family:var(--mono);font-size:9px;color:var(--ink3)">' + pct + '%</span>' +
        '</div>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">' +
        '<div><div style="font-family:var(--mono);font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3);margin-bottom:4px">Zielbetrag</div>' +
          '<div style="display:flex;align-items:center;gap:3px">' +
            '<input class="fi" type="number" value="' + (g.target||'') + '" placeholder="0" data-change-goal="' + g.id + '|target" style="font-size:15px">' +
            '<span style="font-family:var(--mono);font-size:10px;color:var(--ink3)">€</span>' +
          '</div>' +
        '</div>' +
        '<div><div style="font-family:var(--mono);font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3);margin-bottom:4px">Gespart</div>' +
          '<div style="display:flex;align-items:center;gap:3px">' +
            '<input class="fi" type="number" value="' + (Math.round(currentSaved)||'') + '" placeholder="0" data-change-goal="' + g.id + '|current" style="font-size:15px">' +
            '<span style="font-family:var(--mono);font-size:10px;color:var(--ink3)">€</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:rgba(107,158,130,.06);border-radius:8px;margin-bottom:8px">' +
        '<span style="font-family:var(--mono);font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:var(--sage2)">Rate / Mo</span>' +
        '<div style="display:flex;align-items:center;gap:4px">' +
          '<button class="ea-btn' + (!monthly ? ' empty' : '') + '" data-popup="goal|null|' + g.id + '|' + (g.name||'').replace(/'/g,'') + '" style="font-size:15px;font-weight:600;min-width:40px">' + (monthly||'0') + '</button>' +
          '<span style="font-family:var(--mono);font-size:10px;color:var(--ink3)">€</span>' +
        '</div>' +
      '</div>' +

      '<div class="goal-sim" style="padding:8px 10px">' +
        '<div style="font-family:var(--mono);font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:var(--mauve);opacity:.6;margin-bottom:6px">Erreichungsrechner</div>' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<input class="goal-sim-inp fi" type="number" placeholder="Rate €/Mo" data-sim="' + g.id + '" style="flex:1;font-size:13px">' +
          '<span style="font-family:var(--mono);font-size:10px;color:var(--ink3)">→</span>' +
          '<span class="goal-sim-result" id="gsim-' + g.id + '" style="font-family:var(--mono);font-size:11px;color:var(--sage2);white-space:nowrap">—</span>' +
        '</div>' +
      '</div>' +

      '</div>' +
    '</div>';
  }).join('');
}

// ── Optimierung ──
function rOpt() {
  render503020();
  const inc = tInc(), fix = tFix(), exp = tExp(), sav = tSav();
  const varExp = exp - fix;
  const afterFix = inc - fix, afterAll = inc - exp;
  const fixPct = inc > 0 ? Math.round(fix/inc*100) : 0;
  const varPct = inc > 0 ? Math.round(varExp/inc*100) : 0;
  const savPct = inc > 0 ? Math.round(sav/inc*100) : 0;


  // Sparpotenzial = was übrig bleibt nach ALLEN Ausgaben inkl. Sparen
  const potential = Math.max(0, afterAll);
  const potPct = inc > 0 ? Math.round(potential/inc*100) : 0;
  const isGood = potential > 0;

  const h = '<div class="sparcard' + (isGood ? ' sparcard-good' : ' sparcard-warn') + '">' +
    '<div class="sparcard-eyebrow">Sparpotenzial ' + MN[M] + '</div>' +
    '<div class="sparcard-amount">' + fmt(potential) + '</div>' +
    '<div class="sparcard-sub">' +
      (isGood
        ? 'Das sind ' + potPct + '% deines Einkommens, wenn du dich am Riemen reißt.'
        : 'Ausgaben übersteigen Einnahmen um ' + fmt(Math.abs(afterAll)) + '.') +
    '</div>' +
  '</div>' +
    '<div class="bar-panel" style="margin-top:16px">' +
    // Fixkosten bar
    '<div class="bar-row bar-collapsible" data-bar-tag="fix">' +
      '<div class="bar-info"><div class="bar-lbl">#fix</div><div class="bar-sub">' + fixPct + '%</div></div>' +
      '<div class="bar-track"><div class="bar-fill" style="width:' + fixPct + '%;background:var(--mauve)"></div></div>' +
      '<div class="bar-pct">' + fmt(fix) + '</div>' +
    '</div>' +
    '<div class="bar-detail" id="bar-detail-fix">' +
      allE().filter(e=>e.fix||e.tag==='fix').map(e=>'<div class="bar-detail-row"><span>' + (e.name||'—') + '</span><span>' + fmt(gA(e)) + '</span></div>').join('') +
    '</div>' +
    // Lifestyle bar
    '<div class="bar-row bar-collapsible" data-bar-tag="lifestyle">' +
      '<div class="bar-info"><div class="bar-lbl">#lifestyle</div><div class="bar-sub">' + varPct + '%</div></div>' +
      '<div class="bar-track"><div class="bar-fill" style="width:' + varPct + '%;background:#8aaed4"></div></div>' +
      '<div class="bar-pct">' + fmt(varExp) + '</div>' +
    '</div>' +
    '<div class="bar-detail" id="bar-detail-lifestyle">' +
      allE().filter(e=>e.tag==='lifestyle').map(e=>'<div class="bar-detail-row"><span>' + (e.name||'—') + '</span><span>' + fmt(gA(e)) + '</span></div>').join('') +
    '</div>' +
    // Sparen bar
    '<div class="bar-row bar-collapsible" data-bar-tag="sparen">' +
      '<div class="bar-info"><div class="bar-lbl">#sparen</div><div class="bar-sub">' + savPct + '%</div></div>' +
      '<div class="bar-track"><div class="bar-fill" style="width:' + savPct + '%;background:var(--sage)"></div></div>' +
      '<div class="bar-pct">' + fmt(sav) + '</div>' +
    '</div>' +
    '<div class="bar-detail" id="bar-detail-sparen">' +
      allE().filter(e=>e.tag==='sparen').map(e=>'<div class="bar-detail-row"><span>' + (e.name||'—') + '</span><span>' + fmt(gA(e)) + '</span></div>').join('') +
    '</div>' +
    '</div>';

  const oc = document.getElementById('opt-content');
  if (oc) oc.innerHTML = h;
}

function render503020() {
  const inc = tInc(), fix = tFix(), sav = tSav(), varExp = tExp() - fix;
  const el = document.getElementById('rule-503020');
  if (!el) return;
  if (inc <= 0) {
    el.innerHTML = '<div class="rule-card"><div style="font-size:12px;color:var(--ink3);text-align:center;padding:8px 0">Trage dein Gehalt unter Einnahmen ein.</div></div>';
    return;
  }
  // Use S.pct for custom percentages
  const p = (S.pct && S.pct.fix) ? S.pct : {fix:50, lifestyle:30, save:20};
  const t50 = Math.round(inc*p.fix/100);
  const t30 = Math.round(inc*p.lifestyle/100);
  const t20 = Math.round(inc*p.save/100);

  function mkCard(pct, color, label, amt, target, field) {
    const ok = label === 'Sparen' ? amt >= target : amt <= target;
    const tagLabel = label === 'Sparen' ? 'Zielwert' : 'Maximum';
    return '<div class="rule-card">' +
      '<div class="rule-title"><span class="rule-badge" style="background:' + color + ';font-size:10px;padding:3px 10px;cursor:pointer" data-edit-rule="' + field + '">' + pct + '%</span>' + label + '</div>' +
      '<div class="rule-row">' +
        '<div class="rule-target-box">' +
          '<span class="rule-target-amt">' + fmt(target) + '</span>' +
          '<span class="rule-target-tag">' + tagLabel + '</span>' +
        '</div>' +
        '<div style="text-align:right">' +
          '<div class="rule-actual ' + (ok?'ok':'warn') + '">' + fmt(amt) + ' ' + (ok?'✓':'↑') + '</div>' +
          '<div style="font-family:var(--mono);font-size:10px;color:var(--ink3)">' + Math.round(amt/inc*100) + '% deines Einkommens</div>' +
        '</div>' +
      '</div></div>';
  }
  el.innerHTML = mkCard(p.fix,'#8b6fa0','Fixkosten',fix,t50,'fix') +
                 mkCard(p.lifestyle,'#c4a882','Lifestyle',varExp,t30,'lifestyle') +
                 mkCard(p.save,'#6b9e82','Sparen',sav,t20,'save');
}

// ── Jahresübersicht ──
function rYear() {
  const incY = yearIncomeTotal();
  const expY = allE().reduce((s,e) => s + yearTotalForEntry(e), 0);
  const savY = allE().filter(e => e.tag==='sparen').reduce((s,e) => s + yearTotalForEntry(e), 0);
  const bal  = incY - expY;

  // ── Monatsvergleich (full-width hero) ──
  const monthlyData = Array.from({length:12}, (_,mi) => {
    const key = mk(Y, mi);
    let exp = 0, inc = 0;
    allE().forEach(e => {
      if (e.createdAt && key < e.createdAt) return;
      if (e.deletedFrom && key >= e.deletedFrom) return;
      exp += e.amounts[key] !== undefined ? e.amounts[key] : ((e.fix||e.tag) ? (e.amounts.fixed||0) : 0);
    });
    getInc(Y, mi).forEach(e => { inc += getAmtFor(e, key); });
    return {name: MN[mi], exp, inc};
  });
  const maxAll = Math.max(...monthlyData.map(d => Math.max(d.exp, d.inc)), 1);
  const now = new Date();

  let h = '<div class="year-wrap">';

  // Section 1: Monatsvergleich — full width
  h += '<div class="year-section year-section-chart">';
  h += '<div class="year-section-title">Monatsvergleich <span>' + Y + '</span></div>';
  h += '<div class="month-compare-grid">';
  monthlyData.forEach((d, i) => {
    const barPct  = Math.round(d.exp / maxAll * 100);
    const incPct  = Math.round(d.inc / maxAll * 100);
    const isCur   = i === now.getMonth() && Y === now.getFullYear();
    const isPast  = Y < now.getFullYear() || (Y === now.getFullYear() && i < now.getMonth());
    const isOver  = d.exp > d.inc && d.inc > 0;
    const hasDat  = d.exp > 0 || d.inc > 0;
    const barCol  = isOver ? 'var(--ember)' : isPast ? 'var(--sage2)' : 'var(--sage)';
    const opacity = hasDat ? (isCur ? '1' : '.55') : '.2';
    h += '<div class="mc' + (isCur ? ' mc-cur' : '') + (isOver ? ' mc-over' : '') + '">' +
      '<div class="mc-amt">' + (hasDat ? fmt(d.exp).replace('€ ','') : '') + '</div>' +
      '<div class="mc-track">' +
        '<div class="mc-fill" style="height:' + barPct + '%;background:' + barCol + ';opacity:' + opacity + '"></div>' +
        (d.inc > 0 ? '<div class="mc-inc-line" style="bottom:' + incPct + '%"></div>' : '') +
      '</div>' +
      '<div class="mc-lbl' + (isCur ? ' mc-lbl-cur' : '') + '">' + d.name.substring(0,3) + '</div>' +
    '</div>';
  });
  h += '</div></div>';

  // Section 2: Bilanz + Ausgaben side by side (wrapped in a two-col row)
  h += '<div class="year-row-2col">';

  // Left: Jahresbilanz cards
  h += '<div class="year-section year-section-bilanz">';
  h += '<div class="year-section-title">Jahresbilanz <span>' + Y + '</span></div>';
  h += '<div class="year-bilanz">';
  h += '<div class="year-bilanz-card inc"><div class="year-bilanz-lbl">Einnahmen</div><div class="year-bilanz-val">' + fmt(incY) + '</div></div>';
  h += '<div class="year-bilanz-card exp"><div class="year-bilanz-lbl">Ausgaben</div><div class="year-bilanz-val">' + fmt(expY) + '</div></div>';
  h += '<div class="year-bilanz-card bal"><div class="year-bilanz-lbl">Bilanz</div><div class="year-bilanz-val ' + (bal>=0?'pos':'neg') + '">' + fmt(bal) + '</div></div>';
  h += '</div></div>';

  // Right: Ausgaben nach Kategorie
  h += '<div class="year-section">';
  h += '<div class="year-section-title">Ausgaben nach Kategorie <span>' + fmt(expY) + '</span></div>';
  S.cats.forEach(c => {
    const cy = c.entries.reduce((s,e) => s + yearTotalForEntry(e), 0);
    if (!cy) return;
    h += '<div class="year-cat-row"><span class="year-cat-name">' + c.name + '</span><span class="year-cat-amt">' + fmt(cy) + '</span></div>';
    c.entries.forEach(e => {
      const yr = yearTotalForEntry(e);
      if (!yr) return;
      const mo = Math.round(yr/12);
      h += '<div class="year-entry-row">' +
        '<span class="year-entry-name">' + (e.name||'—') +
        (e.fix ? '<span class="badge-fix">#fix</span>' : '') +
        (e.tag && e.tag!=='fix' ? '<span class="badge-fix" style="background:rgba(107,158,130,.15);color:var(--sage2)">#' + e.tag + '</span>' : '') +
        '</span>' +
        '<span class="year-entry-amt">' + fmt(yr) + '<span class="year-entry-mo">' + fmt(mo) + '/Mo</span></span>' +
      '</div>';
    });
  });
  h += '<div class="year-total-row"><span class="year-total-lbl">Gesamt Ausgaben</span><span class="year-total-amt neg">' + fmt(expY) + '</span></div>';
  h += '</div>';
  h += '</div>'; // close year-row-2col

  // Section 3: Sparziele — full width
  if (S.goals.length) {
    h += '<div class="year-section year-section-goals">';
    h += '<div class="year-section-title">Sparziele <span>' + fmt(savY) + '/Jahr</span></div>';
    h += '<div class="year-goals-grid">';
    S.goals.forEach((g,i) => {
      const col = CL[i % CL.length];
      const pct = g.target > 0 ? Math.min(100, Math.round(getCurrent(g, mk())/g.target*100)) : 0;
      let yearly = 0;
      for (let mi=0; mi<12; mi++) yearly += getAmtFor({amounts:g.amounts||{}}, mk(Y,mi));
      h += '<div class="year-goal-card">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
          '<span style="width:8px;height:8px;border-radius:50%;background:' + col + ';flex-shrink:0;display:inline-block"></span>' +
          '<span style="font-family:var(--sans);font-size:14px;font-weight:600;color:var(--ink)">' + (g.name||'—') + '</span>' +
        '</div>' +
        '<div style="font-family:var(--mono);font-size:11px;color:var(--ink3);margin-bottom:6px">' + fmt(yearly) + '/Jahr · ' + pct + '% erreicht</div>' +
        '<div style="height:4px;background:rgba(0,0,0,.07);border-radius:2px;overflow:hidden">' +
          '<div style="height:100%;width:' + pct + '%;background:' + col + ';border-radius:2px;transition:width .4s"></div>' +
        '</div>' +
      '</div>';
    });
    h += '</div></div>';
  }

  h += '</div>'; // close year-wrap
  const jc = document.getElementById('jc');
  if (jc) jc.innerHTML = h;
}
