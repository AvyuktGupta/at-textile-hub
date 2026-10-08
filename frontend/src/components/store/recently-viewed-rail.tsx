"use client";

import { useEffect, useState } from "react";
import { ProductRail } from "@/components/store/product-rail";
import { apiFetch, type ApiResponse } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import type { ProductSummary } from "@/types";

/** Only rendered for signed-in buyers; stays out of the layout until there's something to show. */
export function RecentlyViewedRail() {
  const { status, token } = useAuth();
  const [result, setResult] = useState<{ token: string; products: ProductSummary[] } | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !token) return;
    let cancelled = false;
    apiFetch<ApiResponse<ProductSummary[]>>("/me/recently-viewed", { token, cache: "no-store" })
      .then((res) => {
        if (!cancelled) setResult({ token, products: res.data });
      })
      .catch(() => {
        // Non-essential row: hide it rather than surface an error.
        if (!cancelled) setResult({ token, products: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [status, token]);

  // Ignore results that belong to a previous session (e.g. after signing out and in as someone else).
  if (status !== "authenticated" || !result || result.token !== token || !result.products.length) return null;

  return (
    <ProductRail
      title="Recently viewed"
      description="Pick up where you left off."
      products={result.products}
    />
  );
}
