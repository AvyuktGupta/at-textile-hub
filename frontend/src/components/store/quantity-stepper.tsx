"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_QTY = 1_000_000;

interface QuantityStepperProps {
  id?: string;
  value: number;
  /** Minimum order quantity; the +/- buttons move in multiples of it (how buyers think in cartons). */
  min: number;
  onChange: (quantity: number) => void;
  size?: "md" | "sm";
  label?: string;
  invalid?: boolean;
  describedBy?: string;
}

export function QuantityStepper({
  id,
  value,
  min: rawMin,
  onChange,
  size = "md",
  label,
  invalid,
  describedBy,
}: QuantityStepperProps) {
  const min = Math.max(rawMin, 1);
  // Only holds text while the field is being edited, so it never drifts from `value`.
  const [draft, setDraft] = useState<string | null>(null);

  const step = (direction: 1 | -1) => {
    const next = direction === 1 ? Math.floor(value / min) * min + min : Math.ceil(value / min) * min - min;
    onChange(Math.min(Math.max(next, min), MAX_QTY));
  };

  const height = size === "md" ? "h-12" : "h-10";
  const button = cn(
    "flex h-full items-center justify-center text-ink-soft transition-colors hover:text-ink disabled:text-ink-faint",
    size === "md" ? "w-11" : "w-9"
  );

  return (
    <div
      className={cn(
        "flex items-center rounded-xl border bg-surface",
        height,
        invalid ? "border-danger" : "border-line-strong"
      )}
    >
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={value <= min}
        aria-label={`Decrease by ${min.toLocaleString("en-IN")}`}
        className={button}
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <input
        id={id}
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={label}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        value={draft ?? String(value)}
        onFocus={(event) => {
          setDraft(String(value));
          event.currentTarget.select();
        }}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "").slice(0, 7);
          setDraft(digits);
          const parsed = Number.parseInt(digits, 10);
          if (parsed > 0) onChange(Math.min(parsed, MAX_QTY));
        }}
        onBlur={() => {
          setDraft(null);
          if (value < min) onChange(min);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        className={cn(
          "h-full border-x border-line bg-transparent text-center font-semibold text-ink tabular-nums focus:outline-none",
          size === "md" ? "w-20 text-base" : "w-16 text-sm"
        )}
      />
      <button
        type="button"
        onClick={() => step(1)}
        disabled={value >= MAX_QTY}
        aria-label={`Increase by ${min.toLocaleString("en-IN")}`}
        className={button}
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
