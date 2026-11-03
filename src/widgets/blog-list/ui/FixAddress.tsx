"use client";

import { type FC, useEffect } from "react";

import { useRouter } from "@/shared/lib/i18n/navigation";

/**
 * The URL could not be restored completely, so the server rendered the default list: this replaces the address with
 * the clean `/blog`, silently (owner's rule). `replace`, so Back never returns to the broken address. Not a server
 * `redirect()`: inside a streamed `<Suspense>` boundary it would become an extra client navigation.
 */
export const FixAddress: FC = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/blog", { scroll: false });
  }, [router]);

  return null;
};
