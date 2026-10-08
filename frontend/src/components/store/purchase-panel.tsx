"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { unitLabel } from "@/lib/catalog";
import { formatPrice } from "@/lib/pricing";
import type { StockStatus } from "@/types";

interface PurchasePanelProps {
  finalPrice: number;
  minOrderQty: number;
  unit: string;
  stockStatus: StockStatus;
}

const MAX_QTY = 1_000_000;

export function PurchasePanel({ finalPrice, minOrderQty, unit, stockStatus }: PurchasePanelProps) {
  const min = Math.max(minOrderQty, 1);
  const [draft, setDraft] = useState(String(min));
  const quantity = Math.min(Math.max(Number.parseInt(draft, 10) || 0, 0), MAX_QTY);
  const belowMinimum = quantity < min;
  const unavailable = stockStatus === "out_of_stock";

  const step = (direction: 1 | -1) => {
    // Buttons move in multiples of the minimum order, which is how most buyers think in cartons.
    const next = direction === 1 ? Math.floor(quantity / min) * min + min : Math.ceil(quantity / min) * min - min;
    setDraft(String(Math.min(Math.max(next, min), MAX_QTY)));
  };

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="quantity" className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
            Quantity ({unit})
          </label>
          <div className="mt-1.5 flex h-12 items-center rounded-xl border border-line-strong bg-surface">
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={quantity <= min}
              aria-label={`Decrease by ${min}`}
              className="flex h-full w-11 items-center justify-center text-ink-soft hover:text-ink disabled:text-ink-faint"
            >
              <Minus className="size-4" aria-hidden />
            </button>
            <input
              id="quantity"
              inputMode="numeric"
              pattern="[0-9]*"
              value={draft}
              onChange={(event) => setDraft(event.target.value.replace(/\D/g, "").slice(0, 7))}
              onBlur={() => setDraft(String(Math.max(quantity, min)))}
              aria-describedby="quantity-hint"
              aria-invalid={belowMinimum || undefined}
              className="h-full w-20 border-x border-line bg-transparent text-center text-base font-semibold text-ink tabular-nums focus:outline-none"
            />
            <button
              type="button"
              onClick={() => step(1)}
              aria-label={`Increase by ${min}`}
              className="flex h-full w-11 items-center justify-center text-ink-soft hover:text-ink"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
        </div>

        <div className="ml-auto text-right">
          <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">Line total</p>
          <p className="mt-1 text-2xl font-bold text-ink tabular-nums">{formatPrice(quantity * finalPrice)}</p>
        </div>
      </div>

      <p id="quantity-hint" className={belowMinimum ? "mt-2 text-xs text-danger" : "mt-2 text-xs text-ink-muted"}>
        {belowMinimum
          ? `Minimum order is ${min.toLocaleString("en-IN")} ${unit}.`
          : `${formatPrice(finalPrice)} per ${unitLabel(unit)} · minimum ${min.toLocaleString("en-IN")} ${unit}`}
      </p>

      {/* Cart and order submission are wired up in the next phase. */}
      <Button size="lg" className="mt-4 w-full rounded-xl" disabled>
        <ShoppingBag aria-hidden />
        {unavailable ? "Currently out of stock" : "Add to order"}
      </Button>
      {!unavailable && (
        <p className="mt-2 text-center text-xs text-ink-muted">Online ordering is opening soon.</p>
      )}
    </div>
  );
}
