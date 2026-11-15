import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-soft hover:bg-emerald-700 active:scale-[0.98]",
        gradient:
          "bg-brand-gradient text-white shadow-soft-md hover:brightness-105 active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-emerald-50 hover:text-emerald-950",
        outline:
          "border border-border bg-surface text-foreground shadow-soft hover:bg-emerald-50 hover:text-emerald-950 hover:border-emerald-500/30",
        ghost: "text-foreground hover:bg-emerald-50 hover:text-emerald-950",
        destructive:
          "bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3 has-[>svg]:px-2.5",
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        lg: "h-11 px-6 has-[>svg]:px-4 text-[0.95rem]",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
