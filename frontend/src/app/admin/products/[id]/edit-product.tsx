"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { buttonClasses } from "@/components/ui/button";
import { adminApi } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import type { Product } from "@/types";

export function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token } = useAuth();
  const [state, setState] = useState<{ id: string; product?: Product; error?: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    adminApi
      .getProduct(token, id)
      .then((res) => !cancelled && setState({ id, product: res.data }))
      .catch((err) => {
        if (cancelled) return;
        const message =
          err instanceof ApiError && (err.status === 404 || err.status === 400)
            ? "This product doesn't exist or was deleted."
            : err instanceof ApiError
              ? err.message
              : "Could not load the product.";
        setState({ id, error: message });
      });
    return () => {
      cancelled = true;
    };
  }, [token, id]);

  if (!state || state.id !== id) return <EditProductSkeleton />;

  if (state.error || !state.product) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl">Product not found</h1>
        <p className="mt-2 text-ink-muted">{state.error}</p>
        <Link href="/admin/products" className={`${buttonClasses("secondary")} mt-6`}>
          Back to products
        </Link>
      </div>
    );
  }

  return <ProductForm key={state.product._id} product={state.product} />;
}

export function EditProductSkeleton() {
  return (
    <div aria-busy="true">
      <div className="mb-8 h-9 w-72 animate-pulse rounded-lg bg-sunken" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="h-96 animate-pulse rounded-card border border-line bg-surface" />
        <div className="h-72 animate-pulse rounded-card border border-line bg-surface" />
      </div>
    </div>
  );
}
