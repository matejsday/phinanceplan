// ━━━ CALC.JS — Berechnungsfunktionen ━━━
// Abhängig von: data.js

// ── Einnahmen ──

// Einnahmen für einen bestimmten Monat
function getInc(y, m) {
  y = (y !== undefined) ? y : Y;
  m = (m !== undefined) ? m : M;
  const curKey = mk(y, m);
  return S.incomeFixed.filter(e => {
    // Hat spezifischen Wert für diesen Monat → anzeigen
    if (e.amounts[curKey] !== undefined) return true;
    // Ist fix UND hat fixed-Wert → für alle Monate anzeigen
    if (e.fix && e.amounts.fixed !== undefined && e.amounts.fixed !== null) return true;
    // Nicht fix, kein spezifischer Monat, aber hat fixed → nur anzeigen wenn gerade hinzugefügt
    // (damit neue Einnahmen vor dem ersten Fix-Click sichtbar bleiben)
    if (!e.fix && e.amounts.fixed !== undefined && e.amounts.fixed !== null) return true;
    return false;
  });
}

// Summen
const tInc  = () => getInc().reduce((s, e) => s + getAmtFor(e, mk()), 0);
const tExp  = () => allE().reduce((s, e) => s + gA(e), 0);
const tFix  = () => allE().filter(e => e.fix && e.tag !== 'sparen').reduce((s, e) => s + gA(e), 0);
const tSav  = () => allE().filter(e => e.tag === 'sparen').reduce((s, e) => s + gA(e), 0);

// ── Jahreswerte ──

function yearIncomeTotal() {
  let t = 0;
  for (let mi = 0; mi < 12; mi++) {
    getInc(Y, mi).forEach(e => { t += getAmtFor(e, mk(Y, mi)); });
  }
  return t;
}

function yearTotalForEntry(e) {
  let t = 0;
  for (let mi = 0; mi < 12; mi++) {
    const key = mk(Y, mi);
    // createdAt: Monate vor Erstellung überspringen
    if (e.createdAt && key < e.createdAt) continue;
    // deletedFrom: Monate ab Löschung überspringen
    if (e.deletedFrom && key >= e.deletedFrom) continue;
    const specific = e.amounts[key];
    if (specific !== undefined && specific !== null) {
      t += specific;
    } else if (e.fix || e.tag) {
      t += e.amounts.fixed !== undefined && e.amounts.fixed !== null ? e.amounts.fixed : 0;
    }
  }
  return t;
}

// ── Sparziele ──

// Verknüpft Sparziele mit gleichnamigen Sparen-Einträgen (bidirektional)
function syncG() {
  // Für jeden Sparen-Eintrag mit Name: Sparziel erstellen/verknüpfen
  allE().filter(e => e.tag === 'sparen' && e.name && e.name.trim()).forEach(e => {
    const existing = S.goals.find(g =>
      g.name && g.name.toLowerCase().trim() === e.name.toLowerCase().trim()
    );
    if (!existing) {
      S.goals.push({
        id: nid++, name: e.name, target: 0, current: 0,
        currentAmounts: {fixed: 0},
        amounts: e.amounts
      });
    } else {
      existing.amounts = e.amounts;
      if (!existing.currentAmounts) existing.currentAmounts = {fixed: existing.current || 0};
    }
  });
  S.goals = S.goals.filter(g =>
    !g.name || !g.name.trim() ||  // neu erstellt (leer) → behalten
    allE().some(e =>
      e.tag === 'sparen' && e.name && g.name &&
      e.name.toLowerCase().trim() === g.name.toLowerCase().trim()
    )
  );
}

// Erreichungsdatum berechnen
function reachDate2(g, monthly) {
  if (!g.target || g.current >= g.target || !monthly || monthly <= 0) return null;
  const d = new Date();
  d.setMonth(d.getMonth() + Math.ceil((g.target - g.current) / monthly));
  return d;
}

// creditMonth: wird beim Monatswechsel aufgerufen (Legacy - optional)
// creditMonth removed


// ── Monatliche Gutschrift ──
// Prüft beim Login ob Monate seit lastCredited vergangen sind
// und addiert die jeweilige Rate zu currentAmounts
function applyCreditedMonths() {
  const now = new Date();
  const todayKey = mk(now.getFullYear(), now.getMonth());

  S.goals.forEach(g => {
    if (!g.currentAmounts) g.currentAmounts = {fixed: g.current || 0};
    if (!g.lastCredited) {
      // Erstes Mal: setze lastCredited auf letzten Monat
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      g.lastCredited = mk(lastMonth.getFullYear(), lastMonth.getMonth());
      return;
    }

    // Alle Monate von lastCredited+1 bis heute (exklusiv)
    const [ly, lm] = g.lastCredited.split('-').map(Number);
    let cy = ly, cm = lm;

    while (true) {
      // Nächsten Monat berechnen
      cm++;
      if (cm > 12) { cm = 1; cy++; }
      const key = mk(cy, cm - 1);
      if (key >= todayKey) break; // Aktuellen Monat noch nicht gutschreiben

      // Rate für diesen Monat
      const rate = getAmtFor({amounts: g.amounts || {}}, key);
      // Vorheriger Stand
      const prevKey = mk(ly === cy && lm === cm - 1 ? ly : cy, cm - 2 < 0 ? 11 : cm - 2);
      const prev = getCurrent(g, g.lastCredited);
      // Neuer Stand
      g.currentAmounts[key] = prev + rate;
      // Sync g.current für Kompatibilität
      g.current = g.currentAmounts[key];
      g.lastCredited = key;
    }
  });
}
