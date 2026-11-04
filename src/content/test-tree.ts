import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Test helper: writes `{ "en/profile.md": "…" }` into a fresh temporary folder and returns its path, so every test
 * declares the content files it reads next to its assertions.
 */
export const writeContentTree = (files: Record<string, string>): string => {
  const root = mkdtempSync(path.join(tmpdir(), "content-"));

  for (const [file, text] of Object.entries(files)) {
    const target = path.join(root, file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, text);
  }

  return root;
};
