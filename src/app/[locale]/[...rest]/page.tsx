// Rendering: dynamic (any unknown path). Without this catch-all, unmatched paths under a locale would skip
// the [locale] layout; calling notFound() here renders src/app/[locale]/not-found.tsx inside it, with a 404 status.
import { notFound } from "next/navigation";
import type { FC } from "react";

// Out of the dev-time instant-navigation check: the page only ever throws notFound(), so there is no segment to
// validate, and the check logged "Could not validate `instant`" on every 404. Next excludes its own /_not-found the same way.
export const instant = false;

const CatchAllPage: FC = () => {
  notFound();
};

export default CatchAllPage;
