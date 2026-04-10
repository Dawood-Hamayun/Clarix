import { cn } from "@/lib/utils/cn";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full text-xs font-semibold px-2.5 py-1 tracking-tight",
  {
    variants: {
      variant: {
        default: "bg-sand-100 text-sand-700 border border-sand-200",
        success:
          "bg-status-success/10 text-status-success border border-status-success/20",
        error:
          "bg-status-error/10 text-status-error border border-status-error/20",
        processing:
          "bg-sand-100 text-sand-600 border border-sand-200",
        warning:
          "bg-status-warning/10 text-status-warning border border-status-warning/20",
        orange:
          "bg-sand-900 text-white border border-sand-900",
        outline:
          "bg-white text-sand-600 border border-sand-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props} />
  );
}
