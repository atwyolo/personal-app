import type { FC } from "react";

import type { AboutPair } from "@/content/about";
import { Markdown } from "@/shared/ui/Markdown";

interface InterviewPairProps {
  pair: AboutPair;
  initials: string;
}

/** One question and its answer. The title stays out of the `h2`, so the heading reads as the question alone. */
export const InterviewPair: FC<InterviewPairProps> = (props) => {
  const { pair, initials } = props;
  const { slug, questionTitle, questionMessage, answerTitle, answerMessage } = pair;

  return (
    // The margin clears the header, the chips and 12 px of air when a chip scrolls here. `tabIndex` lets a chip move the focus.
    <section
      id={slug}
      tabIndex={-1}
      className="flex scroll-mt-[127px] flex-col gap-3 [overflow-wrap:anywhere] outline-none lg:scroll-mt-[139px]"
    >
      <div className="max-w-[85%] self-end rounded-[20px_20px_6px_20px] bg-primary px-[18px] py-3.5 text-primary-foreground lg:max-w-[70%]">
        <p className="mb-1 text-base leading-[1.35] font-semibold tracking-[-0.01em] lg:text-lg">{questionTitle}</p>
        <h2 className="text-[13px] leading-[1.35] font-normal lg:text-sm">{questionMessage}</h2>
      </div>

      <div className="flex max-w-full items-end gap-3 lg:max-w-[88%]">
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-full border border-card-border bg-card font-mono text-[10px] leading-none font-semibold text-brand lg:size-10 lg:text-xs"
        >
          {initials}
        </span>
        <div className="flex min-w-0 flex-col gap-3 rounded-[20px_20px_20px_6px] border border-card-border bg-card px-4 py-3.5 lg:px-5 lg:py-[18px]">
          <p className="text-base leading-[1.45] font-medium lg:text-[19px]">{answerTitle}</p>
          <Markdown
            source={answerMessage}
            headingOffset={2}
            className="text-[15px] leading-[1.6] text-foreground-soft lg:text-base lg:leading-[1.7]"
          />
        </div>
      </div>
    </section>
  );
};
