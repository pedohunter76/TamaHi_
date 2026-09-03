import type { ReactNode } from "react";

import { SessionLifecycleTracker } from "@/components/session-lifecycle-tracker";
import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("flex w-full flex-1 flex-col", className)}
    >
      <SessionLifecycleTracker />
      {children}
    </div>
  );
}
