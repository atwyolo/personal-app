import { getSiteMeta } from "@/content/meta";

/**
 * `/favicon.ico` for clients that skip the HTML (bots, feed readers) and ask the site root directly.
 * Pages never send browsers here: they carry real icon links, or the empty `data:,` icon while none is set.
 * 307, not 308: a permanent redirect is cached by browsers for good, and a new icon would never be picked up.
 * The icon has no translation, so the English row is read.
 */
export const GET = async (): Promise<Response> => {
  const { iconIcoUrl } = await getSiteMeta("en");

  return iconIcoUrl ? Response.redirect(iconIcoUrl, 307) : new Response(null, { status: 404 });
};
