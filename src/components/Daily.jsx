import { useState, useMemo } from "react";
import { S, C, BANKS, MN, parseNum, fmtNum } from "../lib.js";
import { defMonth } from "../defaults.js";
import { addSyncedEntry, removeSyncedEntry, SYNC_OPTIONS } from "../sync.js";
import { NI } from "./common.jsx";

export function Daily({ monthData, setMonthData, appData, setAppData, year, month }) {
  const mk = `${year}-${String(month + 1).padStart(2, "0")}`;
  const blank = { date: "", type: "Expenses", source: "Cash", sourceFrom: "Cash", sourceTo: "Cash", jenisId: "", subJenisId: "", desc: "", amount: "", syncTarget: "", syncCatId: "" };
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const daily = monthData.daily || [];
  const expTypes = monthData.planning?.expenseTypes || [];
  const incSources = monthData.planning?.incomes || [];
  const opening = monthData.openingBalances || { Cash: 0, "Bank A": 0, "Bank B": 0, "Bank C": 0 };

  const selJenis = expTypes.find(t => t.id === form.jenisId);
  const cats = appData.savings.cashCategories || [];
  // Auto-sync kini EKSPLISIT: tersedia untuk transaksi Expenses, tak tergantung nama sub-jenis.
  const showSync = form.type === "Expenses";

  const netTx = useMemo(() => {
    const t = {}; BANKS.forEach(b => { t[b] = 0; });
    daily.forEach(e => {
      const a = parseNum(e.amount);
      if (e.type === "Expenses") t[e.source] -= a;
      else if (e.type === "Income") t[e.source] += a;
      else if (e.type === "Reimburse") t[e.source] += a;
      else if (e.type === "Netral") {
        if (e.sourceFrom) t[e.sourceFrom] -= a;
        if (e.sourceTo) t[e.sourceTo] += a;
      }
    });
    return t;
  }, [daily]);
  const runBal = useMemo(() => { const t = {}; BANKS.forEach(b => { t[b] = (opening[b] || 0) + netTx[b]; }); return t; }, [opening, netTx]);

  const save = () => {
    if (!form.desc || !form.amount) return;
    setAppData(d => {
      let nd = d;
      // Reverse sync lama jika sedang edit
      if (editId) {
        const old = (nd.months[mk]?.daily || []).find(e => e.id === editId);
        if (old && old.syncRef != null) nd = removeSyncedEntry(nd, old);
      }
      let entry = { ...form, id: editId || Date.now(), syncRef: null, syncMk: null };
      // Terapkan sync baru (hanya untuk Expenses + target dipilih)
      if (entry.type === "Expenses" && entry.syncTarget) {
        const r = addSyncedEntry(nd, entry, year, month);
        nd = r.d; entry.syncRef = r.syncRef; entry.syncMk = r.syncMk;
      } else {
        entry.syncTarget = ""; entry.syncCatId = "";
      }
      const curDaily = (nd.months[mk] || defMonth()).daily || [];
      const newDaily = editId ? curDaily.map(e => e.id === editId ? entry : e) : [...curDaily, entry];
      return { ...nd, months: { ...nd.months, [mk]: { ...(nd.months[mk] || defMonth()), daily: newDaily } } };
    });
    setEditId(null);
    setForm(blank);
  };
  const startEdit = (e) => { setForm({ ...blank, ...e }); setEditId(e.id); };
  const cancel = () => { setEditId(null); setForm(blank); };
  const del = (id) => setAppData(d => {
    const old = (d.months[mk]?.daily || []).find(e => e.id === id);
    let nd = (old && old.syncRef != null) ? removeSyncedEntry(d, old) : d;
    const newDaily = (nd.months[mk]?.daily || []).filter(e => e.id !== id);
    return { ...nd, months: { ...nd.months, [mk]: { ...(nd.months[mk] || defMonth()), daily: newDaily } } };
  });

  const cashSav = (appData.savings.cashEntries || []).reduce((s, e) => e.type === "Income" ? s + parseNum(e.amount) : s - parseNum(e.amount), 0);
  const validasi = { "Cash": { exp: runBal["Cash"], note: "Input cash = saldo berjalan" }, "Bank A": { exp: runBal["Bank A"] + cashSav, note: "Input − Tabungan Cash = saldo berjalan" }, "Bank B": { exp: runBal["Bank B"], note: "Input = saldo berjalan" }, "Bank C": { exp: runBal["Bank C"], note: "Input = saldo berjalan" } };

  return (
    <div>
      <div style={{ ...S.card, background: "#f0f9ff", border: "1px solid #bae6fd", padding: "12px 18px" }}>
        <h3 style={{ ...S.h3, marginBottom: 8 }}>🏦 Saldo Awal Bulan</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {BANKS.map(b => <div key={b} style={{ textAlign: "center" }}><div style={S.lbl}>{b}</div><div style={{ fontSize: 15, fontWeight: 700, color: C.blue }}>Rp {fmtNum(opening[b] || 0)}</div></div>)}
        </div>
      </div>

      <div style={S.card}>
        <h3 style={S.h3}>{editId ? "✏️ Edit Transaksi" : "➕ Tambah Transaksi"}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "120px 120px 1fr", gap: 8, marginBottom: 8 }}>
          <div><label style={S.lbl}>Tanggal</label><input type="date" style={S.inp} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
          <div><label style={S.lbl}>Tipe</label>
            <select style={S.sel} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value, jenisId: "", subJenisId: "", syncTarget: "", syncCatId: "", source: "Cash" }))}>
              {["Expenses", "Income", "Netral", "Reimburse"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          {form.type === "Netral" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div><label style={S.lbl}>Dari</label>
                <select style={S.sel} value={form.sourceFrom} onChange={e => setForm(f => ({ ...f, sourceFrom: e.target.value }))}>
                  {BANKS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div><label style={S.lbl}>Ke</label>
                <select style={S.sel} value={form.sourceTo} onChange={e => setForm(f => ({ ...f, sourceTo: e.target.value }))}>
                  {BANKS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div><label style={S.lbl}>Source</label>
              <select style={S.sel} value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                {BANKS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          )}
        </div>
        {form.type !== "Netral" && <div style={{ display: "grid", gridTemplateColumns: (form.type === "Expenses" || form.type === "Reimburse") ? "1fr 1fr" : "1fr", gap: 8, marginBottom: 8 }}>
          <div><label style={S.lbl}>{form.type === "Income" ? "Source Income" : "Jenis"}</label>
            {form.type === "Income"
              ? <select style={S.sel} value={form.jenisId} onChange={e => setForm(f => ({ ...f, jenisId: e.target.value }))}>
                <option value="">-- Pilih Source --</option>
                {incSources.map(r => <option key={r.id || r.source} value={r.id || r.source}>{r.source}</option>)}
              </select>
              : <select style={S.sel} value={form.jenisId} onChange={e => setForm(f => ({ ...f, jenisId: e.target.value, subJenisId: "" }))}>
                <option value="">-- Jenis --</option>
                {expTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                <option value="_other">Lainnya</option>
              </select>
            }
          </div>
          {(form.type === "Expenses" || form.type === "Reimburse") && <div><label style={S.lbl}>Sub-jenis{form.type === "Reimburse" ? " (yang dikurangi)" : ""}</label>
            <select style={S.sel} value={form.subJenisId} onChange={e => setForm(f => ({ ...f, subJenisId: e.target.value }))} disabled={!selJenis}>
              <option value="">-- Sub --</option>
              {selJenis?.subs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>}
        </div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 150px", gap: 8, marginBottom: 8 }}>
          <div><label style={S.lbl}>Deskripsi</label>
            <textarea style={{ ...S.inp, resize: "none", height: 36, lineHeight: "20px" }} value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="Detail transaksi..." />
          </div>
          <div><label style={S.lbl}>Amount (Rp)</label><NI value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} /></div>
        </div>
        {showSync && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 12, marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.green, marginBottom: 8 }}>🔄 Auto-sync ke tabungan/portofolio (opsional)</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>
              <div><label style={S.lbl}>Sync ke</label>
                <select style={S.sel} value={form.syncTarget} onChange={e => setForm(f => ({ ...f, syncTarget: e.target.value, syncCatId: "" }))}>
                  <option value="">-- Tidak sync --</option>
                  {SYNC_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
              {form.syncTarget === "cash" && (
                <div><label style={S.lbl}>Kategori Tabungan Cash</label>
                  <select style={S.sel} value={form.syncCatId} onChange={e => setForm(f => ({ ...f, syncCatId: e.target.value }))}>
                    <option value="">-- Pilih --</option>
                    {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            {form.syncTarget && <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Akan otomatis tercatat sebagai Income Modal / tabungan di tujuan. Kalau transaksi ini diedit/dihapus, entri sync-nya ikut menyesuaikan.</div>}
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button style={S.btnG} onClick={save}>{editId ? "Simpan" : "Tambah"}</button>
          {editId && <button style={S.btnGh} onClick={cancel}>Batal</button>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
        {BANKS.map(b => <div key={b} style={{ ...S.card, marginBottom: 0, textAlign: "center", padding: "12px 8px" }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>{b}</div>
          <div style={{ fontSize: 14, fontWeight: 700, ...S.vc(runBal[b]) }}>Rp {fmtNum(runBal[b])}</div>
          <div style={{ fontSize: 10, color: C.muted }}>Saldo berjalan</div>
        </div>)}
      </div>

      <div style={S.card}>
        <h3 style={S.h3}>📋 Transaksi {MN[month]} {year}</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={S.tbl}><thead><tr>
            <th style={S.th}>Tgl</th><th style={S.th}>Tipe</th>
            <th style={S.th}>Source</th><th style={S.th}>Jenis/Sub</th>
            <th style={{ ...S.th, minWidth: 140 }}>Deskripsi</th>
            <th style={S.th}>Amount</th><th style={S.th}>Sync</th><th style={S.th}></th>
          </tr></thead>
            <tbody>
              {daily.length === 0 && <tr><td colSpan={8} style={{ ...S.td, textAlign: "center", color: "#ccc", padding: 24 }}>Belum ada transaksi</td></tr>}
              {[...daily].sort((a, b) => a.date > b.date ? 1 : -1).map(e => {
                const jen = expTypes.find(t => t.id === e.jenisId);
                const sub = jen?.subs.find(s => s.id === e.subJenisId);
                const incSrc = incSources.find(r => (r.id || r.source) === e.jenisId);
                return <tr key={e.id} style={{ background: editId === e.id ? "#fefce8" : "" }}>
                  <td style={S.td}>{e.date || "—"}</td>
                  <td style={S.td}><span style={S.pill(e.type)}>{e.type}</span></td>
                  <td style={S.td}>
                    {e.type === "Netral"
                      ? <span style={{ fontSize: 11 }}>{e.sourceFrom}→{e.sourceTo}</span>
                      : <span style={{ fontSize: 11, background: C.light, padding: "2px 6px", borderRadius: 5 }}>{e.source}</span>}
                  </td>
                  <td style={S.td}>
                    {e.type === "Income" && incSrc && <span style={{ fontSize: 12, fontWeight: 600 }}>{incSrc.source}</span>}
                    {e.type === "Expenses" && jen && <div style={{ fontSize: 10, color: C.muted }}>{jen.name}</div>}
                    {e.type === "Expenses" && sub && <div style={{ fontWeight: 600, fontSize: 12 }}>{sub.name}</div>}
                  </td>
                  <td style={{ ...S.td, maxWidth: 180, wordBreak: "break-word" }}>{e.desc}</td>
                  <td style={{ ...S.td, fontWeight: 600, color: e.type === "Expenses" ? C.red : e.type === "Income" ? C.green : e.type === "Reimburse" ? "#854d0e" : C.blue, whiteSpace: "nowrap" }}>
                    {e.type === "Expenses" ? "−" : e.type === "Income" ? "+" : e.type === "Reimburse" ? "↩" : "⇄"} Rp {fmtNum(parseNum(e.amount))}
                  </td>
                  <td style={S.td}>{e.syncTarget ? <span style={{ fontSize: 10, background: "#dcfce7", color: C.green, padding: "2px 6px", borderRadius: 5 }}>✅</span> : <span style={{ fontSize: 10, color: "#ccc" }}>—</span>}</td>
                  <td style={S.td}><div style={{ display: "flex", gap: 3 }}>
                    <button style={S.btnGh} onClick={() => startEdit(e)}>✏️</button>
                    <button style={S.btnR} onClick={() => del(e.id)}>×</button>
                  </div></td>
                </tr>;
              })}
            </tbody></table>
        </div>
      </div>

      <div style={S.card}>
        <h3 style={S.h3}>✅ Validasi Saldo Rekening</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
          {BANKS.map(b => {
            const v = monthData.bankBalance?.[b] || ""; const vn = parseNum(v); const exp = validasi[b].exp; const ok = v === "" || Math.abs(vn - exp) < 1000;
            return <div key={b} style={{ background: "#fafaf8", borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{b}</div>
              <label style={S.lbl}>Input Saldo Aktual (Rp)</label>
              <NI value={v} onChange={val => setMonthData(d => ({ ...d, bankBalance: { ...d.bankBalance, [b]: val } }))} />
              <div style={{ marginTop: 4, fontSize: 11, color: C.muted }}>{validasi[b].note}</div>
              <div style={{ fontSize: 11, color: C.muted }}>Expected: Rp {fmtNum(exp)}</div>
              {v && <div style={{ marginTop: 5, padding: "4px 8px", borderRadius: 6, background: ok ? "#f0fdf4" : "#fff5f5", fontSize: 12, fontWeight: 600 }}>{ok ? "✅ Sesuai" : "⚠️ Selisih Rp " + fmtNum(Math.abs(vn - exp))}</div>}
            </div>;
          })}
        </div>
      </div>
    </div>
  );
}
