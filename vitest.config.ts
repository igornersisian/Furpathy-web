import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    // Default is Node for fast pure-logic tests. Component tests opt into
    // jsdom via a `// @vitest-environment jsdom` docblock at the top of
    // the file, or by living under tests/components/ (see setupFiles below).
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    globals: false,
    setupFiles: ["tests/setup.ts"],
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Scope to the code that's actually under test. Pages and components
      // have no tests yet; expand `include` as that changes.
      include: ["lib/**", "i18n/**"],
      exclude: ["**/*.d.ts"],
      // Starter ratchet — just below current numbers so regressions fail CI.
      // Raise as coverage grows.
      thresholds: { lines: 30, statements: 30, functions: 25, branches: 25 },
    },
  },
});
