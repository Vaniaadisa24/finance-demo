// DEMO BUILD — tanpa login.
// Versi asli memakai Firebase Auth (email/password, dikunci ke pemilik).
// Untuk demo publik, gerbang auth dilewati: langsung buka app dengan sesi dummy.
export function AuthGate({ children }) {
  return children({ uid: "demo", email: "demo", signOut: () => {}, ownerSet: true });
}
