"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { navItems } from "./nav";

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-3 px-3">
      {navItems.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-emerald-50 text-emerald-900 font-semibold shadow-xs ring-1 ring-emerald-500/15"
                : "text-muted-foreground hover:bg-emerald-50/40 hover:text-emerald-950",
            )}
          >
            {active && (
              <motion.span
                layoutId="sidebar-active"
                className="absolute top-1/2 left-0 h-6 w-1.5 -translate-y-1/2 rounded-r-full bg-brand-gradient"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <Icon
              className={cn(
                "size-[18px] shrink-0 transition-colors",
                active
                  ? "text-emerald-700"
                  : "text-muted-foreground group-hover:text-emerald-700",
              )}
              strokeWidth={active ? 2.25 : 2}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export { SidebarNav };
