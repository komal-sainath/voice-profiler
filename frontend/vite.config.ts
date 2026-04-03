import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/profiles": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
      "/tasks": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
      "/reminders": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
      "/api-docs": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
