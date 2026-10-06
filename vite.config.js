import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" -> aset dirujuk relatif, jadi build jalan baik di root maupun
// di subpath GitHub Pages (mis. /finance-demo/).
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: { port: 5173 },
});
