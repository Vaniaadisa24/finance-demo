// Default state & migrasi bentuk data lama. Disalin persis dari budgeting-final.jsx.
import { DEF_INC } from "./lib.js";

export function defMonth() {
  return {
    planning: {
      incomes: DEF_INC.map((s, i) => ({ id: "inc" + i, source: s, amount: "" })),
      expenseTypes: [
        { id: "et1", name: "Kebutuhan Pribadi", subs: [{ id: "es1", name: "Makan & Minum", plan: "" }, { id: "es2", name: "Transport", plan: "" }] },
        { id: "et3", name: "Saving", subs: [{ id: "es4", name: "Tabungan Rutin", plan: "" }, { id: "es5", name: "Investment", plan: "" }] },
      ],
    },
    daily: [],
    bankBalance: { Cash: "", "Bank A": "", "Bank B": "", "Bank C": "" },
    openingBalances: { Cash: 0, "Bank A": 0, "Bank B": 0, "Bank C": 0 },
    endOfMonthDone: false,
  };
}

export function defApp() {
  return {
    months: {}, snapshots: {},
    savings: {
      targetSavings: [], cashCategories: [], cashEntries: [],
    },
    portfolio: {
      saham: [], saham_snap: {}, saham_activity: {},
      emas: { entries: [] }, emas_snap: {}, emas_activity: {},
    },
  };
}

export function migrateData(old) {
  const base = defApp();
  if (!old) return base;
  const merged = {
    ...base, months: old.months || {}, snapshots: old.snapshots || {},
    savings: {
      ...base.savings,
      targetSavings: old.savings?.targetSavings || [],
      cashCategories: old.savings?.cashCategories || [],
      cashEntries: old.savings?.cashEntries || (old.savings?.cashSavings ? old.savings.cashSavings.map(e => ({ ...e, type: "Income", catId: e.catId || "", desc: e.desc || "", amount: e.amount || "" })) : []),
    },
    portfolio: {
      ...base.portfolio,
      saham: old.portfolio?.saham || [],
      saham_snap: old.portfolio?.saham_snap || {},
      saham_activity: old.portfolio?.saham_activity || {},
      emas: old.portfolio?.emas || { entries: [] },
      emas_snap: old.portfolio?.emas_snap || {},
      emas_activity: old.portfolio?.emas_activity || {},
    },
  };
  const fixEmas = (e) => ({ ...e, hargaJual: e.hargaJual || e.hargaSkrg || e.currentPrice || "", pctUntung: e.pctUntung || "" });
  merged.portfolio.emas.entries = (merged.portfolio.emas.entries || []).map(fixEmas);
  return merged;
}
