import { HeartPulse } from "lucide-react";

import { Logo } from "./logo";
import { SidebarNav } from "./sidebar-nav";

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-16 items-center px-6 border-b border-border/60">
        <Logo />
      </div>
      <div className="flex flex-1 flex-col py-4">
        <SidebarNav />
      </div>
      <div className="p-3">
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-50/60 p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"></div>
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-emerald-900/80">
            24/7 Dhaka Dental Care receptionist active & answering calls.
          </p>
        </div>
      </div>
    </aside>
  );
}

export { Sidebar };
