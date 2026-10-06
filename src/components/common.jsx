import { useState, useEffect } from "react";
import { S, C, MN, fmtInp } from "../lib.js";

// ─── NUM INPUT ───
export function NI({ value, onChange, placeholder, sm, style }) {
  const [d, setD] = useState(value ? fmtInp(String(value)) : "");
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (focused) return;
    if (value === "" || value === undefined) { setD(""); return; }
    const formatted = fmtInp(String(value).replace(/[^\d,]/g, "").replace(/^-/, ""));
    const withSign = String(value).startsWith("-") ? "-" + formatted : formatted;
    setD(withSign || "");
  }, [value, focused]);
  return <input
    style={sm ? { ...S.inpSm, ...(style || {}) } : { ...S.inp, ...(style || {}) }}
    value={d}
    placeholder={placeholder || "0"}
    onFocus={() => setFocused(true)}
    onBlur={() => setFocused(false)}
    onChange={e => {
      const raw = e.target.value;
      const isNeg = raw.startsWith("-");
      const r = raw.replace(/[^\d,]/g, "");
      const f = fmtInp(r);
      const final = isNeg && f ? "-" + f : f;
      setD(final);
      onChange(final);
    }} />;
}

// ─── MONTH NAV ───
export function MonthNav({ year, month, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button onClick={() => month === 0 ? onChange(year - 1, 11) : onChange(year, month - 1)} style={S.navBtn}>‹</button>
      <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: C.navy, minWidth: 170, textAlign: "center" }}>{MN[month]} {year}</span>
      <button onClick={() => month === 11 ? onChange(year + 1, 0) : onChange(year, month + 1)} style={S.navBtn}>›</button>
    </div>
  );
}

export function EOMALert({ monthData, setMonthData, year, month, onExport }) {
  const today = new Date();
  if (today.getFullYear() !== year || today.getMonth() !== month || today.getDate() < 25 || monthData.endOfMonthDone) return null;
  return (
    <div style={{ background: "#fffbeb", border: "1.5px solid #fcd34d", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
      <div><span style={{ fontWeight: 700, color: "#92400e" }}>⏰ Akhir Bulan!</span><span style={{ fontSize: 13, color: "#78350f", marginLeft: 8 }}>Lengkapi data {MN[month]} sebelum bulan berganti.</span></div>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={S.btnG} onClick={onExport}>📥 Export</button>
        <button style={S.btnGh} onClick={() => setMonthData(d => ({ ...d, endOfMonthDone: true }))}>✅ Selesai</button>
      </div>
    </div>
  );
}
