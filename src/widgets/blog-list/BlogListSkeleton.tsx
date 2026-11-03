import type { FC } from "react";

const bar = "rounded-full bg-muted motion-safe:animate-pulse";

/**
 * The first visit's placeholder while the list streams in: the panel with a field and chips, the list header and
 * three cards, sized like the real ones so nothing jumps. No pagination. Hidden from assistive technology; the
 * real list announces itself. It does not pulse under `prefers-reduced-motion`.
 */
export const BlogListSkeleton: FC = () => (
  <div
    data-blog-skeleton=""
    aria-hidden
    className="px-3.5 pb-8 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-8 lg:px-16 lg:pb-14"
  >
    <div className="flex flex-col gap-3.5 py-3 lg:gap-5 lg:rounded-3xl lg:border lg:border-card-border lg:bg-card lg:p-[22px]">
      <div className="h-11 rounded-full border border-card-border bg-background" />
      <div className="flex gap-1.5">
        {[64, 104, 96].map((width) => (
          <div key={width} className={`h-9 ${bar}`} style={{ width }} />
        ))}
      </div>
    </div>
    <div className="mt-4 flex flex-col gap-4 lg:mt-0">
      <div className="flex items-center justify-between px-1">
        <div className={`h-3 w-20 ${bar}`} />
        <div className={`h-10 w-40 ${bar}`} />
      </div>
      {[0, 1, 2].map((card) => (
        <div
          key={card}
          className="flex flex-col gap-3 rounded-[20px] border border-card-border bg-card p-3 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6 lg:rounded-3xl lg:p-4"
        >
          <div className="h-35 rounded-2xl bg-muted motion-safe:animate-pulse lg:h-auto lg:min-h-50" />
          <div className="flex flex-col gap-2.5 px-1 py-1.5">
            <div className={`h-3 w-32 ${bar}`} />
            <div className={`h-6 w-4/5 ${bar}`} />
            <div className={`h-4 w-full ${bar}`} />
            <div className={`h-4 w-3/4 ${bar}`} />
          </div>
        </div>
      ))}
    </div>
  </div>
);
