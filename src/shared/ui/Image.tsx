"use client";

import NextImage from "next/image";
import { type FC, useState } from "react";

import { cn } from "@/shared/lib/utils";

interface ImageProps {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  framed?: boolean;
}

export const Image: FC<ImageProps> = (props) => {
  const { src, alt, sizes, priority, className, framed } = props;
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
