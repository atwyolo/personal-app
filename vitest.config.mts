import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Unit and component tests. Async Server Components are not supported by Vitest;
 * cover them with Playwright in e2e/ (Next.js testing guide).
 *
 * No @vitejs/plugin-react / vite-tsconfig-paths: Vite 8 compiles JSX with Oxc using
 * tsconfig's "jsx": "react-jsx", and resolves the `@/*` alias natively.
 */
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      // `server-only` throws outside the react-server condition, which Vitest does not set. The Next.js testing guide
      // maps it to an empty module for Jest; this is the same for Vitest (the package's own react-server entry).
      "server-only": fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
