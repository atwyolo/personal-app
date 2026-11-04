"use client";

import NextImage from "next/image";
import { type FC, useState } from "react";

import { cn } from "@/shared/lib/utils";

interface ImageProps {
  /** Null renders the placeholder, e.g. a content field that is not filled yet. */
  src: string | null;
  /** Also labels the placeholder, so a screen reader announces the same thing either way. */
  alt: string;
  /** Rendered image width per breakpoint, see `sizes` in the next/image docs. */
  sizes: string;
  /** For the LCP image only: fetched first. React's server render adds the preload link for a non-lazy image. */
  priority?: boolean;
  /** Applied to the image, e.g. `object-cover`. */
  className?: string;
  /** For an image inset in a padded tile: 14px radius; the placeholder gets a dashed border and thin stripes. */
  framed?: boolean;
}

/**
 * Every image of the site: next/image in `fill` mode with a striped placeholder for a missing source or a failed load.
 * The parent sets the size and `position: relative`, so the placeholder takes exactly the image's place.
 * A client component because `onError` is a browser event; the image is still in the prerendered HTML.
 */
export const Image: FC<ImageProps> = (props) => {
  const { src, alt, sizes, priority, className, framed } = props;
  // The failed URL rather than a flag: a new `src` gets its own chance without resetting state in an effect.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || src === failedSrc) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "absolute inset-0",
          framed
            ? "rounded-[14px] border border-dashed border-placeholder bg-[repeating-linear-gradient(135deg,var(--placeholder)_0_1px,transparent_1px_10px)]"
            : "bg-[repeating-linear-gradient(45deg,var(--placeholder)_0_8px,transparent_8px_16px)]",
        )}
      />
    );
  }

  return (
    <NextImage
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      loading={priority ? "eager" : undefined}
      fetchPriority={priority ? "high" : undefined}
      className={cn(framed && "rounded-[14px]", className)}
      onError={() => setFailedSrc(src)}
    />
  );
};
