import type { FC, ReactNode } from "react";

import { RevealOnce } from "@/shared/ui/RevealOnce";
import { Header } from "@/widgets/header/Header";

interface SiteLayoutProps {
  children: ReactNode;
}

export const SiteLayout: FC<SiteLayoutProps> = (props) => {
  const { children } = props;

  return (
    <>
      <RevealOnce />
      <Header />
      {children}
    </>
  );
};
