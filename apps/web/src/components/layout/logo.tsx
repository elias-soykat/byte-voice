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
      <span className="relative flex size-9 items-center justify-center rounded-xl bg-brand-gradient shadow-soft-md ring-1 ring-emerald-500/30 transition-transform group-hover:scale-105">
        <Mic className="size-4.5 text-white" strokeWidth={2.25} />
        <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full border-2 border-white bg-emerald-400" />
        </span>
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-[1.05rem] font-bold tracking-tight text-foreground">
          Byte<span className="text-brand-gradient">Voice</span>
        </span>
        <span className="flex items-center gap-1 text-[9px] font-semibold tracking-wider text-emerald-700/80 uppercase">
          <span>Healthcare AI</span>
          <span className="size-1 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground font-normal">Bangladesh</span>
        </span>
      </div>
    </Link>
  );
}

export { Logo };
