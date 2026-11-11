import { XIcon } from "lucide-react";
import type { FC, ReactElement, ReactNode } from "react";

import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/shared/shadcn/ui/sheet";

import { Button } from "./Button";

interface DrawerProps {
  trigger: ReactElement;
  title: string;
  closeLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export const Drawer: FC<DrawerProps> = (props) => {
  const { trigger, title, closeLabel, open, onOpenChange, children } = props;

  return (
    <Sheet open={open} onOpenChange={(next: boolean) => onOpenChange(next)}>
      <SheetTrigger render={trigger} />
      <SheetContent side="right" showCloseButton={false} className="gap-0 border-card-border bg-card px-4 pt-[72px] pb-6">
        <SheetTitle className="sr-only">{title}</SheetTitle>
        <SheetClose
          render={<Button shape="circle" aria-label={closeLabel} className="absolute top-2.5 right-3" />}
        >
          <XIcon aria-hidden />
        </SheetClose>
        {children}
      </SheetContent>
    </Sheet>
  );
};
