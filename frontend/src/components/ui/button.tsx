import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-brand text-white shadow-sm hover:bg-brand-hover disabled:bg-brand/50",
  secondary:
    "bg-surface text-ink border border-line-strong shadow-sm hover:bg-sunken hover:border-ink-faint disabled:text-ink-faint",
  ghost: "text-ink-soft hover:bg-sunken hover:text-ink disabled:text-ink-faint",
  danger: "bg-danger text-white shadow-sm hover:bg-danger/90 disabled:bg-danger/50",
  "danger-ghost": "text-danger hover:bg-danger-soft disabled:text-danger/50",
} as const;

const sizes = {
  sm: "h-9 px-3 text-sm gap-1.5 rounded-lg",
  md: "h-11 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 px-6 text-base gap-2 rounded-xl",
  icon: "size-10 rounded-lg",
} as const;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
}

export const buttonClasses = (variant: keyof typeof variants = "primary", size: keyof typeof sizes = "md") =>
  cn(
    "inline-flex shrink-0 select-none items-center justify-center font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed [&_svg]:size-4 [&_svg]:shrink-0",
    variants[variant],
    sizes[size]
  );

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading = false, disabled, children, type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonClasses(variant, size), className)}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
