import { offlineShell } from "./tooling/offline";
import { uiLanguage } from "./tooling/ui-language";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { githubBase } from "./src/base";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    plugins: [offlineShell(), uiLanguage(), react(), tailwindcss()],
    base: githubBase(
      process.env.GITHUB_REPOSITORY,
      process.env.VITE_BASE_PATH || env.VITE_BASE_PATH,
    ),
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 650,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (id.includes("three")) return "vendor-three";
            if (id.includes("@supabase")) return "vendor-supabase";
            if (id.includes("motion")) return "vendor-motion";
            if (id.includes("lucide-react")) return "vendor-icons";
            if (id.includes("react-router") || id.includes("react-dom") || id.includes("/react/")) {
              return "vendor-react";
            }
          },
        },
      },
    },
  };
});
