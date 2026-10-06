import { useState } from "react";
import { S, C, parseNum, fmtNum } from "../lib.js";
import { latestSnapList } from "../calc.js";
import { NI } from "./common.jsx";

export function Simulasi({ appData }) {
  const P = appData.portfolio;
  // Pakai snapshot terakhir (bukan master) supaya lot/avg sinkron dengan portofolio.
  const all = [
    ...latestSnapList(P, "saham").map(s => ({ ...s, src: "Portofolio" })),
  ];
  const [sel, setSel] = useState("");
  const [addLot, setAddLot] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [simL, setSimL] = useState("");
  const [simP, setSimP] = useState("");
  const stock = all.find(s => `${s.emiten}|${s.src}` === sel);
  const cL = stock ? parseNum(stock.lot) : 0; const cA = stock ? parseNum(stock.avgPrice) : 0;
  const nL = cL + parseNum(addLot); const nA = nL > 0 ? (cL * cA + parseNum(addLot) * parseNum(addPrice)) / nL : 0;
  const inv = nL * 100 * nA;
  const calcPL = (p) => nL * 100 * p - inv;
  const pct = (p) => nA > 0 ? ((p - nA) / nA * 100).toFixed(2) : 0;
  return (
    <div style={S.card}>
      <h3 style={{ ...S.h3, fontSize: 15, marginBottom: 16 }}>🧮 Simulasi Lot & Average Saham</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginBottom: 20 }}>
        <div><label style={S.lbl}>Emiten</label>
          <select style={S.sel} value={sel} onChange={e => setSel(e.target.value)}>
            <option value="">-- Pilih Emiten --</option>
            {all.map((s, i) => <option key={i} value={`${s.emiten}|${s.src}`}>{s.emiten} ({s.src})</option>)}
          </select>
          {stock && <div style={{ marginTop: 4, fontSize: 11, color: C.muted }}>{fmtNum(cL)} lot @ Rp {fmtNum(cA)}</div>}
        </div>
        <div style={{ background: "#eff6ff", borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>New Average</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.blue }}>Rp {fmtNum(Math.round(nA))}</div>
          <div style={{ fontSize: 11, color: "#93c5fd" }}>{fmtNum(nL)} lot · Rp {fmtNum(inv)}</div>
        </div>
        <div><label style={S.lbl}>Tambah Lot</label><NI value={addLot} onChange={setAddLot} /></div>
        <div><label style={S.lbl}>Buy Price (Rp)</label><NI value={addPrice} onChange={setAddPrice} /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#fff5f5", borderRadius: 10, padding: 18, border: "1px solid #fecaca" }}>
          <h3 style={{ ...S.h3, color: C.red }}>📉 Simulasi Rugi</h3>
          <label style={S.lbl}>Price Target</label><NI value={simL} onChange={setSimL} />
          {parseNum(simL) > 0 && <div style={{ marginTop: 10, display: "grid", gap: 4 }}>
            <div style={{ fontSize: 13 }}>Nilai: <b>Rp {fmtNum(nL * 100 * parseNum(simL))}</b></div>
            <div style={{ fontSize: 14, color: C.red, fontWeight: 700 }}>Rugi: − Rp {fmtNum(Math.abs(calcPL(parseNum(simL))))}</div>
            <div style={{ fontSize: 13, color: C.red }}>% Loss: {pct(parseNum(simL))}%</div>
          </div>}
        </div>
        <div style={{ background: "#f0fdf4", borderRadius: 10, padding: 18, border: "1px solid #bbf7d0" }}>
          <h3 style={{ ...S.h3, color: C.green }}>📈 Simulasi Untung</h3>
          <label style={S.lbl}>Price Target</label><NI value={simP} onChange={setSimP} />
          {parseNum(simP) > 0 && <div style={{ marginTop: 10, display: "grid", gap: 4 }}>
            <div style={{ fontSize: 13 }}>Nilai: <b>Rp {fmtNum(nL * 100 * parseNum(simP))}</b></div>
            <div style={{ fontSize: 14, color: C.green, fontWeight: 700 }}>Untung: + Rp {fmtNum(calcPL(parseNum(simP)))}</div>
            <div style={{ fontSize: 13, color: C.green }}>% Gain: {pct(parseNum(simP))}%</div>
          </div>}
        </div>
      </div>
    </div>
  );
}
