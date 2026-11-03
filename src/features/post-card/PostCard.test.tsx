import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import type { PostPreview } from "@/db/queries/home";
import messages from "../../../messages/en.json";
import { PostCard } from "./PostCard";

// next-intl navigation needs the Next router.
vi.mock("@/shared/lib/i18n/navigation", () => ({
  // `prefetch` is a router prop, not an anchor attribute: the stand-in shows it as data.
  Link: (props: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => {
    const { prefetch, ...rest } = props;
    return <a data-prefetch={prefetch === undefined ? undefined : String(prefetch)} {...rest} />;
  },
}));

const post: PostPreview = {
  slug: "offline-mode-in-react",
  publishedAt: "2026-10-12T00:00:00.000Z",
  coverUrl: null,
  topic: "Technical",
  title: "Offline mode in a React app",
  contentShort: "A service worker is only half the story.",
  tags: ["React", "PWA"],
};

const renderCard = (overrides: Partial<PostPreview> = {}, featured?: boolean) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <PostCard post={{ ...post, ...overrides }} featured={featured} />
    </NextIntlClientProvider>,
  );

describe("PostCard", () => {
  it("shows the topic before the date", () => {
    renderCard();

    const topic = screen.getByText("Technical");
    const date = screen.getByText("Oct 12, 2026");

    expect(topic.compareDocumentPosition(date) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("gives the date its machine-readable value", () => {
    renderCard();

    expect(screen.getByText("Oct 12, 2026").closest("time")).toHaveAttribute("dateTime", post.publishedAt);
  });

  // 23:30 UTC is already the next day east of Greenwich and 00:30 is the previous one west of it.
  it.each([
    ["2026-10-12T23:30:00.000Z", "Oct 12, 2026"],
    ["2026-10-12T00:30:00.000Z", "Oct 12, 2026"],
  ])("prints the UTC day of %s whatever the machine's zone", (publishedAt, printed) => {
    renderCard({ publishedAt });

    expect(screen.getByText(printed)).toBeVisible();
  });

  it("shows the title as a third-level heading and the short text as it is", () => {
    renderCard();

    expect(screen.getByRole("heading", { level: 3, name: post.title })).toBeVisible();
    expect(screen.getByText("A service worker is only half the story.")).toBeVisible();
  });

  it("lists the tags", () => {
    renderCard();

    const tags = within(screen.getByRole("list")).getAllByRole("listitem");

    expect(tags.map((tag) => tag.textContent)).toEqual(["React", "PWA"]);
  });

  it("has no empty tag list", () => {
    renderCard({ tags: [] });

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("leads to the post", () => {
    renderCard();

    expect(screen.getByRole("link", { name: "Read more (opens in a new tab)" })).toHaveAttribute(
      "href",
      "/blog/offline-mode-in-react",
    );
  });

  it("has no cover unless it is featured", () => {
    renderCard({ coverUrl: "https://example.com/cover.jpg" });

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("shows a featured post's cover, described by the title", () => {
    renderCard({ coverUrl: "https://example.com/cover.jpg" }, true);

    expect(screen.getByRole("img", { name: post.title }).tagName).toBe("IMG");
  });

  it("shows a placeholder when a featured post has no cover", () => {
    renderCard({}, true);

    expect(screen.getByRole("img", { name: post.title }).tagName).toBe("DIV");
  });
});

describe("PostCard links to the post", () => {
  const newTab = (link: HTMLElement) => {
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener");
  };

  it("opens Read more in a new tab on Home, with the ↗ arrow", () => {
    renderCard();

    const readMore = screen.getByRole("link", { name: "Read more (opens in a new tab)" });
    newTab(readMore);
    expect(readMore).toHaveTextContent("↗");
  });

  it("opens the title and Read more in a new tab in the list, the title without an arrow", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <PostCard post={post} layout="list" tagHref={(tag) => `/blog?tags=${tag}`} />
      </NextIntlClientProvider>,
    );

    const title = screen.getByRole("link", { name: `${post.title} (opens in a new tab)` });
    newTab(title);
    expect(title).toHaveAttribute("data-prefetch", "false");
    expect(title).not.toHaveTextContent("↗");
    newTab(screen.getByRole("link", { name: "Read more (opens in a new tab)" }));
    expect(screen.getByRole("link", { name: "React" })).not.toHaveAttribute("target");
  });
});

describe("PostCard in the blog list", () => {
  const renderListCard = (props: Partial<Parameters<typeof PostCard>[0]> = {}) =>
    render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <PostCard post={post} layout="list" {...props} />
      </NextIntlClientProvider>,
    );

  it("shows the cover and the title as a second-level heading", () => {
    renderListCard();

    expect(screen.getByRole("img", { name: post.title })).toBeVisible();
    expect(screen.getByRole("heading", { level: 2, name: `${post.title} (opens in a new tab)` })).toBeVisible();
  });

  it("links the title to the post", () => {
    renderListCard();

    const name = `${post.title} (opens in a new tab)`;
    const heading = screen.getByRole("heading", { level: 2, name });
    expect(within(heading).getByRole("link", { name })).toHaveAttribute("href", `/blog/${post.slug}`);
  });

  it("links each tag to the state that toggles it, through the router", () => {
    renderListCard({ tagHref: (tag) => `/blog?tags=${tag}` });

    const tags = within(screen.getByRole("list")).getAllByRole("link");

    expect(tags.map((tag) => [tag.textContent, tag.getAttribute("href")])).toEqual([
      ["React", "/blog?tags=React"],
      ["PWA", "/blog?tags=PWA"],
    ]);
  });

  it("marks the selected tags", () => {
    renderListCard({ tagHref: (tag) => `/blog?tags=${tag}`, selectedTags: ["PWA"] });

    expect(screen.getByRole("link", { name: "PWA" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "React" })).not.toHaveAttribute("aria-current");
  });

  it("keeps the tags plain without tagHref", () => {
    renderListCard();

    expect(within(screen.getByRole("list")).queryByRole("link")).toBeNull();
  });
});
