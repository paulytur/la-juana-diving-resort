import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return <div className="page-shell flex min-h-full flex-col">{children}</div>;
}
