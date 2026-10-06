import { S, C, MS } from "../lib.js";

export function Roadmap({ appData }) {
  const snap = appData.snapshots || {};
  const yr = new Date().getFullYear();
  const data = Array.from({ length: 12 }, (_, i) => {
    const prefix = `${yr}-${String(i + 1).padStart(2, "0")}`;
    const keys = Object.keys(snap).filter(k => k.startsWith(prefix));
    const last = keys.length > 0 ? snap[keys.sort().at(-1)] : null;
    return { m: MS[i], total: last?.total || 0 };
  });
  const maxV = Math.max(...data.map(d => d.total), 1);
  const W = 560, H = 160, PL = 50, PR = 20, PT = 16, PB = 32;
  const xOf = (i) => PL + i * (W - PL - PR) / 11;
  const yOf = (v) => PT + H - (v / maxV) * H;
  return (
    <div style={S.card}>
      <h3 style={{ ...S.h3, fontSize: 15, marginBottom: 6 }}>🗺️ Financial Roadmap {yr}</h3>
      <p style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>Snapshot otomatis setiap Minggu saat app dibuka.</p>
      <svg viewBox={`0 0 ${W} ${H + PB + PT}`} style={{ width: "100%" }}>
        {data.map((_, i) => (
          <g key={i}>
            <line x1={xOf(i)} y1={PT} x2={xOf(i)} y2={PT + H} stroke={C.light} strokeWidth="1" strokeDasharray="3,3" />
            <text x={xOf(i)} y={PT + H + 18} textAnchor="middle" fontSize="10" fill={C.muted}>{data[i].m}</text>
          </g>
        ))}
        {[0, 0.5, 1].map(p => (
          <g key={p}>
            <text x={PL - 5} y={PT + H - (p * H) + 4} textAnchor="end" fontSize="9" fill={C.muted}>{((maxV * p) / 1e6).toFixed(1)}M</text>
            <line x1={PL} y1={PT + H - (p * H)} x2={W - PR} y2={PT + H - (p * H)} stroke={C.light} strokeWidth="0.5" />
          </g>
        ))}
        {data.some(d => d.total > 0) ? (
          <>
            <polyline fill="none" stroke={C.blue} strokeWidth="2.5" strokeLinejoin="round"
              points={data.map((d, i) => d.total > 0 ? `${xOf(i)},${yOf(d.total)}` : null).filter(Boolean).join(" ")} />
            {data.map((d, i) => d.total > 0 && <g key={i}>
              <circle cx={xOf(i)} cy={yOf(d.total)} r="4" fill={C.blue} />
              <text x={xOf(i)} y={yOf(d.total) - 8} textAnchor="middle" fontSize="9" fill={C.blue}>{(d.total / 1e6).toFixed(1)}M</text>
            </g>)}
          </>
        ) : <text x={W / 2} y={PT + H / 2} textAnchor="middle" fontSize="12" fill="#ccc">Snapshot muncul setiap Minggu</text>}
      </svg>
    </div>
  );
}
