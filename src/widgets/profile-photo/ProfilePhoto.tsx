import { getLocale } from "next-intl/server";
import type { FC } from "react";

import { getProfile } from "@/content/profile";
import { cn } from "@/shared/lib/utils";
import { Image } from "@/shared/ui/Image";
import { Tile } from "@/shared/ui/Tile";

interface ProfilePhotoProps {
  className?: string;
}

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
