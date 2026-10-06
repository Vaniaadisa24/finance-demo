// Konstanta, util angka, dan style — dipisah dari komponen agar reusable.
// Logika di sini disalin persis dari budgeting-final.jsx (tidak diubah).

export const BANKS = ["Cash", "Bank A", "Bank B", "Bank C"];
export const MN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
export const MS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
export const DEF_INC = ["Gaji", "Freelance", "Bonus", "Investasi", "Sisa Bulan Lalu"];

export function mkKey(y, m) { return `${y}-${String(m + 1).padStart(2, "0")}`; }
export function getPrevYM(y, m) { const d = new Date(y, m, 1); d.setMonth(d.getMonth() - 1); return { y: d.getFullYear(), m: d.getMonth() }; }
export function parseNum(s) { return parseFloat(String(s).replace(/\./g, "").replace(",", ".")) || 0; }
export function fmtNum(n) { if (!n && n !== 0) return "0"; return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Math.round(n * 100) / 100); }
export function fmtInp(raw) {
  if (raw === "" || raw === undefined || raw === null) return "";
  const s = String(raw);
  const hasComma = s.includes(",");
  const [intP, decP] = s.split(",");
  const digits = intP.replace(/\./g, "").replace(/\D/g, "");
  if (!digits && !hasComma) return "";
  const formatted = digits ? parseInt(digits, 10).toLocaleString("id-ID") : "0";
  if (hasComma) return formatted + "," + (decP || "").replace(/\D/g, "").slice(0, 2);
  return formatted;
}

export function calcNewAvg(oldLot, oldAvg, newLot, newPrice) {
  const total = parseNum(oldLot) + parseNum(newLot);
  if (total <= 0) return 0;
  return (parseNum(oldLot) * parseNum(oldAvg) + parseNum(newLot) * parseNum(newPrice)) / total;
}

// Generate month options from given year back 1 year and forward 1 year
export function genMonthOpts(curYear) {
  const opts = [];
  const MNL = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  for (let y = curYear - 1; y <= curYear + 1; y++) {
    for (let m = 0; m < 12; m++) {
      const k = `${y}-${String(m + 1).padStart(2, "0")}`;
      opts.push({ value: k, label: `${MNL[m]} ${y}` });
    }
  }
  return opts;
}

export const C = { navy: "#1a1a2e", gold: "#d4af37", bg: "#f5f3ef", green: "#16a34a", red: "#dc2626", blue: "#2563eb", purple: "#7c3aed", orange: "#ea580c", gray: "#6b7280", light: "#f0ede8", border: "#e5e2dc", muted: "#9ca3af" };

export const S = {
  card: { background: "#fff", borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  h3: { fontSize: 14, fontWeight: 700, color: C.navy, margin: "0 0 12px" },
  lbl: { fontSize: 11, color: C.muted, marginBottom: 3, display: "block", fontWeight: 500 },
  inp: { width: "100%", padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, fontFamily: "'DM Sans',sans-serif", background: "#fafaf8", outline: "none", boxSizing: "border-box", color: C.navy },
  inpSm: { padding: "5px 7px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, fontFamily: "'DM Sans',sans-serif", background: "#fafaf8", outline: "none", boxSizing: "border-box", color: C.navy, width: "100%" },
  sel: { padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, background: "#fafaf8", fontFamily: "'DM Sans',sans-serif", outline: "none", color: C.navy, width: "100%" },
  selSm: { padding: "5px 7px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, background: "#fafaf8", fontFamily: "'DM Sans',sans-serif", outline: "none", color: C.navy, width: "100%" },
  tbl: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "7px 10px", fontSize: 10.5, color: C.muted, fontWeight: 600, borderBottom: `2px solid ${C.light}`, textTransform: "uppercase", letterSpacing: "0.05em" },
  td: { padding: "7px 10px", fontSize: 13, borderBottom: `1px solid #f5f3ef`, verticalAlign: "middle" },
  vc: (v) => ({ color: v >= 0 ? C.green : C.red, fontWeight: 700 }),
  pill: (t) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: t === "Expenses" ? "#fee2e2" : t === "Income" ? "#dcfce7" : t === "Reimburse" ? "#fef9c3" : "#dbeafe", color: t === "Expenses" ? C.red : t === "Income" ? C.green : t === "Reimburse" ? "#854d0e" : C.blue }),
  sideItem: (a) => ({ display: "block", width: "100%", textAlign: "left", padding: "9px 20px", border: "none", cursor: "pointer", background: a ? "rgba(212,175,55,0.12)" : "transparent", color: a ? "#d4af37" : "rgba(255,255,255,0.65)", fontSize: 12.5, fontWeight: a ? 600 : 400, borderLeft: a ? "3px solid #d4af37" : "3px solid transparent", transition: "all 0.15s", fontFamily: "'DM Sans',sans-serif" }),
  btnN: { padding: "7px 14px", background: C.navy, color: "#fff", border: "none", borderRadius: 7, fontSize: 12, cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans',sans-serif" },
  btnG: { padding: "7px 14px", background: C.gold, color: C.navy, border: "none", borderRadius: 7, fontSize: 12, cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans',sans-serif" },
  btnR: { padding: "4px 8px", background: "#fee2e2", color: C.red, border: "none", borderRadius: 5, fontSize: 11, cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans',sans-serif" },
  btnGh: { padding: "4px 8px", background: C.light, color: C.navy, border: "none", borderRadius: 5, fontSize: 11, cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans',sans-serif" },
  navBtn: { background: "#fff", border: `1px solid ${C.border}`, borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontSize: 17, color: C.navy, lineHeight: 1 },
  alertBadge: (p) => ({ display: "inline-block", padding: "2px 7px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: p >= 100 ? "#fee2e2" : p >= 80 ? "#fef9c3" : "#dcfce7", color: p >= 100 ? C.red : p >= 80 ? "#854d0e" : C.green }),
};

export const NAV = [
  { id: "planning", label: "📋 Planning Budget" },
  { id: "daily", label: "📅 Daily Budgeting" },
  { id: "savings-target", label: "🎯 Target Tabungan" },
  { id: "savings-cash", label: "💵 Tabungan Cash" },
  { id: "portfolio-saham", label: "📈 Portofolio Saham" },
  { id: "simulator", label: "🧮 Simulasi Saham" },
  { id: "portfolio-emas", label: "✨ Portofolio Emas" },
  { id: "total", label: "💰 Total Tabungan" },
  { id: "roadmap", label: "🗺️ Financial Roadmap" },
];
