import { getLocale } from "next-intl/server";
import type { FC } from "react";

import { getProfile } from "@/content/profile";
import { cn } from "@/shared/lib/utils";
import { Image } from "@/shared/ui/Image";
import { Tile } from "@/shared/ui/Tile";

interface ProfilePhotoProps {
  /** Grid placement from the page. */
  className?: string;
}

/**
 * Photo tile, the LCP element of the home page: square on mobile, fills its grid area on desktop.
 * `sizes` is the rendered image width, not the tile width: in a tall desktop tile `object-cover` scales the photo by
 * its height, so the 288px column needs a wider file (322px at 1280, 345px at 1024). From about 1440 the tile is wider
 * than tall and the column decides, so desktop takes the larger of the two. The same crop is why the photo is
 * anchored left: it brings the face to the middle of the tile. On mobile nothing is cropped sideways.
 */
export const ProfilePhoto: FC<ProfilePhotoProps> = async (props) => {
  const { className } = props;
  const locale = await getLocale();
  const { name, photoUrl } = await getProfile(locale);

  return (
    <Tile className={cn("relative aspect-square overflow-clip p-0 lg:aspect-auto lg:min-h-[380px] lg:p-0", className)}>
      <Image
        src={photoUrl}
        alt={name}
        sizes="(min-width: 1024px) max(360px, 25vw), (min-width: 720px) 688px, calc(100vw - 32px)"
        priority
        className="object-cover object-[0_0]"
      />
    </Tile>
  );
};
