import Link from "next/link";
import { Mic } from "lucide-react";

import { cn } from "@/lib/utils";

function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("group flex items-center gap-2.5", className)}
      aria-label="StrategyByte ByteVoice home"
    >
      <span className="relative flex size-9 items-center justify-center rounded-lg bg-brand-gradient shadow-soft-md ring-1 ring-emerald-500/30 transition-transform">
        <Mic className="size-4.5 text-white" strokeWidth={2.25} />
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-[1.05rem] font-bold tracking-tight text-foreground">
          Byte<span className="text-brand-gradient">Voice</span>
        </span>
        <span className="flex items-center gap-1 text-[9px] font-semibold tracking-wider text-emerald-700/80 uppercase">
          <span>Healthcare AI</span>
        </span>
      </div>
    </Link>
  );
}

export { Logo };
