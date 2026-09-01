import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

/**
 * Smoke-level testing only. Most component behaviour here belongs to Radix,
 * which is tested upstream; chasing coverage on a restyled wrapper buys little.
 * What these tests do protect is the reno-specific contract: components render,
 * variants apply, ARIA survives restyling, and no display string is hardcoded.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
  },
  resolve: {
    // Mirrors tsconfig paths: registry sources import the way a consuming
    // project will, and these aliases make that resolve inside this repo.
    alias: {
      "@/lib": resolve(import.meta.dirname, "registry/reno/lib"),
      "@/hooks": resolve(import.meta.dirname, "registry/reno/hooks"),
      "@/components/ui": resolve(import.meta.dirname, "registry/reno/ui"),
      "@/components": resolve(import.meta.dirname, "registry/reno"),
      "@/registry": resolve(import.meta.dirname, "registry"),
      "@": resolve(import.meta.dirname),
    },
  },
});
