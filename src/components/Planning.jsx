import { useEffect, useMemo } from "react";
import { S, C, parseNum, fmtNum, fmtInp } from "../lib.js";
import { NI } from "./common.jsx";

export function Planning({ monthData, setMonthData, prevMonthData }) {
  const plan = monthData.planning;

  // Carry-forward: Sisa Bulan Lalu = Total Income - Total Expenses dari PLANNING bulan lalu
  useEffect(() => {
    if (!prevMonthData) return;
    const prevPlan = prevMonthData.planning;
    if (!prevPlan) return;
    const prevTotInc = (prevPlan.incomes || []).reduce((s, r) => s + parseNum(r.amount), 0);
    const prevTotExp = (prevPlan.expenseTypes || []).reduce((s, t) => s + (t.subs || []).reduce((ss, sub) => ss + parseNum(sub.plan), 0), 0);
    const sisa = prevTotInc - prevTotExp;
    const sisaFormatted = fmtInp(String(Math.abs(Math.round(sisa))));
    const sisaFinal = sisa < 0 ? "-" + sisaFormatted : sisaFormatted;
    setMonthData(d => {
      const incomes = d.planning?.incomes || [];
      const sisaRow = incomes.find(r => r.source === "Sisa Bulan Lalu");
      if (sisaRow && sisaRow.amount === sisaFinal) return d;
      return { ...d, planning: { ...d.planning, incomes: incomes.map(r => r.source === "Sisa Bulan Lalu" ? { ...r, amount: sisaFinal } : r) } };
    });
  }, [prevMonthData]);

  const dailyAct = useMemo(() => {
    const m = {};
    (monthData.daily || []).forEach(e => {
      if (e.type === "Expenses" && e.subJenisId) m[e.subJenisId] = (m[e.subJenisId] || 0) + parseNum(e.amount);
      else if (e.type === "Reimburse" && e.subJenisId) m[e.subJenisId] = (m[e.subJenisId] || 0) - parseNum(e.amount);
    });
    return m;
  }, [monthData.daily]);

  const updInc = (i, f, v) => setMonthData(d => { const a = [...d.planning.incomes]; a[i] = { ...a[i], [f]: v }; return { ...d, planning: { ...d.planning, incomes: a } }; });
  const addInc = () => setMonthData(d => ({ ...d, planning: { ...d.planning, incomes: [...d.planning.incomes, { id: "inc" + Date.now(), source: "", amount: "" }] } }));
  const delInc = (i) => setMonthData(d => { const a = [...d.planning.incomes]; a.splice(i, 1); return { ...d, planning: { ...d.planning, incomes: a } }; });
  const addJenis = () => setMonthData(d => ({ ...d, planning: { ...d.planning, expenseTypes: [...d.planning.expenseTypes, { id: "et" + Date.now(), name: "", subs: [] }] } }));
  const updJenis = (id, v) => setMonthData(d => ({ ...d, planning: { ...d.planning, expenseTypes: d.planning.expenseTypes.map(t => t.id === id ? { ...t, name: v } : t) } }));
  const delJenis = (id) => setMonthData(d => ({ ...d, planning: { ...d.planning, expenseTypes: d.planning.expenseTypes.filter(t => t.id !== id) } }));
  const addSub = (jid) => setMonthData(d => ({ ...d, planning: { ...d.planning, expenseTypes: d.planning.expenseTypes.map(t => t.id === jid ? { ...t, subs: [...t.subs, { id: "es" + Date.now(), name: "", plan: "" }] } : t) } }));
  const updSub = (jid, sid, f, v) => setMonthData(d => ({ ...d, planning: { ...d.planning, expenseTypes: d.planning.expenseTypes.map(t => t.id === jid ? { ...t, subs: t.subs.map(s => s.id === sid ? { ...s, [f]: v } : s) } : t) } }));
  const delSub = (jid, sid) => setMonthData(d => ({ ...d, planning: { ...d.planning, expenseTypes: d.planning.expenseTypes.map(t => t.id === jid ? { ...t, subs: t.subs.filter(s => s.id !== sid) } : t) } }));

  const totInc = plan.incomes.reduce((s, r) => s + parseNum(r.amount), 0);
  const totExp = plan.expenseTypes.reduce((s, t) => s + t.subs.reduce((ss, sub) => ss + parseNum(sub.plan), 0), 0);
  const sel = totInc - totExp;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ ...S.h3, margin: 0 }}>💚 Income</h3>
            <button style={S.btnGh} onClick={addInc}>+ Source</button>
          </div>
          <table style={S.tbl}><thead><tr><th style={S.th}>Source</th><th style={S.th}>Amount (Rp)</th><th></th></tr></thead>
            <tbody>
              {plan.incomes.map((r, i) => (
                <tr key={r.id || i}>
                  <td style={S.td}><input style={S.inpSm} value={r.source} onChange={e => updInc(i, "source", e.target.value)} /></td>
                  <td style={S.td}><NI sm value={r.amount} onChange={v => updInc(i, "amount", v)} /></td>
                  <td style={S.td}><button style={S.btnR} onClick={() => delInc(i)}>×</button></td>
                </tr>
              ))}
              <tr style={{ background: "#f9fafb", fontWeight: 700 }}><td style={S.td}>Total</td><td style={{ ...S.td, color: C.green }}>Rp {fmtNum(totInc)}</td><td></td></tr>
            </tbody></table>
        </div>
        <div style={S.card}>
          <h3 style={S.h3}>❤️ Ringkasan Expenses</h3>
          <table style={S.tbl}><thead><tr><th style={S.th}>Jenis</th><th style={S.th}>Plan</th><th style={S.th}>Actual</th><th style={S.th}>Selisih</th></tr></thead>
            <tbody>
              {plan.expenseTypes.map(t => {
                const tp = t.subs.reduce((s, sub) => s + parseNum(sub.plan), 0);
                const ta = t.subs.reduce((s, sub) => s + (dailyAct[sub.id] || 0), 0);
                return <tr key={t.id}><td style={{ ...S.td, fontWeight: 600 }}>{t.name || "—"}</td><td style={S.td}>Rp {fmtNum(tp)}</td><td style={S.td}>Rp {fmtNum(ta)}</td>
                  <td style={{ ...S.td, ...S.vc(tp - ta) }}>{tp - ta >= 0 ? "✅" : "⚠️"} Rp {fmtNum(Math.abs(tp - ta))}</td></tr>;
              })}
              <tr style={{ background: "#f9fafb", fontWeight: 700 }}><td style={S.td}>Total</td><td style={{ ...S.td, color: C.red }}>Rp {fmtNum(totExp)}</td><td></td><td></td></tr>
            </tbody></table>
        </div>
      </div>
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ ...S.h3, margin: 0 }}>📊 Detail Expenses — Plan vs Actual</h3>
          <button style={S.btnGh} onClick={addJenis}>+ Tambah Jenis</button>
        </div>
        {plan.expenseTypes.map(t => {
          const tp = t.subs.reduce((s, sub) => s + parseNum(sub.plan), 0);
          const ta = t.subs.reduce((s, sub) => s + (dailyAct[sub.id] || 0), 0);
          return (
            <div key={t.id} style={{ marginBottom: 16, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
              <div style={{ background: C.light, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <input style={{ ...S.inpSm, width: 180, background: "transparent", border: "none", fontWeight: 700, fontSize: 13 }} value={t.name} onChange={e => updJenis(t.id, e.target.value)} placeholder="Nama Jenis..." />
                <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 12, color: C.gray, flexWrap: "wrap" }}>
                  <span>Plan: <b>Rp {fmtNum(tp)}</b></span><span>Actual: <b>Rp {fmtNum(ta)}</b></span>
                  <button style={S.btnGh} onClick={() => addSub(t.id)}>+ Sub-jenis</button>
                  <button style={S.btnR} onClick={() => delJenis(t.id)}>× Hapus</button>
                </div>
              </div>
              <table style={S.tbl}><thead><tr><th style={S.th}>Sub-jenis</th><th style={S.th}>Plan</th><th style={S.th}>Actual</th><th style={S.th}>Selisih</th><th style={S.th}>%</th><th></th></tr></thead>
                <tbody>
                  {t.subs.map(sub => {
                    const act = dailyAct[sub.id] || 0; const pl = parseNum(sub.plan); const pct = pl > 0 ? (act / pl * 100) : 0;
                    return <tr key={sub.id}>
                      <td style={S.td}><input style={S.inpSm} value={sub.name} onChange={e => updSub(t.id, sub.id, "name", e.target.value)} placeholder="Sub-jenis..." /></td>
                      <td style={S.td}><NI sm value={sub.plan} onChange={v => updSub(t.id, sub.id, "plan", v)} /></td>
                      <td style={{ ...S.td, color: C.gray }}>Rp {fmtNum(act)}</td>
                      <td style={{ ...S.td, ...S.vc(pl - act) }}>Rp {fmtNum(Math.abs(pl - act))}</td>
                      <td style={S.td}><span style={S.alertBadge(pct)}>{pct.toFixed(0)}%</span></td>
                      <td style={S.td}><button style={S.btnR} onClick={() => delSub(t.id, sub.id)}>×</button></td>
                    </tr>;
                  })}
                </tbody></table>
            </div>
          );
        })}
      </div>
      <div style={{ ...S.card, background: sel >= 0 ? "#f0fdf4" : "#fff5f5", border: `1.5px solid ${sel >= 0 ? "#bbf7d0" : "#fecaca"}` }}>
        <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center", flexWrap: "wrap", gap: 12 }}>
          {[["Total Income", "Rp " + fmtNum(totInc), C.green], ["Total Expenses", "Rp " + fmtNum(totExp), C.red], ["Selisih", "Rp " + fmtNum(Math.abs(sel)), sel >= 0 ? C.green : C.red]].map(([l, v, c]) => (
            <div key={l}><div style={S.lbl}>{l}</div><div style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div></div>
          ))}
        </div>
      </div>
    </div>
  );
}
