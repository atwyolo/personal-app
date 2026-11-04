import { render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import { Link } from "./Link";

vi.mock("@/shared/lib/i18n/navigation", () => ({
  Link: (props: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => {
    const { prefetch, ...rest } = props;
    return <a data-router-link data-prefetch={prefetch === undefined ? undefined : String(prefetch)} {...rest} />;
  },
}));

describe("Link", () => {
  it.each(["/about", "/about#glovo", "#contacts"])("sends the internal %s through the router", (href) => {
    render(<Link href={href}>Text</Link>);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("data-router-link");
    expect(link).toHaveAttribute("href", href);
    expect(link).not.toHaveAttribute("target");
  });

  it.each(["https://github.com/a", "HTTP://example.com", "//example.com/a"])(
    "renders %s as a plain anchor in a new tab",
    (href) => {
      render(<Link href={href}>Text</Link>);

      const link = screen.getByRole("link");
      expect(link).not.toHaveAttribute("data-router-link");
      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    },
  );

  it.each(["mailto:a@b.c", "tel:+15551234567"])("renders %s as a plain anchor in the same tab", (href) => {
    render(<Link href={href}>Text</Link>);

    const link = screen.getByRole("link");
    expect(link).not.toHaveAttribute("data-router-link");
    expect(link).not.toHaveAttribute("target");
  });

  it("lets the caller open an external link in the same tab", () => {
    render(
      <Link href="https://example.com/cv.pdf" target={undefined} rel={undefined}>
        Text
      </Link>,
    );

    expect(screen.getByRole("link")).not.toHaveAttribute("target");
  });

  it("shows no arrow by default", () => {
    render(<Link href="/about">Text</Link>);

    expect(screen.getByRole("link")).toHaveTextContent(/^Text$/);
  });

  it("shows an arrow on request, kept out of the accessible name", () => {
    render(
      <Link href="/about" showArrowIcon>
        Read more
      </Link>,
    );

    expect(screen.getByRole("link", { name: "Read more" })).toHaveTextContent("Read more →");
  });

  it("shows the arrow on an external link too", () => {
    render(
      <Link href="https://example.com" showArrowIcon>
        Read more
      </Link>,
    );

    expect(screen.getByRole("link", { name: "Read more" })).toHaveTextContent("Read more →");
  });

  it("opens a page of the site in a new tab when given a new-tab label, through the router", () => {
    render(
      <Link href="/blog/post" newTabLabel="(opens in a new tab)">
        Read more
      </Link>,
    );

    const link = screen.getByRole("link", { name: "Read more (opens in a new tab)" });
    expect(link).toHaveAttribute("data-router-link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener");
  });

  it("does not prefetch a page that opens in a new tab, whose router never uses the data", () => {
    render(
      <>
        <Link href="/blog/post" newTabLabel="(opens in a new tab)">
          New tab
        </Link>
        <Link href="/blog">Same tab</Link>
      </>,
    );

    expect(screen.getByRole("link", { name: /New tab/ })).toHaveAttribute("data-prefetch", "false");
    expect(screen.getByRole("link", { name: "Same tab" })).not.toHaveAttribute("data-prefetch");
  });

  it("turns the arrow into ↗ for a new tab, outside the accessible name", () => {
    render(
      <Link href="/blog/post" newTabLabel="(opens in a new tab)" showArrowIcon>
        Read more
      </Link>,
    );

    const link = screen.getByRole("link", { name: "Read more (opens in a new tab)" });
    expect(link).toHaveTextContent(/↗$/);
    expect(link).not.toHaveTextContent("→");
  });

  it("passes className and other anchor props", () => {
    render(
      <Link href="/about" className="self-start" aria-label="About me">
        Text
      </Link>,
    );

    expect(screen.getByRole("link", { name: "About me" })).toHaveClass("self-start");
  });
});
