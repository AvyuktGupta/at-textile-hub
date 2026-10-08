import Link from "next/link";
import { MediaImage } from "@/components/ui/media-image";
import { formatDiscount, stockStatusMeta, unitLabel } from "@/lib/catalog";
import { formatPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { ProductSummary } from "@/types";

export function DiscountBadge({ percentage, className }: { percentage: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-clay px-2 py-1 text-[11px] leading-none font-bold tracking-wide text-white uppercase tabular-nums",
        className
      )}
    >
      {formatDiscount(percentage)} off
    </span>
  );
}

interface ProductCardProps {
  product: ProductSummary;
  className?: string;
  /** Loads the image eagerly; use for cards visible on first paint. */
  priority?: boolean;
}

export function ProductCard({ product, className, priority = false }: ProductCardProps) {
  const image = product.images[0];
  const hasDiscount = product.discountPercentage > 0;
  const unavailable = product.stockStatus === "out_of_stock";
  const stock = stockStatusMeta(product.stockStatus);

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        "group relative flex flex-col rounded-card outline-offset-4 focus-visible:outline-2 focus-visible:outline-brand",
        className
      )}
    >
      <div className="relative aspect-square overflow-hidden rounded-card border border-line/70 bg-sunken">
        <MediaImage
          src={image?.url}
          alt={image?.alt || product.title}
          loading={priority ? "eager" : "lazy"}
          className={cn(
            "size-full transition-transform duration-500 ease-out group-hover:scale-[1.035]",
            unavailable && "opacity-60 grayscale-[35%]"
          )}
        />
        {hasDiscount && <DiscountBadge percentage={product.discountPercentage} className="absolute top-2.5 left-2.5" />}
        {product.stockStatus !== "in_stock" && (
          <span className="absolute bottom-2.5 left-2.5 rounded-md bg-surface/95 px-2 py-1 text-[11px] leading-none font-semibold text-ink-soft shadow-sm">
            {stock.label}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-0.5 pt-3">
        <h3 className="line-clamp-2 font-sans text-sm tracking-normal leading-snug font-semibold text-ink transition-colors group-hover:text-brand">
          {product.title}
        </h3>

        <div className="mt-auto pt-2">
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-base font-bold text-ink tabular-nums">
              {formatPrice(product.finalPrice)}
              <span className="sr-only"> per {unitLabel(product.unit)}</span>
            </span>
            {hasDiscount && (
              <span className="text-xs text-ink-faint tabular-nums line-through">
                <span className="sr-only">Base price </span>
                {formatPrice(product.basePrice)}
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">
            <span aria-hidden>per {unitLabel(product.unit)} · </span>
            Min. {product.minOrderQty.toLocaleString("en-IN")} {product.unit}
          </p>
        </div>
      </div>
    </Link>
  );
}
