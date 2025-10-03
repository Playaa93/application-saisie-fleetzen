"use client";

import type { PropsWithChildren } from "react";
import { BottomNav } from "@/components/mobile/BottomNav";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen flex flex-col pb-16">
      <main className="flex-1">{children}</main>
      <BottomNav />
    </div>
  );
}
