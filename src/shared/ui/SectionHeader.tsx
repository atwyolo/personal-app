import type { FC, ReactNode } from "react";

interface SectionHeaderProps {
  id: string;
  children: ReactNode;
}

export const SectionHeader: FC<SectionHeaderProps> = (props) => {
  const { id, children } = props;

  return (
    <div className="px-1 pt-3 lg:pt-8 lg:pb-1">
      <h2 id={id} className="font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase lg:text-xs">
        {children}
      </h2>
    </div>
  );
};
