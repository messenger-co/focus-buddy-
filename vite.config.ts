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
    build: { sourcemap: false, chunkSizeWarningLimit: 650 },
  };
});
