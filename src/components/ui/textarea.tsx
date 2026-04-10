import { cn } from "@/lib/utils/cn";
import { forwardRef, type TextareaHTMLAttributes } from "react";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-sand-700"
          >
            {label}
          </label>
        )}
        <textarea
          id={id}
          className={cn(
            "w-full bg-white border border-sand-300 rounded-lg px-3.5 py-2.5 text-sand-800 placeholder:text-sand-400 transition-all duration-150 resize-y min-h-[100px]",
            "focus:border-warm-orange focus:ring-2 focus:ring-warm-orange-light focus:outline-none",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
