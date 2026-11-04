import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

const architecture = {
  files: ["src/**/*.{ts,tsx}"],
  plugins: { boundaries },
  settings: {
    "boundaries/elements": [
      { type: "app", pattern: "src/app", partialMatch: false },
      { type: "view", pattern: "src/views/*", partialMatch: false, capture: ["slice"] },
      { type: "widget", pattern: "src/widgets/*", partialMatch: false, capture: ["slice"] },
      { type: "feature", pattern: "src/features/*", partialMatch: false, capture: ["slice"] },
      { type: "shadcn", pattern: "src/shared/shadcn", partialMatch: false },
      { type: "shared", pattern: "src/shared/*", partialMatch: false, capture: ["segment"] },
      { type: "content", pattern: "src/content", partialMatch: false },
    ],
    "boundaries/files": [
      { category: "proxy", pattern: "src/proxy.ts" },
    ],
  },
  rules: {
    "boundaries/no-unknown-files": "error",
    "boundaries/dependencies": [
      "error",
      {
        default: "disallow",
        checkAllOrigins: true,
        policies: [
          { allow: { to: { module: { origin: ["external", "core"] } } } },
          {
            from: { element: { type: "!shadcn" } },
            disallow: { to: { module: { source: "@base-ui/**" } } },
          },

          {
            from: { file: { categories: "proxy" } },
            allow: { to: { element: { type: "shared" } } },
          },
          {
            from: { element: { type: "app" } },
            allow: [
              { to: { element: { type: "view", fileInternalPath: "*" } } },
              { to: { element: { type: "shared" } } },
            ],
          },
          {
            from: { element: { type: "view" } },
            allow: [
              { to: { element: { types: { anyOf: ["widget", "feature"] }, fileInternalPath: "*" } } },
              { to: { element: { types: { anyOf: ["shared", "content"] } } } },
            ],
          },
          {
            from: { element: { type: "widget" } },
            allow: [
              { to: { element: { type: "feature", fileInternalPath: "*" } } },
              { to: { element: { types: { anyOf: ["shared", "content"] } } } },
            ],
          },
          {
            from: { element: { type: "feature" } },
            allow: [
              { to: { element: { type: "shared" } } },
              { to: { element: { type: "content" } }, dependency: { kind: "type" } },
            ],
          },
          {
            from: { element: { type: "shared", captured: { segment: "ui" } } },
            allow: { to: { element: { type: "shadcn" } } },
          },
          {
            from: { element: { types: { anyOf: ["shared", "shadcn", "content"] } } },
            allow: { to: { element: { type: "shared", captured: { segment: "lib" } } } },
          },
        ],
      },
    ],
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  architecture,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
