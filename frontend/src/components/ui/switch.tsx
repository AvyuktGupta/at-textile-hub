import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
  hideLabel?: boolean;
  id?: string;
}

export function Switch({ checked, onCheckedChange, label, description, hideLabel, id }: SwitchProps) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start justify-between gap-4">
      <span className={cn("flex flex-col", hideLabel && "sr-only")}>
        <span className="text-sm font-medium text-ink-soft">{label}</span>
        {description && <span className="text-[13px] text-ink-muted">{description}</span>}
      </span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={hideLabel ? label : undefined}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-brand" : "bg-line-strong"
        )}
      >
        <span
          className={cn(
            "inline-block size-5 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-5.5" : "translate-x-0.5"
          )}
        />
      </button>
    </label>
  );
}
