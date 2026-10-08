import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-sunken text-ink-soft",
  brand: "bg-brand-soft text-brand",
  clay: "bg-clay-soft text-clay",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger-soft text-danger",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
