"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/providers/cart-provider";

export function CartButton() {
  const { count } = useCart();
  const label = count ? `Your order, ${count} ${count === 1 ? "product" : "products"}` : "Your order";

  return (
    <Link
      href="/cart"
      aria-label={label}
      className="relative flex size-9 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-sm transition hover:border-line-strong"
    >
      <ShoppingBag className="size-4" aria-hidden />
      {count > 0 && (
        <span
          aria-hidden
          className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-clay px-1 text-[11px] leading-none font-bold text-white tabular-nums ring-2 ring-canvas"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
