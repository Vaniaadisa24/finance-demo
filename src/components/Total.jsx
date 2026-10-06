import { S, C, parseNum, fmtNum } from "../lib.js";
import { sahamTotal, emasTotal } from "../calc.js";

export function Total({ appData }) {
  const P = appData.portfolio;
  const cashMain = (appData.savings.cashEntries || []).reduce((s, e) => e.type === "Income" ? s + parseNum(e.amount) : s - parseNum(e.amount), 0);
  const totalCash = cashMain;

  // Model bersih: modal (saldo bulan terakhir) + nilai saham sekarang, tanpa field dividen.
  const sahamMain = sahamTotal(P, "saham");
  const totalSaham = sahamMain;

  const emasMain = emasTotal(P, "emas");
  const totalEmas = emasMain;

  const grandTotal = totalCash + totalSaham + totalEmas;

  const Section = ({ icon, title, total, items }) => (
    <div style={{ ...S.card, marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ ...S.h3, margin: 0 }}>{icon} {title}</h3>
        <span style={{ fontWeight: 700, fontSize: 16, color: C.navy }}>Rp {fmtNum(total)}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>
        {items.map(([l, v, c]) => (
          <div key={l} style={{ background: "#fafaf8", borderRadius: 8, padding: "10px 14px", borderLeft: `3px solid ${c || C.muted}` }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>{l}</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: c || C.navy }}>Rp {fmtNum(v)}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <Section icon="💵" title="Tabungan Cash (ATM)" total={totalCash} items={[
        ["Tabungan Cash", cashMain, C.green],
      ]} />
      <Section icon="📈" title="Saham" total={totalSaham} items={[
        ["Portofolio Saham", sahamMain, C.blue],
      ]} />
      <Section icon="✨" title="Emas" total={totalEmas} items={[
        ["Portofolio Emas", emasMain, C.gold],
      ]} />
      <div style={{ background: C.navy, borderRadius: 12, padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Grand Total Kekayaan</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, fontWeight: 700, color: C.gold }}>Rp {fmtNum(grandTotal)}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 12 }}>
          {[["💵 Cash", totalCash], ["📈 Saham", totalSaham], ["✨ Emas", totalEmas]].map(([l, v]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{l}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>Rp {fmtNum(v)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
