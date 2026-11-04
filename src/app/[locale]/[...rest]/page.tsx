import { notFound } from "next/navigation";
import type { FC } from "react";

export const instant = false;

const CatchAllPage: FC = () => {
  notFound();
};

export default CatchAllPage;
