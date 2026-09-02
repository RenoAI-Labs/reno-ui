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
      /*
        hls.js never runs in these tests, and could not: it needs Media Source
        Extensions, which jsdom has none of, so `Hls.isSupported()` answers
        false and the player renders an unsupported-format error and nothing
        else. The stub is aliased here rather than mocked per test file because
        the player loads the package with a dynamic `import()` inside an effect
        — on purpose, so a project pays 150 kB only where a video plays — and a
        `vi.mock` registered in a test file does not reach an `import()`
        evaluated from React's scheduler. An alias is applied when Vite
        transforms the file, so it has no such blind spot.
      */
      "hls.js": resolve(import.meta.dirname, "tests/fixtures/hls-stub.ts"),
      "@/lib": resolve(import.meta.dirname, "registry/reno/lib"),
      "@/hooks": resolve(import.meta.dirname, "registry/reno/hooks"),
      "@/components/ui": resolve(import.meta.dirname, "registry/reno/ui"),
      "@/components": resolve(import.meta.dirname, "registry/reno"),
      "@/registry": resolve(import.meta.dirname, "registry"),
      "@": resolve(import.meta.dirname),
    },
  },
});
