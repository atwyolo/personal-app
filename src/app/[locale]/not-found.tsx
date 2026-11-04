import type { FC } from "react";

const NotFound: FC = () => (
  <main className="mx-auto flex max-w-3xl flex-col gap-4 p-8">
    <h1 className="text-4xl font-bold">404</h1>
    <p>This page does not exist.</p>
  </main>
);

export default NotFound;
