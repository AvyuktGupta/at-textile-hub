"use client";

import Link from "next/link";
import { AlertCircle, Trash2 } from "lucide-react";
import { QuantityStepper } from "@/components/store/quantity-stepper";
import { MediaImage } from "@/components/ui/media-image";
import { unitLabel } from "@/lib/catalog";
import type { CartItem } from "@/lib/cart-store";
import { formatPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { QuoteIssue, QuoteLine } from "@/types";

interface CartLineProps {
  item: CartItem;
  line?: QuoteLine;
  issue?: QuoteIssue;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export function CartLine({ item, line, issue, onQuantity, onRemove }: CartLineProps) {
  // Prefer the server's figures; fall back to the snapshot taken when the item was added.
  const unitPrice = line?.unitPrice ?? item.unitPrice;
  const minOrderQty = line?.minOrderQty ?? item.minOrderQty;
  const unit = line?.unit ?? item.unit;
  const title = line?.title ?? item.title;
  const slug = line?.slug ?? item.slug;
  const priceChanged = line && Math.abs(line.unitPrice - item.unitPrice) >= 0.01;
  const unavailable = issue?.code === "unavailable" || issue?.code === "out_of_stock";
  const errorId = `cart-issue-${item.productId}`;

  return (
    <li className={cn("flex gap-3.5 py-5 sm:gap-5", unavailable && "opacity-90")}>
      <Link
        href={`/products/${slug}`}
        className="size-20 shrink-0 overflow-hidden rounded-xl border border-line bg-sunken sm:size-24"
        tabIndex={-1}
        aria-hidden
      >
        <MediaImage src={line?.image ?? item.image} alt="" className={cn("size-full", unavailable && "grayscale")} />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href={`/products/${slug}`} className="line-clamp-2 text-[15px] leading-snug font-semibold text-ink hover:text-brand">
            {title}
          </Link>
          <p className="mt-0.5 text-xs text-ink-muted">SKU {line?.sku ?? item.sku}</p>
          <p className="mt-1.5 text-sm text-ink-soft tabular-nums">
            {formatPrice(unitPrice)} <span className="text-ink-muted">/ {unitLabel(unit)}</span>
            {line && line.discountPercentage > 0 && (
              <span className="ml-1.5 text-xs font-semibold text-clay">{line.discountPercentage}% off</span>
            )}
          </p>
          {priceChanged && (
            <p className="mt-1 text-xs text-warning">
              Price updated since you added this (was {formatPrice(item.unitPrice)}).
            </p>
          )}
          {issue && (
            <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-[13px] text-danger">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {issue.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-2.5">
          {unavailable ? (
            <span className="text-sm text-ink-muted">Not available</span>
          ) : (
            <QuantityStepper
              size="sm"
              value={item.quantity}
              min={minOrderQty}
              onChange={onQuantity}
              label={`Quantity of ${title} (${unit})`}
              invalid={issue?.code === "below_minimum"}
              describedBy={issue ? errorId : undefined}
            />
          )}
          <div className="flex items-center gap-3 sm:flex-row-reverse">
            <p className="text-base font-bold text-ink tabular-nums">
              {unavailable ? "—" : formatPrice(line?.lineTotal ?? unitPrice * item.quantity)}
            </p>
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${title}`}
              className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
