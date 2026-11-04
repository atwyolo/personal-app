import { SearchIcon } from "lucide-react";
import type { FC } from "react";

import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/shadcn/ui/input";

interface SearchFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export const SearchField: FC<SearchFieldProps> = (props) => {
  const { label, value, onValueChange, className } = props;

  return (
    <search className={className}>
      <label className="flex min-h-11 items-center gap-2.5 rounded-full border border-card-border bg-background px-4 text-muted-foreground focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/25">
        <SearchIcon aria-hidden className="size-[18px] shrink-0" />
        <span className="sr-only">{label}</span>
        <Input
          type="search"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={label}
          className={cn(
            "h-auto min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 text-base leading-[1.2] text-foreground md:text-base lg:text-[15px]",
            "outline-hidden focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent",
          )}
        />
      </label>
    </search>
  );
};
