import { cacheLife } from "next/cache";

import { getSiteMeta } from "@/content/meta";

const loadIcon = async (url: string): Promise<ArrayBuffer> => {
  "use cache";
  cacheLife("max");

  const icon = await fetch(url);

  if (!icon.ok) throw new Error(`Cannot fetch ${url}: ${icon.status}`);

  return icon.arrayBuffer();
};

export const GET = async (): Promise<Response> => {
  const { iconIcoUrl } = await getSiteMeta("en");

  if (!iconIcoUrl) return new Response(null, { status: 404 });

  return new Response(await loadIcon(iconIcoUrl), { headers: { "content-type": "image/x-icon" } });
};
