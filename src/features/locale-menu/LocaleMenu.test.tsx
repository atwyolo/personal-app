import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/en.json";
import { LocaleMenu } from "./LocaleMenu";

const replace = vi.hoisted(() => vi.fn());

vi.mock("@/shared/lib/i18n/navigation", () => ({
  usePathname: () => "/blog",
  useRouter: () => ({ replace }),
}));

const renderMenu = () =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <LocaleMenu />
    </NextIntlClientProvider>,
  );

describe("LocaleMenu", () => {
  it("shows the current locale code on the trigger", () => {
    renderMenu();

    expect(screen.getByRole("button", { name: "Language: EN" })).toHaveTextContent("EN");
  });

  it("lists every locale by its native name with the code as a hint", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "Language: EN" }));

    const items = await screen.findAllByRole("menuitemradio");
    expect(items.map((item) => item.textContent)).toEqual([
      "EnglishEN",
      "РусскийRU",
      "PortuguêsPT",
      "EspañolES",
      "DeutschDE",
      "FrançaisFR",
      "日本語JA",
      "PolskiPL",
    ]);
    expect(screen.getByRole("menuitemradio", { name: /English/ })).toHaveAttribute("aria-checked", "true");
  });

  it("opens the same page in the picked locale", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "Language: EN" }));
    await user.click(await screen.findByRole("menuitemradio", { name: /Русский/ }));

    expect(replace).toHaveBeenCalledWith("/blog", { locale: "ru" });
  });
});
