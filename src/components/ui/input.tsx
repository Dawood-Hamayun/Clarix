import { cn } from "@/lib/utils/cn";
import { forwardRef, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-semibold text-sand-800 tracking-tight"
          >
            {label}
          </label>
        )}
        <input
          id={id}
          className={cn(
            "w-full bg-white border border-sand-200 rounded-xl px-4 py-3",
            "text-[0.9375rem] text-sand-900 placeholder:text-sand-400",
            "transition-all duration-150",
            "focus:border-sand-900 focus:ring-2 focus:ring-sand-900/10 focus:outline-none",
            "hover:border-sand-300",
            error &&
              "border-status-error focus:border-status-error focus:ring-status-error/20",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-status-error font-medium">{error}</p>}
        {hint && !error && <p className="text-xs text-sand-500">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
