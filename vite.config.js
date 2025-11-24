import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path"; // 👈 Add this

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // 👈 Add this alias
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "https://backend-tailer-book.vercel.app/api",
        changeOrigin: true,
      },
    },
  },
});
