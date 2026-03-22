import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Auth Service → port 5001
      "/api/Auth": {
        target: "http://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
      "/api/Users": {
        target: "http://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
      "/api/Settings": {
        target: "http://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
      // Building & Flat Service → port 5002
      "/api/Buildings": {
        target: "http://localhost:5002",
        changeOrigin: true,
        secure: false,
      },
      "/api/Flats": {
        target: "http://localhost:5002",
        changeOrigin: true,
        secure: false,
      },
      "/api/Gallery": {
        target: "http://localhost:5002",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
