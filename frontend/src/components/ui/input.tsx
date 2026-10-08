import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-lg border bg-surface text-[15px] text-ink placeholder:text-ink-faint transition-[border-color,box-shadow] outline-none focus:border-brand focus:shadow-ring disabled:bg-sunken disabled:text-ink-muted aria-invalid:border-danger aria-invalid:focus:shadow-[0_0_0_4px_rgb(180_35_24/0.12)]";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(fieldBase, "h-11 border-line-strong px-3.5", className)} {...props} />;
  }
);

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(fieldBase, "min-h-28 border-line-strong px-3.5 py-3 leading-relaxed", className)}
        {...props}
      />
    );
  }
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          fieldBase,
          "h-11 appearance-none border-line-strong bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%236b645c' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[position:right_0.75rem_center] bg-no-repeat pr-10 pl-3.5",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);

/** Numeric input with a fixed prefix/suffix (₹, %, pcs). */
export const AffixInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { prefix?: string; suffix?: string }
>(function AffixInput({ prefix, suffix, className, ...props }, ref) {
  return (
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-ink-muted">
          {prefix}
        </span>
      )}
      <Input
        ref={ref}
        className={cn(prefix && "pl-8", suffix && "pr-12", "tabular-nums", className)}
        {...props}
      />
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-ink-muted">
          {suffix}
        </span>
      )}
    </div>
  );
});
