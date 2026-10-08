"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, apiFetch, type ApiResponse } from "@/lib/api";
import type { CartItem } from "@/lib/cart-store";
import type { CartQuote } from "@/types";

const DEBOUNCE_MS = 350;

/**
 * Re-prices the cart on the server whenever its contents change (debounced while typing).
 * `quote` is only returned when it matches the current cart, so totals are never shown for a stale cart.
 */
export function useCartQuote(items: CartItem[] | undefined) {
  const key = useMemo(
    () => (items ?? []).map((item) => `${item.productId}:${item.quantity}`).join("|"),
    [items]
  );
  const [result, setResult] = useState<{ key: string; quote?: CartQuote; error?: string } | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const payload = key.split("|").map((entry) => {
      const [productId, quantity] = entry.split(":");
      return { productId, quantity: Number(quantity) };
    });

    const timer = window.setTimeout(() => {
      apiFetch<ApiResponse<CartQuote>>("/cart/quote", { method: "POST", body: { items: payload } })
        .then((res) => {
          if (!cancelled) setResult({ key, quote: res.data });
        })
        .catch((err) => {
          if (!cancelled) {
            setResult({
              key,
              error: err instanceof ApiError ? err.message : "Couldn't check current prices.",
            });
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [key, refreshCount]);

  const current = result?.key === key ? result : null;
  return {
    quote: current?.quote,
    error: current?.error,
    pending: Boolean(key) && !current,
    refresh: () => {
      setResult(null);
      setRefreshCount((count) => count + 1);
    },
  };
}
