// DEMO BUILD — storage lokal (localStorage), pengganti Firebase Realtime Database.
// Versi asli menyimpan data per-cabang sebagai JSON string di RTDB. Untuk demo
// publik, data cukup disimpan di browser. Saat pertama dibuka, di-seed dengan
// data dummy (demo-data.js). Semua nominal & nama FIKTIF.
import { migrateData } from "./defaults.js";
import { DEMO_DATA } from "./demo-data.js";

const KEY = "myfinance_demo_v2";

export async function loadData() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrateData(JSON.parse(raw));
  } catch { /* ignore */ }
  return migrateData(DEMO_DATA);
}

export async function saveData(uid, appData) {
  if (!appData) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(appData));
  } catch { /* ignore */ }
}

// Dipakai fitur Import JSON: timpa seluruh state.
export async function overwriteAll(uid, appData) {
  return saveData(uid, appData);
}
