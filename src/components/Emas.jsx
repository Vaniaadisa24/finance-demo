import { useState, useMemo, useEffect } from "react";
import { S, C, parseNum, fmtNum, genMonthOpts } from "../lib.js";
import { NI } from "./common.jsx";

// ══ MODAL ACTIVITY EMAS ══
function EmasModalActivity({ pKey, year, month, appData, setAppData }) {
  const MNL = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const mk = `${year}-${String(month + 1).padStart(2, "0")}`;
  const prevMk = `${month === 0 ? year - 1 : year}-${String(month === 0 ? 12 : month).padStart(2, "0")}`;
  const allActivity = appData.portfolio[pKey + "_activity"] || {};
  const entries = allActivity[mk] || [];
  const prevEntries = allActivity[prevMk] || [];
  const prevSaldo = prevEntries.reduce((s, e) => {
    const a = parseNum(e.totalAmount || e.amount || 0);
    return e.tipe === "Expenses Buy" ? s - a : s + a;
  }, 0);

  const blank = { date: "", tipe: "Income Modal", gram: "", hargaBeli: "", hargaJual: "", amount: "", desc: "" };
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const monthOpts = useMemo(() => genMonthOpts(year, month), [year, month]);
  const [filterMk, setFilterMk] = useState(mk);
  useEffect(() => setFilterMk(mk), [mk]);
  const displayEntries = allActivity[filterMk] || [];

  const needsGram = ["Income Jual", "Expenses Buy"].includes(form.tipe);

  const calcTotal = () => {
    if (form.tipe === "Expenses Buy") return parseNum(form.gram) * parseNum(form.hargaBeli);
    if (form.tipe === "Income Jual") return parseNum(form.gram) * parseNum(form.hargaJual);
    return parseNum(form.amount);
  };

  const save = () => {
    const total = calcTotal();
    if (!form.tipe) return;
    if ((form.tipe === "Income Modal") && !parseNum(form.amount)) return;
    if (needsGram && (!parseNum(form.gram) || (form.tipe === "Expenses Buy" && !parseNum(form.hargaBeli)) || (form.tipe === "Income Jual" && !parseNum(form.hargaJual)))) return;

    const entry = { ...form, id: editId || Date.now(), totalAmount: total, mk };

    setAppData(d => {
      const act = d.portfolio[pKey + "_activity"] || {};
      const monthEntries = act[mk] || [];
      const newEntries = editId
        ? monthEntries.map(e => e.id === editId ? entry : e)
        : [...monthEntries, entry];
      let newPortfolio = { ...d.portfolio, [pKey + "_activity"]: { ...act, [mk]: newEntries } };

      if ((form.tipe === "Expenses Buy" || form.tipe === "Income Jual") && !editId) {
        const snap = d.portfolio[pKey + "_snap"] || {};
        let cur;
        if (snap[mk]?.aggregate) {
          cur = { ...snap[mk].aggregate };
        } else {
          const [ey, em] = mk.split("-").map(Number);
          let found = false;
          for (let i = 1; i <= 24 && !found; i++) {
            let py = ey, pm = em - i;
            while (pm <= 0) { pm += 12; py--; }
            const pk = `${py}-${String(pm).padStart(2, "0")}`;
            if (snap[pk]?.aggregate) { cur = { ...snap[pk].aggregate }; found = true; }
          }
          if (!found) {
            const allEntries = d.portfolio[pKey]?.entries || [];
            const totalGram = allEntries.reduce((s, e) => s + parseNum(e.gram), 0);
            const avgHarga = totalGram > 0 ? allEntries.reduce((s, e) => s + parseNum(e.gram) * parseNum(e.hargaBeli), 0) / totalGram : 0;
            const hargaJual = allEntries[0]?.hargaJual || "0";
            cur = { gram: totalGram, hargaBeli: Math.round(avgHarga), hargaJual: parseNum(hargaJual) };
          }
        }

        if (form.tipe === "Expenses Buy") {
          const oldGram = parseNum(cur.gram) || 0;
          const oldHarga = parseNum(cur.hargaBeli) || 0;
          const addGram = parseNum(form.gram);
          const newGram = oldGram + addGram;
          const newHarga = newGram > 0 ? (oldGram * oldHarga + addGram * parseNum(form.hargaBeli)) / newGram : 0;
          cur = { ...cur, gram: newGram, hargaBeli: Math.round(newHarga) };
        } else {
          const newGram = Math.max(0, (parseNum(cur.gram) || 0) - parseNum(form.gram));
          cur = { ...cur, gram: newGram };
        }
        newPortfolio = { ...newPortfolio, [pKey + "_snap"]: { ...snap, [mk]: { ...snap[mk], aggregate: cur } } };
      }
      return { ...d, portfolio: newPortfolio };
    });

    setEditId(null);
    setForm(blank);
  };

  const startEdit = (e) => { setForm({ ...blank, ...e }); setEditId(e.id); };
  const cancel = () => { setEditId(null); setForm(blank); };
  const del = (id) => setAppData(d => {
    const act = d.portfolio[pKey + "_activity"] || {};
    return { ...d, portfolio: { ...d.portfolio, [pKey + "_activity"]: { ...act, [mk]: (act[mk] || []).filter(e => e.id !== id) } } };
  });

  const saldo = entries.reduce((s, e) => {
    const a = parseNum(e.totalAmount || e.amount || 0);
    return e.tipe === "Expenses Buy" ? s - a : s + a;
  }, 0);

  return (
    <div style={{ ...S.card, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h3 style={S.h3}>💰 Modal Activity Emas</h3>
        <select style={S.selSm} value={filterMk} onChange={e => setFilterMk(e.target.value)}>
          {monthOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {prevEntries.length > 0 && <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, padding: "4px 8px", background: "#f0f9ff", borderRadius: 5 }}>
        Saldo carry-forward bulan lalu: <strong>Rp {fmtNum(prevSaldo)}</strong>
      </div>}

      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, marginBottom: 8 }}>
        <div><label style={S.lbl}>Tanggal</label><input type="date" style={S.inp} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
        <div><label style={S.lbl}>Tipe</label>
          <select style={S.sel} value={form.tipe} onChange={e => setForm(f => ({ ...f, tipe: e.target.value, gram: "", hargaBeli: "", hargaJual: "", amount: "", desc: "" }))}>
            {["Income Modal", "Income Jual", "Expenses Buy"].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {needsGram && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <div><label style={S.lbl}>Gram</label><NI value={form.gram} onChange={v => setForm(f => ({ ...f, gram: v }))} /></div>
        {form.tipe === "Expenses Buy" && <div><label style={S.lbl}>Harga Beli/gr (Rp)</label><NI value={form.hargaBeli} onChange={v => setForm(f => ({ ...f, hargaBeli: v }))} /></div>}
        {form.tipe === "Income Jual" && <div><label style={S.lbl}>Harga Jual/gr (Rp)</label><NI value={form.hargaJual} onChange={v => setForm(f => ({ ...f, hargaJual: v }))} /></div>}
      </div>}
      {!needsGram && <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8, marginBottom: 8 }}>
        <div><label style={S.lbl}>Deskripsi</label><input style={S.inp} value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="Keterangan..." /></div>
        <div><label style={S.lbl}>Amount (Rp)</label><NI value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} /></div>
      </div>}

      {needsGram && parseNum(form.gram) > 0 && <div style={{ fontSize: 12, padding: "6px 10px", background: "#fafaf8", borderRadius: 6, marginBottom: 8 }}>
        Total: <strong style={{ color: form.tipe === "Expenses Buy" ? C.red : C.green }}>
          {form.tipe === "Expenses Buy" ? "−" : "+"} Rp {fmtNum(calcTotal())}
        </strong>
        <span style={{ fontSize: 11, color: form.tipe === "Expenses Buy" ? C.green : C.orange, marginLeft: 8 }}>
          {form.tipe === "Expenses Buy" ? "✅ Gram bertambah" : "📤 Gram berkurang"}
        </span>
      </div>}

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button style={S.btnG} onClick={save}>{editId ? "Simpan" : "Tambah"}</button>
        {editId && <button style={S.btnGh} onClick={cancel}>Batal</button>}
      </div>

      <table style={S.tbl}><thead><tr>
        <th style={S.th}>Tgl</th><th style={S.th}>Tipe</th><th style={S.th}>Detail</th>
        <th style={S.th}>Amount</th><th></th>
      </tr></thead>
        <tbody>
          {displayEntries.length === 0 && <tr><td colSpan={5} style={{ ...S.td, textAlign: "center", color: "#ccc" }}>Belum ada aktivitas</td></tr>}
          {displayEntries.map(e => {
            const isExp = e.tipe === "Expenses Buy";
            return <tr key={e.id} style={{ background: editId === e.id ? "#fefce8" : "" }}>
              <td style={S.td}>{e.date || "—"}</td>
              <td style={S.td}><span style={{ ...S.pill(isExp ? "Expenses" : "Income"), fontSize: 10 }}>{e.tipe}</span></td>
              <td style={S.td}>
                {e.gram && <span style={{ fontSize: 12 }}>{fmtNum(parseNum(e.gram))} gr</span>}
                {e.hargaBeli && <span style={{ fontSize: 11, color: C.muted }}> @ Rp {fmtNum(parseNum(e.hargaBeli))}/gr</span>}
                {e.hargaJual && <span style={{ fontSize: 11, color: C.muted }}> @ Rp {fmtNum(parseNum(e.hargaJual))}/gr</span>}
                {e.desc && <span style={{ fontSize: 12, color: C.muted }}>{e.desc}</span>}
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

export function Emas({ appData, setAppData, title = "✨ Portofolio Emas", pKey = "emas", year, month }) {
  const mk = `${year}-${String(month + 1).padStart(2, "0")}`;
  const allSnap = appData.portfolio[pKey + "_snap"] || {};

  const aggregate = useMemo(() => {
    if (allSnap[mk]?.aggregate) return allSnap[mk].aggregate;
    const [ey, em] = mk.split("-").map(Number);
    for (let i = 1; i <= 24; i++) {
      let py = ey, pm = em - i;
      while (pm <= 0) { pm += 12; py--; }
      const pk = `${py}-${String(pm).padStart(2, "0")}`;
      if (allSnap[pk]?.aggregate) return allSnap[pk].aggregate;
    }
    const allE = appData.portfolio[pKey]?.entries || [];
    const totalGram = allE.reduce((s, e) => s + parseNum(e.gram), 0);
    const avgH = totalGram > 0 ? allE.reduce((s, e) => s + parseNum(e.gram) * parseNum(e.hargaBeli), 0) / totalGram : 0;
    return { gram: totalGram, hargaBeli: Math.round(avgH), hargaJual: parseNum(allE[0]?.hargaJual || 0) };
  }, [allSnap, mk, appData.portfolio, pKey]);
  const entries = [{ id: "agg", desc: "Total Emas", ...aggregate }];

  const [form, setForm] = useState({ desc: "", gram: "", hargaBeli: "", hargaJual: "" });
  const [editId, setEditId] = useState(null);

  const updAgg = (newAgg) => setAppData(d => {
    const snap = d.portfolio[pKey + "_snap"] || {};
    return { ...d, portfolio: { ...d.portfolio, [pKey + "_snap"]: { ...snap, [mk]: { ...snap[mk], aggregate: newAgg } } } };
  });

  const updEntry = (id, f, v) => updAgg({ ...aggregate, [f]: v });

  const startEdit = (e) => { setForm({ desc: e.desc || "", gram: e.gram || "", hargaBeli: e.hargaBeli || "", hargaJual: e.hargaJual || "" }); setEditId(e.id); };
  const cancel = () => { setEditId(null); setForm({ desc: "", gram: "", hargaBeli: "", hargaJual: "" }); };
  const save = () => {
    updAgg({ ...aggregate, hargaJual: parseNum(form.hargaJual) });
    setForm({ desc: "", gram: "", hargaBeli: "", hargaJual: "" });
    setEditId(null);
  };

  const calc = (e) => {
    const nilaiSkrg = parseNum(e.gram) * parseNum(e.hargaJual);
    const hargaBeli = parseNum(e.hargaBeli);
    const hargaJual = parseNum(e.hargaJual);
    const pct = hargaBeli > 0 ? ((hargaJual - hargaBeli) / hargaBeli * 100) : 0;
    const untung = nilaiSkrg * (pct / 100);
    return { nilaiSkrg, pct, untung };
  };
  const totG = entries.reduce((s, e) => s + parseNum(e.gram), 0);
  const totNilai = entries.reduce((s, e) => s + calc(e).nilaiSkrg, 0);
  const totUntung = entries.reduce((s, e) => s + calc(e).untung, 0);

  return (
    <div>
      <EmasModalActivity pKey={pKey} year={year} month={month} appData={appData} setAppData={setAppData} />
      <div style={S.card}>
        <h3 style={{ ...S.h3, fontSize: 15, marginBottom: 14 }}>✨ {title}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginBottom: 14, alignItems: "end" }}>
          <div><label style={S.lbl}>Update Harga Jual/gr (Rp)</label>
            <NI value={form.hargaJual || String(aggregate.hargaJual || "")} onChange={v => setForm(f => ({ ...f, hargaJual: v }))} />
          </div>
          <button style={S.btnG} onClick={save}>Update</button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ ...S.tbl, minWidth: 600 }}><thead><tr>
            <th style={S.th}>Deskripsi</th>
            <th style={{ ...S.th, minWidth: 80 }}>Gram</th>
            <th style={{ ...S.th, minWidth: 110 }}>Harga Beli/gr</th>
            <th style={{ ...S.th, minWidth: 110 }}>Harga Jual/gr</th>
            <th style={{ ...S.th, minWidth: 100 }}>% Untung</th>
            <th style={{ ...S.th, minWidth: 120 }}>Nilai Total</th>
            <th></th>
          </tr></thead>
            <tbody>
              {entries.length === 0 && <tr><td colSpan={7} style={{ ...S.td, textAlign: "center", color: "#ccc", padding: 20 }}>Belum ada data emas</td></tr>}
              {entries.map(e => {
                const { nilaiSkrg, pct, untung } = calc(e);
                return <tr key={e.id} style={{ background: editId === e.id ? "#fefce8" : "" }}>
                  <td style={S.td}>{e.desc}</td>
                  <td style={S.td}><NI sm value={e.gram} onChange={v => updEntry(e.id, "gram", v)} style={{ minWidth: 70 }} /></td>
                  <td style={S.td}><NI sm value={e.hargaBeli} onChange={v => updEntry(e.id, "hargaBeli", v)} style={{ minWidth: 100 }} /></td>
                  <td style={S.td}><NI sm value={e.hargaJual} onChange={v => updEntry(e.id, "hargaJual", v)} style={{ minWidth: 100 }} /></td>
                  <td style={{ ...S.td, ...S.vc(pct) }}>{pct.toFixed(2)}% {pct >= 0 ? "▲" : "▼"}</td>
                  <td style={{ ...S.td, fontWeight: 700 }}>Rp {fmtNum(nilaiSkrg)}</td>
                  <td style={S.td}></td>
                </tr>;
              })}
              {entries.length > 0 && <tr style={{ background: "#f9fafb", fontWeight: 700 }}>
                <td style={S.td}>Total</td>
                <td style={S.td}>{fmtNum(totG)} gr</td><td></td><td></td><td></td>
                <td style={S.td}>Rp {fmtNum(totNilai)}</td><td></td>
              </tr>}
            </tbody></table>
        </div>
        {entries.length > 0 && <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 14 }}>
          {[["✨ Nilai Total", totNilai, C.gold], ["📈 Total Keuntungan", totUntung, C.green], ["⚖️ Total Gram", totG, "gram", C.muted]].map(([l, v, sub, c]) => (
            <div key={l} style={{ background: "#fafaf8", borderRadius: 8, padding: "10px 14px", borderLeft: `3px solid ${c || C.gold}` }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>{l}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: c || C.gold }}>{l.includes("Gram") ? fmtNum(v) + " gr" : "Rp " + fmtNum(v)}</div>
            </div>
          ))}
        </div>}
      </div>
    </div>
  );
}
