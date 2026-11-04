import type { ComponentPropsWithRef, FC } from "react";

import { cn } from "@/shared/lib/utils";
import { Button as ShadcnButton } from "@/shared/shadcn/ui/button";

const tones = {
  default: "border-card-border bg-card text-foreground hover:bg-accent aria-expanded:bg-accent",
  brand: "border-card-border bg-card text-brand hover:bg-accent aria-expanded:bg-accent",
  primary: "border-primary bg-primary text-primary-foreground hover:bg-primary/85",
  outline:
    "border-brand bg-transparent text-brand hover:bg-accent aria-disabled:pointer-events-none aria-disabled:not-focus-visible:opacity-35",
} as const;

const shapes = {
  pill: "h-11 px-[18px]",
  circle: "size-11 p-0",
  "circle-to-pill": "size-11 p-0 lg:w-auto lg:px-3.5",
} as const;

export interface ButtonLookProps {
  tone?: keyof typeof tones;
  shape?: keyof typeof shapes;
  className?: string;
}

interface ButtonProps extends Omit<ComponentPropsWithRef<"button">, "className">, ButtonLookProps {}

export const getButtonClasses = (look: ButtonLookProps): string => {
  const { tone = "default", shape = "pill", className } = look;

  return cn(
    "gap-2 rounded-full text-[15px] font-medium outline-hidden focus-visible:ring-ring [&_svg:not([class*='size-'])]:size-[18px]",
    tones[tone],
    shapes[shape],
    className,
  );
};

export const Button: FC<ButtonProps> = (props) => {
  const { tone, shape, className, ...rest } = props;

  return <ShadcnButton variant="default" className={getButtonClasses({ tone, shape, className })} {...rest} />;
};
