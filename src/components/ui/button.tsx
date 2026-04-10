"use client";

import { cn } from "@/lib/utils/cn";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 font-semibold",
    "transition-all duration-150 cursor-pointer select-none",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand-900/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
    "tracking-tight",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-sand-900 text-white rounded-xl shadow-sand hover:bg-sand-800 hover:shadow-sand-md active:scale-[0.97]",
        secondary:
          "bg-white border border-sand-200 text-sand-800 rounded-xl hover:bg-sand-50 hover:border-sand-300 active:scale-[0.97]",
        ghost:
          "text-sand-600 hover:text-sand-900 hover:bg-sand-100 rounded-xl",
        danger:
          "bg-status-error text-white rounded-xl hover:bg-status-error/90 active:scale-[0.97]",
      },
      size: {
        sm: "text-sm px-3.5 py-2",
        md: "text-[0.9375rem] px-5 py-2.5",
        lg: "text-base px-6 py-3.5",
        xl: "text-lg px-7 py-4",
        icon: "p-2.5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, loading, children, disabled, ...props },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
