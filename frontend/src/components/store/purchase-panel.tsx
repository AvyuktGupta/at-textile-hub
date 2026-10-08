"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { QuantityStepper } from "@/components/store/quantity-stepper";
import { Button } from "@/components/ui/button";
import { unitLabel } from "@/lib/catalog";
import { formatPrice } from "@/lib/pricing";
import { useCart } from "@/providers/cart-provider";
import { useToast } from "@/providers/toast-provider";
import type { Product } from "@/types";

type PurchaseProduct = Pick<
  Product,
  "_id" | "title" | "slug" | "sku" | "images" | "unit" | "minOrderQty" | "finalPrice" | "stockStatus"
>;

export function PurchasePanel({ product }: { product: PurchaseProduct }) {
  const { add, quantityOf, items } = useCart();
  const toast = useToast();
  const min = Math.max(product.minOrderQty, 1);
  const [quantity, setQuantity] = useState(min);

  const belowMinimum = quantity < min;
  const unavailable = product.stockStatus === "out_of_stock";
  const inCart = quantityOf(product._id);
  const unit = unitLabel(product.unit);

  const handleAdd = () => {
    try {
      add(
        {
          productId: product._id,
          title: product.title,
          slug: product.slug,
          sku: product.sku,
          image: product.images[0]?.url ?? "",
          unit: product.unit,
          minOrderQty: product.minOrderQty,
          unitPrice: product.finalPrice,
          stockStatus: product.stockStatus,
        },
        quantity
      );
      toast.success(`Added ${quantity.toLocaleString("en-IN")} ${product.unit} to your order`, {
        label: "View order",
        href: "/cart",
      });
      setQuantity(min);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add this item");
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="quantity" className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
            Quantity ({product.unit})
          </label>
          <div className="mt-1.5">
            <QuantityStepper
              id="quantity"
              value={quantity}
              min={min}
              onChange={setQuantity}
              invalid={belowMinimum}
              describedBy="quantity-hint"
            />
          </div>
        </div>

        <div className="ml-auto text-right">
          <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">Line total</p>
          <p className="mt-1 text-2xl font-bold text-ink tabular-nums">{formatPrice(quantity * product.finalPrice)}</p>
        </div>
      </div>

      <p id="quantity-hint" className={belowMinimum ? "mt-2 text-xs text-danger" : "mt-2 text-xs text-ink-muted"}>
        {belowMinimum
          ? `Minimum order is ${min.toLocaleString("en-IN")} ${product.unit}.`
          : `${formatPrice(product.finalPrice)} per ${unit} · minimum ${min.toLocaleString("en-IN")} ${product.unit}`}
      </p>

      <Button
        size="lg"
        className="mt-4 w-full rounded-xl"
        disabled={unavailable || belowMinimum || items === undefined}
        onClick={handleAdd}
      >
        <ShoppingBag aria-hidden />
        {unavailable ? "Currently out of stock" : inCart ? "Add more to order" : "Add to order"}
      </Button>

      {inCart > 0 && (
        <p className="mt-2.5 text-center text-sm text-ink-muted">
          {inCart.toLocaleString("en-IN")} {product.unit} already in your order ·{" "}
          <Link href="/cart" className="font-semibold text-brand hover:underline">
            Review order
          </Link>
        </p>
      )}
    </div>
  );
}
