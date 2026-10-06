import { useState } from "react";
import { S, C, MS, parseNum, fmtNum } from "../lib.js";
import { NI } from "./common.jsx";

export function CashSav({ appData, setAppData }) {
  const cats = appData.savings.cashCategories || [];
  const entries = appData.savings.cashEntries || [];
  const [newCat, setNewCat] = useState("");
  const [form, setForm] = useState({ catId: "", type: "Income", desc: "", amount: "", monthLabel: "" });
  const [editId, setEditId] = useState(null);
  const curYear = new Date().getFullYear();
  const moOpts = MS.map(m => `${m} ${curYear}`);
  const addCat = () => { if (!newCat.trim()) return; setAppData(d => ({ ...d, savings: { ...d.savings, cashCategories: [...(d.savings.cashCategories || []), { id: "cc" + Date.now(), name: newCat }] } })); setNewCat(""); };
  const delCat = (id) => setAppData(d => ({ ...d, savings: { ...d.savings, cashCategories: d.savings.cashCategories.filter(c => c.id !== id), cashEntries: d.savings.cashEntries.filter(e => e.catId !== id) } }));
  const save = () => {
    if (!form.catId || !form.amount) return;
    if (editId) { setAppData(d => ({ ...d, savings: { ...d.savings, cashEntries: d.savings.cashEntries.map(e => e.id === editId ? { ...form, id: editId } : e) } })); setEditId(null); }
    else setAppData(d => ({ ...d, savings: { ...d.savings, cashEntries: [...(d.savings.cashEntries || []), { ...form, id: Date.now() }] } }));
    setForm(f => ({ ...f, desc: "", amount: "", monthLabel: "" }));
  };
  const startEdit = (e) => { setForm({ ...e }); setEditId(e.id); };
  const cancel = () => { setEditId(null); setForm(f => ({ ...f, desc: "", amount: "", monthLabel: "" })); };
  const del = (id) => setAppData(d => ({ ...d, savings: { ...d.savings, cashEntries: d.savings.cashEntries.filter(e => e.id !== id) } }));
  const grand = entries.reduce((s, e) => e.type === "Income" ? s + parseNum(e.amount) : s - parseNum(e.amount), 0);
  return (
    <div>
      <div style={S.card}>
        <h3 style={S.h3}>📂 Kelola Kategori</h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input style={{ ...S.inp, maxWidth: 220 }} value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Nama kategori..." />
          <button style={S.btnG} onClick={addCat}>+ Tambah</button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {cats.map(c => <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 5, background: C.light, padding: "4px 10px", borderRadius: 20, fontSize: 12 }}>
            {c.name}<button style={{ border: "none", background: "none", cursor: "pointer", color: C.red, fontSize: 13, padding: 0 }} onClick={() => delCat(c.id)}>×</button>
          </div>)}
          {cats.length === 0 && <span style={{ fontSize: 12, color: C.muted }}>Belum ada kategori</span>}
        </div>
      </div>
      <div style={S.card}>
        <h3 style={S.h3}>{editId ? "✏️ Edit" : "➕ Tambah"} Entry</h3>
        <div style={{ display: "grid", gridTemplateColumns: "140px 100px 1fr 1fr auto", gap: 10, alignItems: "end" }}>
          <div><label style={S.lbl}>Kategori</label><select style={S.sel} value={form.catId} onChange={e => setForm(f => ({ ...f, catId: e.target.value }))}><option value="">-- Pilih --</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label style={S.lbl}>Jenis</label><select style={S.sel} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value, desc: "", monthLabel: "" }))}>
            <option value="Income">Income</option><option value="Expenses">Expenses</option>
          </select></div>
          <div><label style={S.lbl}>Deskripsi{form.type === "Income" ? " (Bulan)" : ""}</label>
            {form.type === "Income"
              ? <select style={S.sel} value={form.monthLabel} onChange={e => setForm(f => ({ ...f, monthLabel: e.target.value, desc: e.target.value }))}><option value="">-- Bulan --</option>{moOpts.map(m => <option key={m}>{m}</option>)}</select>
              : <input style={S.inp} value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="Deskripsi..." />
            }
          </div>
          <div><label style={S.lbl}>Amount (Rp)</label><NI value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} /></div>
          <div style={{ display: "flex", gap: 6, marginTop: 20 }}>
            <button style={S.btnG} onClick={save}>{editId ? "Simpan" : "Tambah"}</button>
            {editId && <button style={S.btnGh} onClick={cancel}>Batal</button>}
          </div>
        </div>
      </div>
      {cats.map(cat => {
        const rows = entries.filter(e => e.catId === cat.id);
        const tot = rows.reduce((s, e) => e.type === "Income" ? s + parseNum(e.amount) : s - parseNum(e.amount), 0);
        return <div key={cat.id} style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h3 style={{ ...S.h3, margin: 0 }}>📂 {cat.name}</h3>
            <span style={{ fontWeight: 700, ...S.vc(tot) }}>Rp {fmtNum(tot)}</span>
          </div>
          <table style={S.tbl}><thead><tr><th style={S.th}>Jenis</th><th style={S.th}>Deskripsi</th><th style={S.th}>Amount</th><th></th></tr></thead>
            <tbody>
              {rows.map(e => <tr key={e.id} style={{ background: editId === e.id ? "#fefce8" : "" }}>
                <td style={S.td}><span style={S.pill(e.type)}>{e.type}</span></td>
                <td style={S.td}>{e.desc}</td>
                <td style={{ ...S.td, fontWeight: 600, color: e.type === "Income" ? C.green : C.red }}>{e.type === "Income" ? "+" : "−"} Rp {fmtNum(parseNum(e.amount))}</td>
                <td style={S.td}><div style={{ display: "flex", gap: 4 }}>
                  <button style={S.btnGh} onClick={() => startEdit(e)}>✏️</button>
                  <button style={S.btnR} onClick={() => del(e.id)}>×</button>
                </div></td>
              </tr>)}
              {rows.length === 0 && <tr><td colSpan={4} style={{ ...S.td, textAlign: "center", color: "#ccc" }}>Belum ada entry</td></tr>}
            </tbody></table>
        </div>;
      })}
      <div style={{ ...S.card, background: C.navy, textAlign: "center", padding: 18 }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Grand Total Tabungan Cash</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: C.gold }}>Rp {fmtNum(grand)}</div>
      </div>
    </div>
  );
}
