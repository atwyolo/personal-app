import { getSiteMeta } from "@/content/meta";

export const GET = async (): Promise<Response> => {
  const { iconIcoUrl } = await getSiteMeta("en");

  return iconIcoUrl ? Response.redirect(iconIcoUrl, 307) : new Response(null, { status: 404 });
};
