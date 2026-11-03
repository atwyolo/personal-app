import { act, fireEvent, render, screen } from "@testing-library/react";
import { type AnchorHTMLAttributes, type FC, useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NavigationScope, useNavigationScope } from "./NavigationScope";

// A push resolves when the test says so, as a navigation ends when the server's answer has rendered.
let finishNavigation: () => void = () => {};
const push = vi.fn((href: string, options?: { scroll?: boolean }) => {
  void href;
  void options;
  return new Promise<void>((resolve) => {
    finishNavigation = resolve;
  });
});
const intlPush = vi.fn((href: string, options?: { scroll?: boolean }) => push(`/en${href}`, options));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/shared/lib/i18n/navigation", () => ({ useRouter: () => ({ push: intlPush }) }));

/** Stands for next-intl's `Link`, which renders a plain anchor with the localized href. */
const A: FC<AnchorHTMLAttributes<HTMLAnchorElement>> = (props) => <a {...props} />;

const Scope: FC<{ withTarget?: boolean }> = (props) => {
  const { withTarget } = props;

  return (
    <NavigationScope>
      {withTarget && (
        <h2 id="list-head" tabIndex={-1}>
          Posts
        </h2>
      )}
      <A href="/en/blog?page=2">Page 2</A>
      <A href="/en/blog?page=3" data-scope-scroll="list-head">
        Page 3
      </A>
      <A href="/en/blog/offline-mode-in-react">A post</A>
      <A href="/en">Home</A>
    </NavigationScope>
  );
};

const scope = () => screen.getByText("Page 2").parentElement!;

/** Lets the transition settle: React leaves `isPending` once the pushed promise resolves. */
const finish = async () => {
  await act(async () => {
    finishNavigation();
  });
};

beforeEach(() => {
  window.history.pushState({}, "", "/en/blog");
  push.mockClear();
  intlPush.mockClear();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  window.history.pushState({}, "", "/");
});

describe("NavigationScope", () => {
  it("takes over a click on a link to the same page and pushes it without scrolling", async () => {
    render(<Scope />);

    const event = fireEvent.click(screen.getByText("Page 2"));

    expect(event).toBe(false); // prevented: next/link and the browser stay out of it
    expect(push).toHaveBeenCalledWith("/en/blog?page=2", { scroll: false });
    await finish();
  });

  it("is busy until the navigation ends", async () => {
    render(<Scope />);

    fireEvent.click(screen.getByText("Page 2"));
    expect(scope()).toHaveAttribute("aria-busy", "true");
    expect(scope()).toHaveAttribute("data-pending");

    await finish();
    expect(scope()).not.toHaveAttribute("aria-busy");
    expect(scope()).not.toHaveAttribute("data-pending");
  });

  it("ignores further clicks while a navigation is pending, and prevents them", async () => {
    render(<Scope />);

    fireEvent.click(screen.getByText("Page 2"));
    const second = fireEvent.click(screen.getByText("Page 3"));

    expect(second).toBe(false);
    expect(push).toHaveBeenCalledTimes(1);

    await finish();
    fireEvent.click(screen.getByText("Page 3"));
    expect(push).toHaveBeenCalledTimes(2);
    await finish();
  });

  it.each([
    ["Cmd", { metaKey: true }],
    ["Ctrl", { ctrlKey: true }],
    ["Shift", { shiftKey: true }],
    ["Alt", { altKey: true }],
  ])("leaves a %s-click to the browser", (_, modifier) => {
    render(<Scope />);

    const event = fireEvent.click(screen.getByText("Page 2"), modifier);

    expect(event).toBe(true);
    expect(push).not.toHaveBeenCalled();
    expect(scope()).not.toHaveAttribute("aria-busy");
  });

  it.each(["A post", "Home"])("leaves a link to another page (%s) alone", (name) => {
    render(<Scope />);

    const event = fireEvent.click(screen.getByText(name));

    expect(event).toBe(true);
    expect(push).not.toHaveBeenCalled();
  });

  // Scrolling to the scope's top, not to the target: on phones a sticky panel above the list would cover a target
  // scrolled to the top of the view (WCAG 2.4.11); at the scope's top the panel sits in its own place above the list.
  it("scrolls to its own top and focuses the target of a link that names one, once the navigation ends", async () => {
    render(<Scope withTarget />);
    const scrolled = vi.mocked(Element.prototype.scrollIntoView);

    fireEvent.click(screen.getByText("Page 3"));
    expect(screen.getByRole("heading", { name: "Posts" })).not.toHaveFocus();

    await finish();
    expect(screen.getByRole("heading", { name: "Posts" })).toHaveFocus();
    expect(scrolled.mock.contexts).toEqual([scope()]);
  });

  it("moves the focus to its fallback when the clicked link is gone after the navigation", async () => {
    const { rerender } = render(
      <NavigationScope focusFallback="list-head">
        <h2 id="list-head" tabIndex={-1}>
          Posts
        </h2>
        <A href="/en/blog?tags=React">Remove React</A>
      </NavigationScope>,
    );
    const link = screen.getByText("Remove React");
    link.focus();

    fireEvent.click(link);
    // The server's answer no longer has the link.
    rerender(
      <NavigationScope focusFallback="list-head">
        <h2 id="list-head" tabIndex={-1}>
          Posts
        </h2>
      </NavigationScope>,
    );
    await finish();

    expect(screen.getByRole("heading", { name: "Posts" })).toHaveFocus();
  });

  it("keeps the focus where it was after a link without a target", async () => {
    render(<Scope withTarget />);

    const link = screen.getByText("Page 2");
    link.focus();
    fireEvent.click(link);
    await finish();

    expect(link).toHaveFocus();
  });
});

describe("NavigationScope markers", () => {
  it("marks itself, and marks when it has hydrated", () => {
    render(<Scope />);

    expect(scope()).toHaveAttribute("data-navigation-scope");
    expect(scope()).toHaveAttribute("data-hydrated");
  });
});

describe("useNavigationScope", () => {
  const Picker: FC<{ onReady: (api: ReturnType<typeof useNavigationScope>) => void }> = (props) => {
    const { onReady } = props;
    const api = useNavigationScope();
    useEffect(() => {
      onReady(api);
    });
    return <span data-pending-state={String(api.pending)} />;
  };

  it("navigates to a locale-less href through the locale router, once at a time", async () => {
    let api: ReturnType<typeof useNavigationScope> | undefined;
    render(
      <NavigationScope>
        <Picker onReady={(value) => (api = value)} />
      </NavigationScope>,
    );

    act(() => api!.navigate("/blog?tags=Jest"));
    act(() => api!.navigate("/blog?tags=React"));

    expect(intlPush).toHaveBeenCalledTimes(1);
    expect(intlPush).toHaveBeenCalledWith("/blog?tags=Jest", { scroll: false });
    expect(api!.pending).toBe(true);
    await finish();
    expect(api!.pending).toBe(false);
  });
});
