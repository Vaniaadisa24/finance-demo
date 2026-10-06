// DEMO DATA — semua nominal, transaksi, dan angka di bawah ADALAH FIKTIF.
// Tidak ada data keuangan asli, nama bank asli, atau saham asli. Nama bank,
// sumber income, dan emiten dibuat generik/placeholder khusus untuk showcase.
// Nominal disimpan sebagai string format Indonesia (titik=ribuan, koma=desimal).

const planningTemplate = () => ({
  incomes: [
    { id: "inc0", source: "Gaji", amount: "8.500.000" },
    { id: "inc1", source: "Freelance", amount: "2.500.000" },
    { id: "inc2", source: "Bonus", amount: "1.200.000" },
    { id: "inc3", source: "Investasi", amount: "" },
    { id: "inc4", source: "Sisa Bulan Lalu", amount: "" },
  ],
  expenseTypes: [
    { id: "et1", name: "Kebutuhan Pribadi", subs: [
      { id: "es1", name: "Makan & Minum", plan: "2.000.000" },
      { id: "es2", name: "Transport", plan: "700.000" },
    ] },
    { id: "et3", name: "Saving", subs: [
      { id: "es4", name: "Tabungan Rutin", plan: "2.000.000" },
      { id: "es5", name: "Investment", plan: "1.500.000" },
    ] },
  ],
});

const blankSync = { sourceFrom: "Cash", sourceTo: "Cash", syncTarget: "", syncCatId: "", syncRef: null, syncMk: null };

export const DEMO_DATA = {
  months: {
    "2026-08": {
      planning: planningTemplate(),
      daily: [],
      bankBalance: { Cash: "", "Bank A": "", "Bank B": "", "Bank C": "" },
      openingBalances: { Cash: 1500000, "Bank A": 12000000, "Bank B": 7000000, "Bank C": 4500000 },
      endOfMonthDone: false,
    },
    "2026-09": {
      planning: planningTemplate(),
      daily: [
        { ...blankSync, id: 1001, date: "2026-09-01", type: "Income", source: "Bank A", jenisId: "inc0", subJenisId: "", desc: "Gaji bulanan", amount: "8.500.000" },
        { ...blankSync, id: 1002, date: "2026-09-03", type: "Expenses", source: "Cash", jenisId: "et1", subJenisId: "es1", desc: "Groceries & makan mingguan", amount: "450.000" },
        { ...blankSync, id: 1003, date: "2026-09-05", type: "Expenses", source: "Bank B", jenisId: "et1", subJenisId: "es2", desc: "Bensin & transport", amount: "300.000" },
        { ...blankSync, id: 1005, date: "2026-09-10", type: "Netral", source: "Cash", sourceFrom: "Bank A", sourceTo: "Cash", jenisId: "", subJenisId: "", desc: "Tarik tunai ATM", amount: "1.000.000" },
        { ...blankSync, id: 1006, date: "2026-09-12", type: "Expenses", source: "Bank B", jenisId: "et1", subJenisId: "es1", desc: "Makan di luar", amount: "220.000" },
      ],
      bankBalance: { Cash: "", "Bank A": "", "Bank B": "", "Bank C": "" },
      openingBalances: { Cash: 2000000, "Bank A": 15000000, "Bank B": 8000000, "Bank C": 5000000 },
      endOfMonthDone: false,
    },
  },

  snapshots: {
    "2026-03-w2": { cash: 20000000, saham: 9500000, emas: 9000000, total: 38500000 },
    "2026-05-w1": { cash: 22000000, saham: 11000000, emas: 9800000, total: 42800000 },
    "2026-07-w3": { cash: 24000000, saham: 12800000, emas: 10500000, total: 47300000 },
    "2026-09-w2": { cash: 26000000, saham: 14710000, emas: 11500000, total: 52210000 },
  },

  savings: {
    targetSavings: [
      { id: "tg1", name: "Dana Darurat", target: "50.000.000", saved: "26.000.000" },
      { id: "tg2", name: "Liburan", target: "10.000.000", saved: "4.500.000" },
    ],
    cashCategories: [
      { id: "cc1", name: "Dana Darurat" },
      { id: "cc2", name: "Liburan" },
    ],
    cashEntries: [
      { type: "Income", catId: "cc1", desc: "Saldo awal tabungan", amount: "20.000.000", date: "2026-01-05" },
      { type: "Income", catId: "cc1", desc: "Sisih gaji bulan lalu", amount: "8.500.000", date: "2026-08-30" },
      { type: "Expenses", catId: "cc2", desc: "DP tiket liburan", amount: "2.500.000", date: "2026-09-05" },
    ],
  },

  portfolio: {
    saham: [
      { id: "s1", emiten: "ABCD", lot: "5", avgPrice: "9.500", currentPrice: "10.200" },
      { id: "s2", emiten: "EFGH", lot: "10", avgPrice: "4.500", currentPrice: "4.800" },
      { id: "s3", emiten: "IJKL", lot: "8", avgPrice: "3.200", currentPrice: "3.050" },
      { id: "s4", emiten: "MNOP", lot: "6", avgPrice: "1.800", currentPrice: "2.100" },
    ],
    saham_snap: {
      "2026-09": [
        { id: "s1", emiten: "ABCD", lot: "5", avgPrice: "9.500", currentPrice: "10.200" },
        { id: "s2", emiten: "EFGH", lot: "10", avgPrice: "4.500", currentPrice: "4.800" },
        { id: "s3", emiten: "IJKL", lot: "8", avgPrice: "3.200", currentPrice: "3.050" },
        { id: "s4", emiten: "MNOP", lot: "6", avgPrice: "1.800", currentPrice: "2.100" },
      ],
    },
    saham_activity: {
      "2026-09": [
        { id: 2001, tipe: "Income Modal", date: "2026-08-02", desc: "Setoran modal awal", amount: "14.000.000", totalAmount: 14000000 },
        { id: 2002, tipe: "Expenses Buy", date: "2026-08-04", emiten: "ABCD", lot: "5", harga: "9.500", brokerFee: "0", amount: "", totalAmount: 4750000 },
        { id: 2003, tipe: "Expenses Buy", date: "2026-08-06", emiten: "EFGH", lot: "10", harga: "4.500", brokerFee: "0", amount: "", totalAmount: 4500000 },
        { id: 2004, tipe: "Expenses Buy", date: "2026-08-08", emiten: "IJKL", lot: "8", harga: "3.200", brokerFee: "0", amount: "", totalAmount: 2560000 },
        { id: 2005, tipe: "Expenses Buy", date: "2026-08-10", emiten: "MNOP", lot: "6", harga: "1.800", brokerFee: "0", amount: "", totalAmount: 1080000 },
        { id: 2006, tipe: "Income Dividen", date: "2026-08-25", desc: "Dividen saham", amount: "150.000", totalAmount: 150000 },
      ],
    },
    emas: { entries: [
      { id: "e1", gram: "10", hargaBeli: "1.000.000", hargaJual: "1.150.000", pctUntung: "" },
    ] },
  },
};
