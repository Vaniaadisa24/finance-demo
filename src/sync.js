// Auto-sync Daily -> tujuan (Tabungan Cash / Portofolio Saham).
// Versi baru: trigger EKSPLISIT (bukan tebak nama), tulis ke *_activity (bukan *_modal mati),
// dan bisa DI-REVERSE saat transaksi daily diedit/dihapus (via syncRef).
import { parseNum, MS } from "./lib.js";

function curMk(year, month) { return `${year}-${String(month + 1).padStart(2, "0")}`; }
function label(year, month) { return MS[month] + " " + year; }

// Buat entri sinkron di tujuan. Kembalikan { d, syncRef, syncMk }.
// syncRef = id entri yang dibuat (untuk reverse); syncMk = bulan activity (khusus saham).
export function addSyncedEntry(d, entry, year, month) {
  const mk = curMk(year, month);
  const lbl = label(year, month);
  const amt = entry.amount;
  const syncRef = Date.now() + Math.random();
  const t = entry.syncTarget;

  if (t === "cash" && entry.syncCatId) {
    const ce = [...(d.savings.cashEntries || []), { id: syncRef, catId: entry.syncCatId, type: "Income", desc: lbl, amount: amt, monthLabel: lbl, fromDaily: true }];
    return { d: { ...d, savings: { ...d.savings, cashEntries: ce } }, syncRef, syncMk: null };
  }
  if (t === "saham") {
    const act = d.portfolio.saham_activity || {};
    const monthEntries = [...(act[mk] || []), { id: syncRef, tipe: "Income Modal", amount: amt, totalAmount: parseNum(amt), desc: lbl + " (daily)", date: entry.date || "", mk, fromDaily: true }];
    return { d: { ...d, portfolio: { ...d.portfolio, saham_activity: { ...act, [mk]: monthEntries } } }, syncRef, syncMk: mk };
  }
  return { d, syncRef: null, syncMk: null };
}

// Hapus entri sinkron yang pernah dibuat oleh sebuah transaksi daily.
export function removeSyncedEntry(d, dailyEntry) {
  const ref = dailyEntry.syncRef;
  if (ref == null) return d;
  const t = dailyEntry.syncTarget;
  if (t === "cash") {
    return { ...d, savings: { ...d.savings, cashEntries: (d.savings.cashEntries || []).filter(e => e.id !== ref) } };
  }
  if (t === "saham" && dailyEntry.syncMk) {
    const act = d.portfolio.saham_activity || {};
    if (act[dailyEntry.syncMk]) {
      return { ...d, portfolio: { ...d.portfolio, saham_activity: { ...act, [dailyEntry.syncMk]: act[dailyEntry.syncMk].filter(e => e.id !== ref) } } };
    }
  }
  return d;
}

// Opsi sync yang tersedia (eksplisit, tak tergantung nama sub-jenis).
export const SYNC_OPTIONS = [
  { v: "cash", l: "Tabungan Cash" },
  { v: "saham", l: "Portofolio Saham" },
];
