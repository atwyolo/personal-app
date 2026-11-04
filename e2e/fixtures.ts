import { expect, test as base } from "@playwright/test";

interface ConsoleGuardOptions {
  allowedConsoleErrors: RegExp[];
}

export const test = base.extend<ConsoleGuardOptions & { consoleGuard: void }>({
  allowedConsoleErrors: [[], { option: true }],
  consoleGuard: [
    async ({ page, allowedConsoleErrors }, use) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() !== "error") return;
        const text = message.text();
        if (!allowedConsoleErrors.some((pattern) => pattern.test(text))) errors.push(text);
      });
      page.on("pageerror", (error) => errors.push(error.message));

      await use();

      expect(errors, "console errors on the page").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
