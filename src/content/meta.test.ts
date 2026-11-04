// @vitest-environment node
import { describe, expect, it } from "vitest";

import { readPageMeta, readSiteMeta } from "./meta";

const messages = {
  Meta: {
    Common: {
      siteName: "Mike",
      defaultTitle: "Mike",
      iconIcoUrl: null,
      iconSvgUrl: "https://a.dev/icon.svg",
      iconPngUrl: null,
      appleTouchIconUrl: null,
      ogPlaceholderUrl: null,
      hiddenFromSearch: true,
    },
    About: { title: "About — Mike", description: "Interview.", ogImageUrl: null },
  },
};

describe("metadata from messages", () => {
  it("reads the site settings", () => {
    expect(readSiteMeta(messages)).toEqual(messages.Meta.Common);
  });

  it("reads a page", () => {
    expect(readPageMeta(messages, "About")).toEqual({ title: "About — Mike", description: "Interview.", ogImageUrl: null });
  });

  it("fails loudly on a missing page instead of shipping a generic title", () => {
    expect(() => readPageMeta(messages, "Skills")).toThrow(/Meta\.Skills/);
  });

  it("rejects a relative icon URL", () => {
    const broken = { Meta: { ...messages.Meta, Common: { ...messages.Meta.Common, iconSvgUrl: "/icon.svg" } } };

    expect(() => readSiteMeta(broken)).toThrow(/Meta\.Common\.iconSvgUrl/);
  });
});
