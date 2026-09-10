import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-normal transition-colors shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-slate-900 text-white border-transparent",
        neutral:
          "bg-slate-100 text-slate-700 border-slate-200",
        success:
          "bg-emerald-50 text-emerald-700 border-emerald-200",
        warning:
          "bg-amber-50 text-amber-700 border-amber-200",
        danger:
          "bg-rose-50 text-rose-700 border-rose-200",
        tour:
          "bg-teal-50 text-teal-700 border-teal-200",
        transfer:
          "bg-sky-50 text-sky-700 border-sky-200",
        outline:
          "bg-white text-slate-700 border-slate-200 shadow-2xs",
      },
      size: {
        default: "px-2 py-0.5 text-[11px]",
        sm: "px-1.5 py-0.25 text-[10px]",
        lg: "px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size, className }))} {...props} />
  );
}

export { Badge, badgeVariants };
