import { useState, useEffect, useCallback, useMemo } from "react";
import { NAV, C, S, BANKS, MN, mkKey, getPrevYM, parseNum } from "./lib.js";
import { defMonth, migrateData } from "./defaults.js";
import { sahamTotal, emasTotal } from "./calc.js";
import { loadData, saveData, overwriteAll } from "./storage.js";
import { AuthGate } from "./auth.jsx";
import { MonthNav, EOMALert } from "./components/common.jsx";
import { Planning } from "./components/Planning.jsx";
import { Daily } from "./components/Daily.jsx";
import { Target } from "./components/Target.jsx";
import { CashSav } from "./components/CashSav.jsx";
import { Saham } from "./components/Saham.jsx";
import { Simulasi } from "./components/Simulasi.jsx";
import { Emas } from "./components/Emas.jsx";
import { Total } from "./components/Total.jsx";
import { Roadmap } from "./components/Roadmap.jsx";
import { ExportModal, doExport } from "./components/ExportModal.jsx";

function FinanceApp({ uid, email, signOut, ownerSet }) {
  const [nav, setNav] = useState("planning");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [appData, setAppDataRaw] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [desktopMode, setDesktopMode] = useState(false);

  useEffect(() => { loadData(uid).then(d => { setAppDataRaw(migrateData(d)); setLoaded(true); }); }, [uid]);

  useEffect(() => {
    if (!appData || !loaded) return;
    setSaving(true);
    const t = setTimeout(() => saveData(uid, appData).then(() => setSaving(false)), 1000);
    return () => clearTimeout(t);
  }, [appData, loaded, uid]);

  // Weekly snapshot
  useEffect(() => {
    if (!appData || !loaded) return;
    const today = new Date();
    if (today.getDay() !== 0) return;
    const wk = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-w${Math.ceil(today.getDate() / 7)}`;
    if (appData.snapshots?.[wk]) return;
    const P = appData.portfolio;
    // Model bersih & konsisten dengan halaman Total Tabungan.
    const cashOf = (arr) => (arr || []).reduce((s, e) => e.type === "Income" ? s + parseNum(e.amount) : s - parseNum(e.amount), 0);
    const cash = cashOf(appData.savings.cashEntries);
    const saham = sahamTotal(P, "saham");
    const emas = emasTotal(P, "emas");
    const total = cash + saham + emas;
    setAppDataRaw(d => ({ ...d, snapshots: { ...d.snapshots, [wk]: { cash, saham, emas, total } } }));
  }, [appData, loaded]);

  const setAppData = useCallback(upd => setAppDataRaw(p => typeof upd === "function" ? upd(p) : upd), []);
  const mk = mkKey(year, month);
  const monthData = useMemo(() => appData?.months?.[mk] || defMonth(), [appData, mk]);
  const setMonthData = useCallback(upd => setAppData(d => ({ ...d, months: { ...d.months, [mk]: typeof upd === "function" ? upd(d.months?.[mk] || defMonth()) : upd } })), [mk, setAppData]);

  const prevYM = useMemo(() => getPrevYM(year, month), [year, month]);
  const prevMD = useMemo(() => appData?.months?.[mkKey(prevYM.y, prevYM.m)] || null, [appData, prevYM]);

  // Opening balance bulan ini = running balance akhir bulan lalu
  useEffect(() => {
    if (!appData || !loaded || !prevMD) return;
    const po = prevMD.openingBalances || {};
    const pn = {}; BANKS.forEach(b => { pn[b] = po[b] || 0; });
    (prevMD.daily || []).forEach(e => {
      const a = parseNum(e.amount);
      if (e.type === "Expenses") pn[e.source] -= a;
      else if (e.type === "Income") pn[e.source] += a;
      else if (e.type === "Netral") { if (e.sourceFrom) pn[e.sourceFrom] -= a; if (e.sourceTo) pn[e.sourceTo] += a; }
      else if (e.type === "Reimburse") pn[e.source] += a;
    });
    setMonthData(d => {
      const cur = d.openingBalances || {};
      if (BANKS.every(b => Math.round(cur[b] || 0) === Math.round(pn[b]))) return d;
      return { ...d, openingBalances: { Cash: pn["Cash"], "Bank A": pn["Bank A"], "Bank B": pn["Bank B"], "Bank C": pn["Bank C"] } };
    });
  }, [mk, prevMD, loaded]);

  const needsNav = ["planning", "daily"].includes(nav);
  const [exportModal, setExportModal] = useState(null);
  const handleExport = () => {
    const dailyActMap = {};
    (monthData.daily || []).forEach(e => { if (e.type === "Expenses" && e.subJenisId) dailyActMap[e.subJenisId] = (dailyActMap[e.subJenisId] || 0) + parseNum(e.amount); });
    doExport(appData, year, month, monthData, setExportModal, {
      daily: monthData.daily || [],
      expTypes: monthData.planning?.expenseTypes || [],
      planning: monthData.planning,
      dailyAct: dailyActMap,
      saham: appData.portfolio?.saham || [],
    });
  };

  if (!loaded) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: C.bg, fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 40, marginBottom: 12 }}>💰</div><div style={{ color: C.muted, fontSize: 14 }}>Memuat data...</div></div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans',sans-serif", color: C.navy, zoom: desktopMode ? "0.65" : "1", transformOrigin: "top left" }}>
      {/* SIDEBAR */}
      <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: sidebarOpen ? 220 : 0, background: C.navy, zIndex: 100, display: "flex", flexDirection: "column", overflow: "hidden", transition: "width 0.25s ease" }}>
        <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)", minWidth: 220 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", color: C.gold, fontSize: 15, fontWeight: 700, marginBottom: 8 }}>💎 My Finance</div>
          <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
            <button onClick={() => setDesktopMode(false)} style={{ flex: 1, padding: "5px 4px", background: !desktopMode ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.06)", color: !desktopMode ? "#d4af37" : "rgba(255,255,255,0.5)", border: `1px solid ${!desktopMode ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius: 5, fontSize: 10, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: !desktopMode ? 700 : 400 }}>📱 Mobile</button>
            <button onClick={() => setDesktopMode(true)} style={{ flex: 1, padding: "5px 4px", background: desktopMode ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.06)", color: desktopMode ? "#d4af37" : "rgba(255,255,255,0.5)", border: `1px solid ${desktopMode ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius: 5, fontSize: 10, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: desktopMode ? 700 : 400 }}>🖥️ Desktop</button>
          </div>
          <button style={{ width: "100%", padding: "6px 8px", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, fontSize: 11, cursor: "pointer", textAlign: "center", marginBottom: 6, fontFamily: "'DM Sans',sans-serif" }} onClick={handleExport}>📥 Export PDF & JSON</button>
          <label style={{ display: "block", width: "100%", padding: "6px 8px", background: "rgba(212,175,55,0.15)", color: "#d4af37", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 6, fontSize: 11, cursor: "pointer", textAlign: "center", boxSizing: "border-box", fontFamily: "'DM Sans',sans-serif" }}>
            📂 Import JSON
            <input type="file" accept=".json" style={{ display: "none" }} onChange={async e => {
              const file = e.target.files[0]; if (!file) return;
              const reader = new FileReader();
              reader.onload = async ev => { try { const data = JSON.parse(ev.target.result); const m = migrateData(data); setAppDataRaw(m); await overwriteAll(uid, m); alert("✅ Data berhasil diimport!"); } catch (err) { alert("❌ Gagal: " + err.message); } };
              reader.readAsText(file); e.target.value = "";
            }} />
          </label>
        </div>
        <div style={{ flex: 1, overflowY: "auto", paddingTop: 4, minWidth: 220 }}>
          {NAV.map(n => <button key={n.id} style={S.sideItem(nav === n.id)} onClick={() => setNav(n.id)}>{n.label}</button>)}
        </div>
        <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", minWidth: 220 }}>
          <div style={{ fontSize: 11, color: saving ? "#d4af37" : "rgba(255,255,255,0.25)", marginBottom: 6 }}>{saving ? "⏳ Menyimpan..." : "✅ Tersimpan"}</div>
          {!ownerSet && <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginBottom: 6, wordBreak: "break-all" }}>UID: {uid}</div>}
          <button onClick={signOut} style={{ width: "100%", padding: "5px", background: "transparent", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 5, fontSize: 10, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Keluar ({email})</button>
        </div>
      </div>

      {/* TOGGLE SIDEBAR */}
      <button onClick={() => setSidebarOpen(o => !o)} style={{ position: "fixed", top: 14, left: sidebarOpen ? 228 : 10, zIndex: 200, background: C.navy, color: "#fff", border: "none", borderRadius: 7, padding: "6px 10px", cursor: "pointer", fontSize: 14, transition: "left 0.25s ease", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
        {sidebarOpen ? "◀" : "▶"}
      </button>

      {/* MAIN */}
      <div style={{ marginLeft: sidebarOpen ? 220 : 0, padding: desktopMode ? "14px 18px" : "22px 16px", minHeight: "100vh", transition: "margin-left 0.25s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingLeft: sidebarOpen ? 0 : 36, flexWrap: "wrap", gap: 8 }}>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: desktopMode ? 17 : 21, fontWeight: 700, color: C.navy, margin: 0 }}>{NAV.find(n => n.id === nav)?.label}</h1>
          {needsNav && <MonthNav year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />}
        </div>
        <ExportModal modal={exportModal} onClose={() => setExportModal(null)} />
        {needsNav && <EOMALert monthData={monthData} setMonthData={setMonthData} year={year} month={month} onExport={handleExport} />}

        {nav === "planning" && <Planning monthData={monthData} setMonthData={setMonthData} prevMonthData={prevMD} />}
        {nav === "daily" && <Daily monthData={monthData} setMonthData={setMonthData} appData={appData} setAppData={setAppData} year={year} month={month} />}
        {nav === "savings-target" && <Target appData={appData} setAppData={setAppData} />}
        {nav === "savings-cash" && <CashSav appData={appData} setAppData={setAppData} />}
        {nav === "portfolio-saham" && <Saham appData={appData} setAppData={setAppData} year={year} month={month} />}
        {nav === "simulator" && <Simulasi appData={appData} />}
        {nav === "portfolio-emas" && <Emas appData={appData} setAppData={setAppData} year={year} month={month} />}
        {nav === "total" && <Total appData={appData} />}
        {nav === "roadmap" && <Roadmap appData={appData} />}      </div>
    </div>
  );
}

export default function App() {
  return <AuthGate>{(session) => <FinanceApp {...session} />}</AuthGate>;
}
