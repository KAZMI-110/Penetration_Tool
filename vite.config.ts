import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    tanstackStart(),
    TanStackRouterVite(),
    react(),
    tsconfigPaths(),
    cloudflare({
      viteEnvironment: {
        name: "ssr"
      }
    })
  ],
  build: {
    outDir: "dist",
  },
});