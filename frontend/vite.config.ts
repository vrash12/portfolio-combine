import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // In development, forward API and media requests to the local Express
    // server so the app uses the same relative URLs as in production.
    proxy: {
      "/api": "http://localhost:5000",
      "/static": "http://localhost:5000",
    },
  },
  build: {
    target: "es2020",
    sourcemap: false,
    cssMinify: "lightningcss",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/axios")) {
            return "http-client";
          }

          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/react-router")
          ) {
            return "react-vendor";
          }
        },
      },
    },
  },
});
