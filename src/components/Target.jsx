import { useState } from "react";
import { S, C, parseNum, fmtNum } from "../lib.js";
import { NI } from "./common.jsx";

export function Target({ appData, setAppData }) {
  const targets = appData.savings.targetSavings || [];
  const [form, setForm] = useState({ desc: "", start: "", end: "", totalTarget: "" });
  const [editId, setEditId] = useState(null);

  const getDur = (t) => t.start && t.end ? Math.max(1, Math.round((new Date(t.end) - new Date(t.start)) / (1000 * 60 * 60 * 24 * 30.44))) : 1;

  const save = () => {
    if (!form.desc) return;
    if (editId) {
      setAppData(d => ({ ...d, savings: { ...d.savings, targetSavings: d.savings.targetSavings.map(r => r.id === editId ? { ...form, id: editId } : r) } }));
      setEditId(null);
    } else {
      setAppData(d => ({ ...d, savings: { ...d.savings, targetSavings: [...(d.savings.targetSavings || []), { ...form, id: Date.now() }] } }));
    }
    setForm({ desc: "", start: "", end: "", totalTarget: "" });
  };
  const startEdit = (t) => { setForm({ desc: t.desc || "", start: t.start || "", end: t.end || "", totalTarget: t.totalTarget || (t.monthly && "") || "" }); setEditId(t.id); };
  const cancel = () => { setEditId(null); setForm({ desc: "", start: "", end: "", totalTarget: "" }); };
  const del = (id) => setAppData(d => ({ ...d, savings: { ...d.savings, targetSavings: d.savings.targetSavings.filter(r => r.id !== id) } }));

  return (
    <div style={S.card}>
      <h3 style={{ ...S.h3, fontSize: 15, marginBottom: 16 }}>🎯 Target Tabungan Per Tahun</h3>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 10, marginBottom: 16, alignItems: "end" }}>
        <div><label style={S.lbl}>Deskripsi</label><input style={S.inp} value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="Emergency fund..." /></div>
        <div><label style={S.lbl}>Mulai</label><input type="date" style={S.inp} value={form.start} onChange={e => setForm(f => ({ ...f, start: e.target.value }))} /></div>
        <div><label style={S.lbl}>Berakhir</label><input type="date" style={S.inp} value={form.end} onChange={e => setForm(f => ({ ...f, end: e.target.value }))} /></div>
        <div><label style={S.lbl}>Total Target (Rp)</label><NI value={form.totalTarget} onChange={v => setForm(f => ({ ...f, totalTarget: v }))} /></div>
        <div style={{ display: "flex", gap: 6, marginTop: 20 }}>
          <button style={S.btnG} onClick={save}>{editId ? "Simpan" : "Tambah"}</button>
          {editId && <button style={S.btnGh} onClick={cancel}>Batal</button>}
        </div>
      </div>
      <table style={S.tbl}><thead><tr>
        <th style={S.th}>Deskripsi</th><th style={S.th}>Mulai</th><th style={S.th}>Berakhir</th>
        <th style={S.th}>Durasi</th><th style={S.th}>Total Target</th><th style={S.th}>Per Bulan</th><th></th>
      </tr></thead>
        <tbody>
          {targets.length === 0 && <tr><td colSpan={7} style={{ ...S.td, textAlign: "center", color: "#ccc", padding: 20 }}>Belum ada target</td></tr>}
          {targets.map(t => {
            const dur = getDur(t);
            const perBulan = parseNum(t.totalTarget) / dur;
            return <tr key={t.id} style={{ background: editId === t.id ? "#fefce8" : "" }}>
              <td style={S.td}>{t.desc}</td>
              <td style={S.td}>{t.start}</td>
              <td style={S.td}>{t.end}</td>
              <td style={S.td}>{dur} bln</td>
              <td style={{ ...S.td, fontWeight: 700, color: C.green }}>Rp {fmtNum(parseNum(t.totalTarget))}</td>
              <td style={{ ...S.td, color: C.blue }}>Rp {fmtNum(Math.round(perBulan))}</td>
              <td style={S.td}><div style={{ display: "flex", gap: 4 }}>
                <button style={S.btnGh} onClick={() => startEdit(t)}>✏️</button>
                <button style={S.btnR} onClick={() => del(t.id)}>×</button>
              </div></td>
            </tr>;
          })}
        </tbody></table>
    </div>
  );
}
