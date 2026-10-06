import { useState } from "react";
import { BANKS, MN, parseNum, fmtNum } from "../lib.js";

export function ExportModal({ modal, onClose }) {
  const [tab, setTab] = useState("json");
  if (!modal) return null;
  const MNL = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const csvDaily = (() => {
    const daily = modal.daily || [];
    const expTypes = modal.expTypes || [];
    const rows = [["Tanggal", "Jenis", "Sub-jenis", "Deskripsi", "Source", "Tipe", "Amount"]];
    daily.forEach(e => {
      const jen = expTypes.find(t => t.id === e.jenisId);
      const sub = jen?.subs.find(s => s.id === e.subJenisId);
      rows.push([e.date || "", jen?.name || "", sub?.name || "", e.desc || "", e.source || "", e.type || "", parseNum(e.amount)]);
    });
    return rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  })();

  const csvPlanning = (() => {
    const plan = modal.planning;
    if (!plan) return "";
    const rows = [["Jenis", "Sub-jenis", "Plan (Rp)", "Actual (Rp)", "Selisih (Rp)"]];
    plan.expenseTypes.forEach(t => {
      t.subs.forEach(sub => {
        const act = modal.dailyAct?.[sub.id] || 0;
        const pn2 = (s) => parseFloat(String(s).replace(/\./g, '').replace(',', '.')) || 0;
        rows.push([t.name, sub.name, pn2(sub.plan), act, pn2(sub.plan) - act]);
      });
    });
    rows.push(["", "", "", "", ""]);
    rows.push(["INCOME", "Source", "Amount", "", ""]);
    const pn3 = (s) => parseFloat(String(s).replace(/\./g, '').replace(',', '.')) || 0;
    plan.incomes.forEach(r => rows.push(["", r.source, pn3(r.amount), "", ""]));
    return rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  })();

  const csvSaham = (() => {
    const saham = modal.saham || [];
    const rows = [["Emiten", "Lot", "Avg Price", "Invested", "Current Price", "Nilai Sekarang", "P/L", "Modal", "Dividen"]];
    const pn = (s) => parseFloat(String(s).replace(/\./g, '').replace(',', '.')) || 0;
    saham.forEach(s => {
      const inv = pn(s.lot) * 100 * pn(s.avgPrice);
      const cur = pn(s.lot) * 100 * pn(s.currentPrice);
      rows.push([s.emiten, pn(s.lot), pn(s.avgPrice), inv, pn(s.currentPrice), cur, cur - inv, pn(s.modal || 0), pn(s.dividen || 0)]);
    });
    return rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  })();

  const tabs = [{ id: "json", label: "📋 JSON Backup" }, { id: "daily", label: "📅 Transaksi CSV" }, { id: "planning", label: "📊 Planning CSV" }, { id: "saham", label: "📈 Saham CSV" }];
  const csvMap = { daily: csvDaily, planning: csvPlanning, saham: csvSaham };
  const instructions = {
    json: "Tap kotak → Select All → Copy → paste ke Google Keep atau Notes sebagai backup.",
    daily: "Tap kotak → Select All → Copy → buka Google Sheets baru → Paste. Otomatis jadi tabel rapi!",
    planning: "Tap kotak → Select All → Copy → buka Google Sheets baru → Paste.",
    saham: "Tap kotak → Select All → Copy → buka Google Sheets baru → Paste.",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 20, width: "100%", maxWidth: 540, maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, color: "#1a1a2e", margin: 0 }}>📥 Export Data</h3>
          <button onClick={onClose} style={{ background: "#f0ede8", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 13 }}>✕</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
          {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "7px 4px", background: tab === t.id ? "#1a1a2e" : "#f0ede8", color: tab === t.id ? "#fff" : "#333", border: "none", borderRadius: 7, fontSize: 11, cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>{t.label}</button>)}
        </div>
        <p style={{ fontSize: 12, color: "#555", marginBottom: 8, background: "#fffbeb", padding: "8px 10px", borderRadius: 7, border: "1px solid #fcd34d" }}>
          💡 {instructions[tab]}
        </p>
        <textarea readOnly
          value={tab === "json" ? modal.jsonStr : csvMap[tab]}
          style={{ flex: 1, minHeight: 220, maxHeight: 340, padding: 10, fontSize: tab === "json" ? 10 : 12, fontFamily: "monospace", border: "1px solid #e5e2dc", borderRadius: 8, resize: "none", background: "#fafaf8", color: "#333" }}
          onFocus={e => e.target.select()}
        />
        <p style={{ fontSize: 11, color: "#aaa", marginTop: 6, textAlign: "center" }}>
          {tab === "json" ? `Data per ${new Date().toLocaleDateString("id-ID")}` : `${MNL[modal.month || 0]} ${modal.year}`}
        </p>
      </div>
    </div>
  );
}

export function doExport(appData, year, month, monthData, setExportModal, extra = {}) {
  const jsonStr = JSON.stringify(appData, null, 2);
  const plan = monthData?.planning; const daily = monthData?.daily || [];
  const totInc = plan?.incomes.reduce((s, r) => s + parseNum(r.amount), 0) || 0;
  const totExp = plan?.expenseTypes.reduce((s, t) => s + t.subs.reduce((ss, s2) => ss + parseNum(s2.plan), 0), 0) || 0;
  const netD = {}; BANKS.forEach(b => { netD[b] = 0; }); daily.forEach(e => { const a = parseNum(e.amount); if (e.type === "Expenses") netD[e.source] -= a; else if (e.type === "Income") netD[e.source] += a; });
  const incRows = (plan?.incomes || []).map(r => "<tr><td>" + r.source + "</td><td>Rp " + fmtNum(parseNum(r.amount)) + "</td></tr>").join("");
  const expRows = (plan?.expenseTypes || []).flatMap(t => t.subs.map(sub => { const act = daily.filter(e => e.type === "Expenses" && e.subJenisId === sub.id).reduce((s, e) => s + parseNum(e.amount), 0); const sel = parseNum(sub.plan) - act; return "<tr><td>" + t.name + "</td><td>" + sub.name + "</td><td>Rp " + fmtNum(parseNum(sub.plan)) + "</td><td>Rp " + fmtNum(act) + "</td><td class=" + (sel >= 0 ? '"g"' : '"r"') + ">Rp " + fmtNum(Math.abs(sel)) + "</td></tr>"; })).join("");
  const netRows = BANKS.map(b => "<tr><td>" + b + "</td><td class=" + (netD[b] >= 0 ? '"g"' : '"r"') + ">Rp " + fmtNum(netD[b]) + "</td></tr>").join("");
  const pdfHtml = "<!DOCTYPE html><html><head><meta charset='utf-8'/><title>Laporan " + MN[month] + " " + year + "</title><style>body{font-family:Arial,sans-serif;margin:32px;color:#1a1a2e}h1{border-bottom:3px solid #d4af37;padding-bottom:8px}h2{color:#d4af37;margin-top:24px}table{width:100%;border-collapse:collapse;margin-bottom:16px}th{background:#1a1a2e;color:#fff;padding:8px;text-align:left;font-size:12px}td{padding:7px 8px;border-bottom:1px solid #eee;font-size:13px}.tot{font-weight:700;background:#f9f9f9}.g{color:#16a34a}.r{color:#dc2626}</style></head><body><h1>Laporan " + MN[month] + " " + year + "</h1><h2>Income</h2><table><tr><th>Source</th><th>Amount</th></tr>" + incRows + "<tr class='tot'><td>Total</td><td class='g'>Rp " + fmtNum(totInc) + "</td></tr></table><h2>Expenses</h2><table><tr><th>Jenis</th><th>Sub-jenis</th><th>Plan</th><th>Actual</th><th>Selisih</th></tr>" + expRows + "<tr class='tot'><td colspan='2'>Total</td><td class='r'>Rp " + fmtNum(totExp) + "</td><td></td><td></td></tr></table><h2>Net per Source</h2><table><tr><th>Source</th><th>Net</th></tr>" + netRows + "</table><p style='font-size:11px;color:#aaa'>Generated: " + new Date().toLocaleString("id-ID") + "</p></body></html>";
  setExportModal({ jsonStr, pdfHtml, month, year, ...extra });
}
