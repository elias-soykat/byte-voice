import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 transition-colors",
  {
    variants: {
      variant: {
        default: "border-slate-200 bg-slate-100 text-slate-700",
        brand: "border-emerald-500/25 bg-emerald-50 text-emerald-800 font-semibold",
        success: "border-emerald-500/25 bg-emerald-50 text-emerald-700 font-semibold",
        warning: "border-amber-500/25 bg-amber-50 text-amber-700 font-semibold",
        destructive: "border-rose-500/25 bg-rose-50 text-rose-700 font-semibold",
        info: "border-teal-500/25 bg-teal-50 text-teal-700 font-semibold",
        outline: "border-border text-foreground bg-surface",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
