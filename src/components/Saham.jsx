import { useState, useMemo, useEffect } from "react";
import { S, C, parseNum, fmtNum, fmtInp, calcNewAvg, genMonthOpts } from "../lib.js";
import { runningModalBefore } from "../calc.js";
import { NI } from "./common.jsx";

// ══ MODAL ACTIVITY SAHAM ══
function SahamModalActivity({ pKey, year, month, appData, setAppData }) {
  const MNL = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const mk = `${year}-${String(month + 1).padStart(2, "0")}`;
  const prevMk = `${month === 0 ? year - 1 : year}-${String(month === 0 ? 12 : month).padStart(2, "0")}`;
  const allActivity = appData.portfolio[pKey + "_activity"] || {};
  const entries = allActivity[mk] || [];
  const emitenList = appData.portfolio[pKey] || [];
  const prevEntries = allActivity[prevMk] || [];
  const prevSaldo = prevEntries.reduce((s, e) => {
    const a = parseNum(e.totalAmount || e.amount || 0);
    return e.tipe === "Expenses Buy" ? s - a : s + a;
  }, 0);

  const blank = { date: "", tipe: "Income Modal", emitenId: "", emiten: "", lot: "", harga: "", brokerFee: "", amount: "", desc: "" };
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);

  const monthOpts = useMemo(() => genMonthOpts(year, month), [year, month]);
  const [filterMk, setFilterMk] = useState(mk);
  useEffect(() => setFilterMk(mk), [mk]);

  // AUTO-CARRY: kalau bulan BERJALAN (real) masih kosong & ada saldo bulan lalu,
  // otomatis isi 1 entri "Income Modal (carry)" = saldo modal bulan sebelumnya.
  useEffect(() => {
    const realMk = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    if (mk !== realMk) return;
    setAppData(d => {
      const act = d.portfolio[pKey + "_activity"] || {};
      if ((act[mk] || []).length) return d; // sudah ada isi -> jangan timpa
      const prev = runningModalBefore(act, mk);
      if (prev == null || Math.round(prev) === 0) return d;
      const carry = { id: Date.now() + Math.random(), tipe: "Income Modal", amount: fmtInp(String(Math.round(prev))), totalAmount: Math.round(prev), desc: "Carry saldo bulan lalu", date: "", mk, carry: true };
      return { ...d, portfolio: { ...d.portfolio, [pKey + "_activity"]: { ...act, [mk]: [carry] } } };
    });
  }, [mk, pKey, setAppData]);

  const displayEntries = allActivity[filterMk] || [];
  const selEmiten = emitenList.find(e => e.id === form.emitenId);

  const needsEmiten = ["Income Dividen", "Income Sell", "Expenses Buy"].includes(form.tipe);
  const needsLotHarga = ["Income Sell", "Expenses Buy"].includes(form.tipe);

  const calcTotal = () => {
    if (form.tipe === "Expenses Buy") return parseNum(form.lot) * 100 * parseNum(form.harga) + parseNum(form.brokerFee);
    if (form.tipe === "Income Sell") return parseNum(form.lot) * 100 * parseNum(form.harga) - parseNum(form.brokerFee);
    return parseNum(form.amount);
  };

  const save = () => {
    const total = calcTotal();
    if (!form.tipe) return;
    if ((form.tipe === "Income Modal" || form.tipe === "Income Dividen") && !parseNum(form.amount)) return;
    if (needsLotHarga && (!parseNum(form.lot) || !parseNum(form.harga))) return;

    const entry = { ...form, id: editId || Date.now(), totalAmount: total, mk };

    setAppData(d => {
      const act = d.portfolio[pKey + "_activity"] || {};
      const monthEntries = act[mk] || [];
      const newEntries = editId
        ? monthEntries.map(e => e.id === editId ? entry : e)
        : [...monthEntries, entry];
      let newPortfolio = { ...d.portfolio, [pKey + "_activity"]: { ...act, [mk]: newEntries } };

      if ((form.tipe === "Expenses Buy" || form.tipe === "Income Sell") && form.emitenId && !editId) {
        const masterList = d.portfolio[pKey] || [];
        const emitenName = form.emiten || (emitenList.find(x => String(x.id) === String(form.emitenId))?.emiten) || "";
        const selE = masterList.find(s => s.emiten === emitenName || String(s.id) === String(form.emitenId));
        if (selE) {
          const snap = d.portfolio[pKey + "_snap"] || {};
          let base;
          if (snap[mk]) base = snap[mk].map(s => ({ ...s }));
          else {
            const [ey, em] = mk.split("-").map(Number);
            let found = false;
            for (let i = 1; i <= 24 && !found; i++) {
              let py = ey, pm = em - i;
              while (pm <= 0) { pm += 12; py--; }
              const pk = `${py}-${String(pm).padStart(2, "0")}`;
              if (snap[pk]) { base = snap[pk].map(s => ({ ...s })); found = true; }
            }
            if (!found) base = masterList.map(s => ({ ...s }));
          }
          const updated = base.map(s => {
            if (s.emiten !== selE.emiten) return s;
            if (form.tipe === "Expenses Buy") {
              const newAvg = calcNewAvg(s.lot, s.avgPrice, form.lot, form.harga);
              const newLot = parseNum(s.lot) + parseNum(form.lot);
              return { ...s, lot: String(newLot), avgPrice: String(Math.round(newAvg)) };
            } else {
              return { ...s, lot: String(Math.max(0, parseNum(s.lot) - parseNum(form.lot))) };
            }
          });
          newPortfolio = { ...newPortfolio, [pKey + "_snap"]: { ...snap, [mk]: updated } };
        }
      }
      return { ...d, portfolio: newPortfolio };
    });

    setEditId(null);
    setForm(blank);
  };

  const startEdit = (e) => { setForm({ ...blank, ...e }); setEditId(e.id); };
  const cancel = () => { setEditId(null); setForm(blank); };
  const del = (id) => {
    setAppData(d => {
      const act = d.portfolio[pKey + "_activity"] || {};
      const newEntries = (act[mk] || []).filter(e => e.id !== id);
      return { ...d, portfolio: { ...d.portfolio, [pKey + "_activity"]: { ...act, [mk]: newEntries } } };
    });
  };

  const saldo = entries.reduce((s, e) => {
    const a = parseNum(e.totalAmount || e.amount || 0);
    return e.tipe === "Expenses Buy" ? s - a : s + a;
  }, 0);

  return (
    <div style={{ ...S.card, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h3 style={S.h3}>💰 Modal Activity</h3>
        <select style={S.selSm} value={filterMk} onChange={e => setFilterMk(e.target.value)}>
          {monthOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {prevEntries.length > 0 && <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, padding: "4px 8px", background: "#f0f9ff", borderRadius: 5 }}>
        Saldo carry-forward bulan lalu: <strong>Rp {fmtNum(prevSaldo)}</strong>
      </div>}

      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr" + (needsEmiten ? " 1fr" : ""), gap: 8, marginBottom: 8 }}>
        <div><label style={S.lbl}>Tanggal</label><input type="date" style={S.inp} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
        <div><label style={S.lbl}>Tipe</label>
          <select style={S.sel} value={form.tipe} onChange={e => setForm(f => ({ ...f, tipe: e.target.value, emitenId: "", lot: "", harga: "", brokerFee: "", amount: "", desc: "" }))}>
            {["Income Modal", "Income Dividen", "Income Sell", "Expenses Buy"].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        {needsEmiten && <div><label style={S.lbl}>Emiten</label>
          <select style={S.sel} value={form.emitenId} onChange={e => {
            const sel = emitenList.find(x => x.id === e.target.value);
            setForm(f => ({ ...f, emitenId: e.target.value, emiten: sel?.emiten || "" }));
          }}>
            <option value="">-- Pilih --</option>
            {emitenList.map(e => <option key={e.id} value={e.id}>{e.emiten}</option>)}
          </select>
        </div>}
      </div>

      {needsLotHarga && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
        <div><label style={S.lbl}>Lot</label><NI value={form.lot} onChange={v => setForm(f => ({ ...f, lot: v }))} /></div>
        <div><label style={S.lbl}>Harga (Rp)</label><NI value={form.harga} onChange={v => setForm(f => ({ ...f, harga: v }))} /></div>
        <div><label style={S.lbl}>Broker Fee (Rp)</label><NI value={form.brokerFee} onChange={v => setForm(f => ({ ...f, brokerFee: v }))} /></div>
      </div>}
      {!needsLotHarga && <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8, marginBottom: 8 }}>
        <div><label style={S.lbl}>Deskripsi</label><input style={S.inp} value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="Keterangan..." /></div>
        <div><label style={S.lbl}>Amount (Rp)</label><NI value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} /></div>
      </div>}

      {needsLotHarga && parseNum(form.lot) > 0 && parseNum(form.harga) > 0 && (
        <div style={{ fontSize: 12, padding: "6px 10px", background: "#fafaf8", borderRadius: 6, marginBottom: 8, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <span>Total: <strong style={{ color: form.tipe === "Expenses Buy" ? C.red : C.green }}>
            {form.tipe === "Expenses Buy" ? "−" : "+"} Rp {fmtNum(calcTotal())}
          </strong></span>
          {form.tipe === "Expenses Buy" && selEmiten && <span>
            New avg: <strong>Rp {fmtNum(Math.round(calcNewAvg(selEmiten.lot, selEmiten.avgPrice, form.lot, form.harga)))}</strong>
          </span>}
          {form.tipe === "Expenses Buy" && <span style={{ fontSize: 11, color: C.green }}>✅ Akan sync ke portofolio</span>}
          {form.tipe === "Income Sell" && <span style={{ fontSize: 11, color: C.orange }}>📤 Akan kurangi lot di portofolio</span>}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button style={S.btnG} onClick={save}>{editId ? "Simpan" : "Tambah"}</button>
        {editId && <button style={S.btnGh} onClick={cancel}>Batal</button>}
      </div>

      <table style={{ ...S.tbl, marginTop: 14 }}><thead><tr>
        <th style={S.th}>Tgl</th><th style={S.th}>Tipe</th><th style={S.th}>Detail</th>
        <th style={S.th}>Amount</th><th></th>
      </tr></thead>
        <tbody>
          {displayEntries.length === 0 && <tr><td colSpan={5} style={{ ...S.td, textAlign: "center", color: "#ccc" }}>Belum ada aktivitas</td></tr>}
          {displayEntries.map(e => {
            const isExp = e.tipe === "Expenses Buy";
            const emNm = emitenList.find(x => x.id === e.emitenId)?.emiten;
            return <tr key={e.id} style={{ background: editId === e.id ? "#fefce8" : "" }}>
              <td style={S.td}>{e.date || "—"}</td>
              <td style={S.td}><span style={{ ...S.pill(isExp ? "Expenses" : "Income"), fontSize: 10 }}>{e.tipe}</span></td>
              <td style={S.td}>
                {emNm && <span style={{ fontWeight: 600, fontSize: 12 }}>{emNm} </span>}
                {e.lot && <span style={{ fontSize: 11, color: C.muted }}>{fmtNum(parseNum(e.lot))} lot @ Rp {fmtNum(parseNum(e.harga))}</span>}
                {e.desc && <span style={{ fontSize: 12, color: C.muted }}>{e.desc}</span>}
                {e.brokerFee && parseNum(e.brokerFee) > 0 && <span style={{ fontSize: 10, color: C.muted }}> (fee Rp {fmtNum(parseNum(e.brokerFee))})</span>}
              </td>
              <td style={{ ...S.td, fontWeight: 600, color: isExp ? C.red : C.green, whiteSpace: "nowrap" }}>
                {isExp ? "−" : "+"} Rp {fmtNum(parseNum(e.totalAmount || e.amount || 0))}
              </td>
              <td style={S.td}><div style={{ display: "flex", gap: 3 }}>
                <button style={S.btnGh} onClick={() => startEdit(e)}>✏️</button>
                <button style={S.btnR} onClick={() => del(e.id)}>×</button>
              </div></td>
            </tr>;
          })}
          <tr style={{ background: "#f9fafb", fontWeight: 700 }}>
            <td style={S.td} colSpan={3}>Saldo {MNL[month]} {year}</td>
            <td style={{ ...S.td, ...S.vc(saldo) }}>Rp {fmtNum(saldo)}</td><td></td>
          </tr>
        </tbody></table>
    </div>
  );
}

// ══ SAHAM ══
export function Saham({ appData, setAppData, title = "📈 Portofolio Saham", pKey = "saham", year, month }) {
  const mk = `${year}-${String(month + 1).padStart(2, "0")}`;
  const prevMk = `${month === 0 ? year - 1 : year}-${String(month === 0 ? 12 : month).padStart(2, "0")}`;

  const allSnap = appData.portfolio[pKey + "_snap"] || {};
  const baseList = appData.portfolio[pKey] || [];
  const saham = useMemo(() => {
    if (allSnap[mk]) return allSnap[mk];
    const [ey, em] = mk.split("-").map(Number);
    for (let i = 1; i <= 24; i++) {
      let py = ey, pm = em - i;
      while (pm <= 0) { pm += 12; py--; }
      const pk = `${py}-${String(pm).padStart(2, "0")}`;
      if (allSnap[pk]) return allSnap[pk].map(s => ({ ...s }));
    }
    return baseList.map(s => ({ ...s }));
  }, [allSnap, mk, baseList]);

  const [form, setForm] = useState({ emiten: "", lot: "", avgPrice: "", currentPrice: "" });
  const [editId, setEditId] = useState(null);

  const saveEmiten = () => {
    if (!form.emiten) return;
    const newE = { ...form, id: editId || Date.now() };
    setAppData(d => {
      const snap = d.portfolio[pKey + "_snap"] || {};
      const curSnap = (snap[mk] || (snap[prevMk] || d.portfolio[pKey] || []).map(s => ({ ...s })));
      if (editId) {
        return {
          ...d, portfolio: {
            ...d.portfolio,
            [pKey]: d.portfolio[pKey].map(s => s.id === editId ? newE : s),
            [pKey + "_snap"]: { ...snap, [mk]: curSnap.map(s => s.id === editId ? newE : s) }
          }
        };
      } else {
        return {
          ...d, portfolio: {
            ...d.portfolio,
            [pKey]: [...(d.portfolio[pKey] || []), newE],
            [pKey + "_snap"]: { ...snap, [mk]: [...curSnap, newE] }
          }
        };
      }
    });
    setEditId(null);
    setForm({ emiten: "", lot: "", avgPrice: "", currentPrice: "" });
  };

  const updField = (id, f, v) => {
    setAppData(d => {
      const snap = d.portfolio[pKey + "_snap"] || {};
      const cur = (snap[mk] || (snap[prevMk] || d.portfolio[pKey] || []).map(s => ({ ...s }))).map(s => s.id === id ? { ...s, [f]: v } : s);
      return { ...d, portfolio: { ...d.portfolio, [pKey + "_snap"]: { ...snap, [mk]: cur } } };
    });
  };

  const delEmiten = (id) => {
    setAppData(d => {
      const snap = d.portfolio[pKey + "_snap"] || {};
      const curSnap = (snap[mk] || (snap[prevMk] || d.portfolio[pKey] || []).map(s => ({ ...s }))).filter(s => s.id !== id);
      return {
        ...d, portfolio: {
          ...d.portfolio,
          [pKey]: d.portfolio[pKey].filter(s => s.id !== id),
          [pKey + "_snap"]: { ...snap, [mk]: curSnap }
        }
      };
    });
  };

  const startEdit = (s) => { setForm({ emiten: s.emiten || "", lot: s.lot || "", avgPrice: s.avgPrice || "", currentPrice: s.currentPrice || "" }); setEditId(s.id); };
  const cancel = () => { setEditId(null); setForm({ emiten: "", lot: "", avgPrice: "", currentPrice: "" }); };

  const totInv = saham.reduce((s, r) => s + parseNum(r.lot) * 100 * parseNum(r.avgPrice), 0);
  const totCur = saham.reduce((s, r) => s + parseNum(r.lot) * 100 * parseNum(r.currentPrice), 0);
  const pl = totCur - totInv;

  const allAct = appData.portfolio[pKey + "_activity"] || {};
  const actEntries = allAct[mk] || [];
  const totModal = actEntries.reduce((s, e) => {
    const a = parseNum(e.totalAmount || e.amount || 0);
    return e.tipe === "Expenses Buy" ? s - a : s + a;
  }, 0);

  return (
    <div>
      <SahamModalActivity pKey={pKey} year={year} month={month} appData={appData} setAppData={setAppData} />
      <div style={S.card}>
        <h3 style={{ ...S.h3, fontSize: 15, marginBottom: 14 }}>{title}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 110px 110px auto", gap: 8, marginBottom: 14, alignItems: "end" }}>
          <div><label style={S.lbl}>Emiten</label><input style={S.inp} value={form.emiten} onChange={e => setForm(f => ({ ...f, emiten: e.target.value.toUpperCase() }))} placeholder="ABCD" /></div>
          <div><label style={S.lbl}>Lot</label><NI value={form.lot} onChange={v => setForm(f => ({ ...f, lot: v }))} /></div>
          <div><label style={S.lbl}>Avg Price</label><NI value={form.avgPrice} onChange={v => setForm(f => ({ ...f, avgPrice: v }))} /></div>
          <div><label style={S.lbl}>Cur Price</label><NI value={form.currentPrice} onChange={v => setForm(f => ({ ...f, currentPrice: v }))} /></div>
          <div style={{ display: "flex", gap: 6, marginTop: 20 }}>
            <button style={S.btnG} onClick={saveEmiten}>{editId ? "Simpan" : "+ Emiten"}</button>
            {editId && <button style={S.btnGh} onClick={cancel}>Batal</button>}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ ...S.tbl, minWidth: 650 }}><thead><tr>
            <th style={S.th}>Emiten</th>
            <th style={{ ...S.th, minWidth: 90 }}>Lot</th>
            <th style={{ ...S.th, minWidth: 120 }}>Avg Price</th>
            <th style={{ ...S.th, minWidth: 120 }}>Invested</th>
            <th style={{ ...S.th, minWidth: 120 }}>Cur Price</th>
            <th style={{ ...S.th, minWidth: 130 }}>Nilai Skrg</th>
            <th style={{ ...S.th, minWidth: 150 }}>P/L</th>
            <th></th>
          </tr></thead>
            <tbody>
              {saham.length === 0 && <tr><td colSpan={8} style={{ ...S.td, textAlign: "center", color: "#ccc", padding: 20 }}>Belum ada emiten</td></tr>}
              {saham.map(s => {
                const inv = parseNum(s.lot) * 100 * parseNum(s.avgPrice);
                const cur = parseNum(s.lot) * 100 * parseNum(s.currentPrice);
                const spl = cur - inv;
                const pct = inv > 0 ? (spl / inv * 100).toFixed(1) : 0;
                return <tr key={s.id} style={{ background: editId === s.id ? "#fefce8" : "" }}>
                  <td style={{ ...S.td, fontWeight: 700 }}>{s.emiten}</td>
                  <td style={S.td}><NI sm value={s.lot} onChange={v => updField(s.id, "lot", v)} style={{ minWidth: 70 }} /></td>
                  <td style={S.td}><NI sm value={s.avgPrice} onChange={v => updField(s.id, "avgPrice", v)} style={{ minWidth: 100 }} /></td>
                  <td style={S.td}>Rp {fmtNum(inv)}</td>
                  <td style={S.td}><NI sm value={s.currentPrice} onChange={v => updField(s.id, "currentPrice", v)} style={{ minWidth: 100 }} /></td>
                  <td style={S.td}>Rp {fmtNum(cur)}</td>
                  <td style={{ ...S.td, ...S.vc(spl), whiteSpace: "nowrap" }}>Rp {fmtNum(Math.abs(spl))} <span style={{ fontSize: 10 }}>({pct}%)</span></td>
                  <td style={S.td}><div style={{ display: "flex", gap: 3 }}>
                    <button style={S.btnGh} onClick={() => startEdit(s)}>✏️</button>
                    <button style={S.btnR} onClick={() => delEmiten(s.id)}>×</button>
                  </div></td>
                </tr>;
              })}
              {saham.length > 0 && <tr style={{ background: "#f9fafb", fontWeight: 700 }}>
                <td style={S.td} colSpan={3}>Total</td>
                <td style={S.td}>Rp {fmtNum(totInv)}</td><td></td>
                <td style={S.td}>Rp {fmtNum(totCur)}</td>
                <td style={{ ...S.td, ...S.vc(pl) }}>Rp {fmtNum(Math.abs(pl))} ({totInv > 0 ? (pl / totInv * 100).toFixed(1) : 0}%)</td>
                <td></td>
              </tr>}
            </tbody></table>
        </div>
        {saham.length > 0 && <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 14 }}>
          {[
            ["🏆 Total Portfolio", totModal + totCur, "Modal+Nilai Skrg", C.purple],
            ["📊 Nilai Invested", totInv, "", C.navy],
            ["📈 P/L", pl, totInv > 0 ? (pl / totInv * 100).toFixed(1) + "%" : "", pl >= 0 ? C.green : C.red],
          ].map(([l, v, sub, c]) => (
            <div key={l} style={{ background: "#fafaf8", borderRadius: 8, padding: "10px 14px", borderLeft: `3px solid ${c}` }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>{l}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: c }}>Rp {fmtNum(Math.abs(v))}{l === "📈 P/L" && (v < 0 ? " ▼" : " ▲")}</div>
              {sub && <div style={{ fontSize: 9, color: C.muted, marginTop: 1 }}>{sub}</div>}
            </div>
          ))}
        </div>}
      </div>
    </div>
  );
}
