import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Server modules import "server-only", which throws outside Next.js; tests render them directly.
      "server-only": fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url)),
    },
  },
  esbuild: { jsx: "automatic" },
  test: { include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"] },
});
