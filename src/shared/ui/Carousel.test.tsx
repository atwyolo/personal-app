import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/en.json";
import ru from "../../../messages/ru.json";
import { mergeMessages } from "@/shared/lib/i18n/merge-messages";
import { Carousel } from "./Carousel";

const slideWidth = 358;
const scrollTo = vi.fn();
const disconnect = vi.fn();
let reportResize: () => void;

class FakeResizeObserver {
  constructor(callback: () => void) {
    reportResize = callback;
  }

  observe = vi.fn();
  disconnect = disconnect;
}

const renderCarousel = (count = 4) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <Carousel label="Experience">
        {Array.from({ length: count }, (_, index) => (
          <article key={index}>Card {index + 1}</article>
        ))}
      </Carousel>
    </NextIntlClientProvider>,
  );

const getTrack = () => screen.getByRole("group", { name: "1 of 4" }).parentElement as HTMLElement;

const scrollTrackTo = (scrollLeft: number, width = slideWidth) => {
  const track = getTrack();
  Object.defineProperty(track, "clientWidth", { configurable: true, value: width });
  Object.defineProperty(track, "scrollLeft", { configurable: true, value: scrollLeft });
  fireEvent.scroll(track);
};

beforeEach(() => {
  vi.spyOn(Element.prototype, "clientWidth", "get").mockReturnValue(slideWidth);
  Element.prototype.scrollTo = scrollTo;
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
});

afterEach(() => {
  scrollTo.mockClear();
  disconnect.mockClear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Carousel", () => {
  it("names the carousel and describes it to a screen reader", () => {
    renderCarousel();

    expect(screen.getByRole("group", { name: "Experience" })).toHaveAttribute("aria-roledescription", "carousel");
  });

  it("describes the carousel and its slides in the page's language", () => {
    render(
      <NextIntlClientProvider locale="ru" messages={mergeMessages(messages, ru)}>
        <Carousel label="Опыт">
          <article>Card 1</article>
          <article>Card 2</article>
        </Carousel>
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("group", { name: "Опыт" })).toHaveAttribute("aria-roledescription", "карусель");
    expect(screen.getByRole("group", { name: "1 из 2" })).toHaveAttribute("aria-roledescription", "слайд");
  });

  it("puts every child on a numbered slide", () => {
    renderCarousel();

    const slide = screen.getByRole("group", { name: "2 of 4" });

    expect(slide).toHaveAttribute("aria-roledescription", "slide");
    expect(within(slide).getByRole("article")).toHaveTextContent("Card 2");
  });

  it("starts on the first slide with only the next arrow active", () => {
    renderCarousel();

    expect(screen.getByText("1 / 4")).toBeVisible();
    expect(screen.getByRole("button", { name: "Previous" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute("aria-disabled", "false");
  });

  it("follows a swipe through the scroll position", () => {
    renderCarousel();

    scrollTrackTo(370);

    expect(screen.getByText("2 / 4")).toBeVisible();
    expect(screen.getByRole("button", { name: "Previous" })).toHaveAttribute("aria-disabled", "false");
  });

  it("picks up a swipe made before the JavaScript arrived", () => {
    vi.spyOn(Element.prototype, "scrollLeft", "get").mockReturnValue(370);

    renderCarousel();

    expect(screen.getByText("2 / 4")).toBeVisible();
  });

  it("turns the next arrow off on the last slide", () => {
    renderCarousel();

    scrollTrackTo(1110);

    expect(screen.getByText("4 / 4")).toBeVisible();
    expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute("aria-disabled", "true");
  });

  it("scrolls one slide forward with the next arrow", async () => {
    const user = userEvent.setup();
    renderCarousel();
    scrollTrackTo(370);

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ left: 740 });
  });

  it("scrolls one slide back with the previous arrow", async () => {
    const user = userEvent.setup();
    renderCarousel();
    scrollTrackTo(370);

    await user.click(screen.getByRole("button", { name: "Previous" }));

    expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ left: 0 });
  });

  it("keeps the arrow focusable but idle at the end", () => {
    renderCarousel();
    scrollTrackTo(1110);
    const next = screen.getByRole("button", { name: "Next" });

    fireEvent.click(next);

    expect(next).toBeEnabled();
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("returns to the same slide when the track gets wider", () => {
    renderCarousel();
    scrollTrackTo(370);

    Object.defineProperty(getTrack(), "clientWidth", { configurable: true, value: 688 });
    reportResize();

    expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ left: 700, behavior: "instant" });
  });

  it("ignores the scroll that a narrower track causes", () => {
    vi.spyOn(Element.prototype, "clientWidth", "get").mockReturnValue(688);
    renderCarousel();
    scrollTrackTo(1400, 688);

    scrollTrackTo(1110);
    expect(screen.getByText("3 / 4")).toBeVisible();

    reportResize();
    expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ left: 740, behavior: "instant" });
  });

  it("leaves the track alone when the browser has already put it on the slide", () => {
    vi.spyOn(Element.prototype, "clientWidth", "get").mockReturnValue(688);
    renderCarousel();
    scrollTrackTo(2100, 688);

    scrollTrackTo(1111);
    reportResize();

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("leaves the track alone when only its height changes", () => {
    renderCarousel();
    scrollTrackTo(370);

    reportResize();

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("stops watching the track when it goes away", () => {
    const { unmount } = renderCarousel();

    unmount();

    expect(disconnect).toHaveBeenCalledOnce();
  });

  it("drops the controls when there is nothing to scroll to", () => {
    renderCarousel(1);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText("1 / 1")).not.toBeInTheDocument();
  });
});
