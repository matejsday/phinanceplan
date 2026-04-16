// ━━━ DATA.JS — Datenstruktur, Konstanten, Basis-Helpers ━━━

const MN = ['Jänner','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const CL = ['#6b9e82','#8b6fa0','#c4a882','#5a8fa8','#c96b4a','#7a9e6b','#a08660','#8a6b9e'];

let Y = new Date().getFullYear();
let M = new Date().getMonth();
let nid = 1;

const uid = () => nid++;
const mk  = (y=Y, m=M) => `${y}-${String(m+1).padStart(2,'0')}`;
const fmt  = n => '€ ' + Math.round(n||0).toLocaleString('de-AT');
const fmtDate = d => `${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;

// ── Datenstruktur ──
let S = {
  incomeFixed: [
    {id:uid(), name:'Gehalt (netto)', amounts:{fixed:2800}, fix:true}
  ],
  cats: [
    {id:uid(), name:'Wohnen', entries:[
      {id:uid(), name:'Miete',        fix:true,  amounts:{fixed:800}},
      {id:uid(), name:'Nebenkosten',  fix:true,  amounts:{fixed:120}}
    ]},
    {id:uid(), name:'Energie', entries:[
      {id:uid(), name:'Strom', fix:true, amounts:{fixed:60}},
      {id:uid(), name:'Gas',   fix:true, amounts:{fixed:80}}
    ]},
    {id:uid(), name:'Internet & Telefonie', entries:[
      {id:uid(), name:'Internet', fix:true, amounts:{fixed:40}},
      {id:uid(), name:'Handy',    fix:true, amounts:{fixed:25}}
    ]},
    {id:uid(), name:'Lebensmittel', entries:[
      {id:uid(), name:'Supermarkt', fix:false, amounts:{}}
    ]},
    {id:uid(), name:'Sparen', entries:[
      {id:uid(), name:'Notgroschen', fix:false, tag:'sparen', amounts:{fixed:300}},
      {id:uid(), name:'Urlaub',      fix:false, tag:'sparen', amounts:{fixed:150}}
    ]}
  ],
  unc: [],
  goals: [
    {id:uid(), name:'Notgroschen', target:8400, current:2000, currentAmounts:{fixed:2000}, amounts:{}},
    {id:uid(), name:'Urlaub',      target:1500, current:300,  currentAmounts:{fixed:300},  amounts:{}}
  ],
  pct: {fix:50, lifestyle:30, save:20}
};

// ── Basis-Helpers ──

// Betrag für einen Eintrag im gegebenen Monat
// Prüft zuerst spezifischen Monatswert, dann fixed als Default
const getAmtFor = (e, key) => {
  const v = e.amounts[key];
  return (v !== undefined && v !== null)
    ? v
    : (e.amounts.fixed !== undefined && e.amounts.fixed !== null ? e.amounts.fixed : 0);
};

// Betrag für aktuellen Monat
// Kein Tag = variabel → nur spezifischer Monatswert, kein fixed-Fallback
const gA = e => {
  if (!e.amounts) return 0;
  const specific = e.amounts[mk()];
  if (specific !== undefined && specific !== null) return specific;
  // Kein Tag und kein spezifischer Wert → 0 (variabel)
  if (!e.tag && !e.fix) return 0;
  // fix oder tag gesetzt → fixed als Fallback
  return e.amounts.fixed !== undefined && e.amounts.fixed !== null ? e.amounts.fixed : 0;
};

// Betrag setzen: all=true → fixed + alle vorhandenen Monate; all=false → nur dieser Monat
function sA(e, v, all) {
  if (all) {
    e.amounts.fixed = v;
    Object.keys(e.amounts).forEach(k => { if (k !== 'fixed') e.amounts[k] = v; });
  } else {
    e.amounts[mk()] = v;
    if (!('fixed' in e.amounts)) e.amounts.fixed = v;
  }
}

// Alle Ausgaben-Einträge (Kategorien + unkategorisiert)
const allE = () => {
  const a = [];
  S.cats.forEach(c => c.entries.forEach(e => a.push(e)));
  S.unc.forEach(e => a.push(e));
  return a;
};

// Eintrag nach cid + eid finden
const fE = (cid, eid) => {
  if (cid === null) return S.unc.find(x => x.id === eid);
  const c = S.cats.find(x => x.id === cid);
  return c ? c.entries.find(x => x.id === eid) : null;
};

// ── Migration: alte Datenstruktur → neue amounts-Struktur ──
// migrateData moved to firebase.js


// Gespart-Stand für einen Monat (letzter bekannter Wert bis zu diesem Monat)
function getCurrent(g, key) {
  const ca = g.currentAmounts || {};
  // Direkt vorhanden
  if (ca[key] !== undefined && ca[key] !== null) return ca[key];
  // Suche letzten bekannten Wert vor diesem Monat
  const keys = Object.keys(ca).filter(k => k !== 'fixed' && k <= key).sort();
  if (keys.length) return ca[keys[keys.length - 1]];
  // Fallback: fixed (Ausgangswert)
  return ca.fixed !== undefined ? ca.fixed : (g.current || 0);
}

// Setzt Gespart-Stand für einen Monat
// setCurrent removed

