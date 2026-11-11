import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./favicon";

const getSiteMeta = vi.hoisted(() => vi.fn());

vi.mock("@/content/meta", () => ({ getSiteMeta }));
vi.mock("next/cache", () => ({ cacheLife: () => undefined }));

const iconUrl = "https://blob.example/favicon/favicon.ico";
const bytes = new Uint8Array([0, 0, 1, 0, 1, 0, 16, 16]);

describe("GET /favicon.ico", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
    getSiteMeta.mockReset();
  });

  it("serves the bytes of iconIcoUrl", async () => {
    getSiteMeta.mockResolvedValue({ iconIcoUrl: iconUrl });
    fetchMock.mockResolvedValue(new Response(bytes, { status: 200 }));

    const response = await GET();

    expect(fetchMock).toHaveBeenCalledWith(iconUrl);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/x-icon");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
  });

  it("answers 404 without an icon", async () => {
    getSiteMeta.mockResolvedValue({ iconIcoUrl: null });

    const response = await GET();

    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws when the icon cannot be fetched", async () => {
    getSiteMeta.mockResolvedValue({ iconIcoUrl: iconUrl });
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));

    await expect(GET()).rejects.toThrow(iconUrl);
  });
});
