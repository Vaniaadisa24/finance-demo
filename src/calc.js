// Perhitungan kekayaan terpusat (model bersih) — dipakai Total, Roadmap, Simulasi
// supaya semua halaman konsisten.
//
// Model modal (disepakati): modal = SALDO BULAN TERAKHIR aktivitas (bukan Σ semua bulan),
// yang sudah termasuk carry + akumulasi dividen. Total portofolio saham = modal + nilai
// saham sekarang. TIDAK ada field `dividen` terpisah (dividen sudah masuk di modal activity).
import { parseNum } from "./lib.js";

// Saldo modal satu bulan dari daftar activity: Income* menambah, Expenses Buy mengurangi.
export function monthModalSaldo(entries) {
  return (entries || []).reduce((s, e) => s + (e.tipe === "Expenses Buy" ? -1 : 1) * parseNum(e.totalAmount || e.amount || 0), 0);
}

// Modal terkini = saldo bulan (aktivitas) TERAKHIR yang ada isinya.
export function latestModal(activityMap) {
  const months = Object.keys(activityMap || {}).filter(k => (activityMap[k] || []).length).sort();
  if (!months.length) return 0;
  return monthModalSaldo(activityMap[months[months.length - 1]]);
}

// Saldo running dari bulan terakhir SEBELUM mk (untuk auto-carry). null = tak ada bulan sebelumnya.
export function runningModalBefore(activityMap, mk) {
  const months = Object.keys(activityMap || {}).filter(k => k < mk && (activityMap[k] || []).length).sort();
  if (!months.length) return null;
  return monthModalSaldo(activityMap[months[months.length - 1]]);
}

// Daftar emiten dari snapshot TERAKHIR (fallback ke master list).
export function latestSnapList(portfolio, pKey) {
  const snap = portfolio[pKey + "_snap"] || {};
  const keys = Object.keys(snap).sort();
  return keys.length ? (snap[keys[keys.length - 1]] || []) : (portfolio[pKey] || []);
}

// Nilai saham sekarang (lot*100*currentPrice) dari snapshot terakhir.
export function latestHoldings(portfolio, pKey) {
  return latestSnapList(portfolio, pKey).reduce((t, r) => t + parseNum(r.lot) * 100 * parseNum(r.currentPrice), 0);
}

// Total portofolio saham terkoreksi = modal terakhir + nilai saham sekarang (TANPA field dividen).
export function sahamTotal(portfolio, pKey) {
  return latestModal(portfolio[pKey + "_activity"]) + latestHoldings(portfolio, pKey);
}

// Nilai emas terkini dari snapshot aggregate terakhir (fallback ke entries).
export function emasTotal(portfolio, pKey) {
  const snap = portfolio[pKey + "_snap"] || {};
  const keys = Object.keys(snap).sort();
  if (keys.length) {
    const latest = snap[keys[keys.length - 1]];
    if (latest?.aggregate) return parseNum(latest.aggregate.gram) * parseNum(latest.aggregate.hargaJual);
    if (latest?.entries) return latest.entries.reduce((s, e) => s + parseNum(e.gram) * parseNum(e.hargaJual), 0);
  }
  return (portfolio[pKey]?.entries || []).reduce((s, e) => s + parseNum(e.gram) * parseNum(e.hargaJual), 0);
}
