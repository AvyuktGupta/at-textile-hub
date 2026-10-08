"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { CartLine } from "@/components/cart/cart-line";
import { CheckoutPanel } from "@/components/cart/checkout-panel";
import { OrderPlaced } from "@/components/cart/order-placed";
import { useCartQuote } from "@/components/cart/use-cart-quote";
import { buttonClasses } from "@/components/ui/button";
import { ApiError, apiFetch, type ApiResponse } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useCart } from "@/providers/cart-provider";
import type { Order } from "@/types";

export function CartView() {
  const { items, setQuantity, remove, clear } = useCart();
  const { token } = useAuth();
  const { quote, error: quoteError, pending, refresh } = useCartQuote(items);

  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Order | null>(null);

  // One key per distinct cart: a retry after a dropped connection can't create a second order,
  // while changing the cart starts a fresh submission.
  const attempt = useRef<{ cartKey: string; key: string } | null>(null);
  const cartKey = useMemo(() => (items ?? []).map((i) => `${i.productId}:${i.quantity}`).join("|"), [items]);

  const linesById = useMemo(() => new Map(quote?.lines.map((line) => [line.productId, line])), [quote]);
  const issuesById = useMemo(() => new Map(quote?.issues.map((issue) => [issue.productId, issue])), [quote]);

  if (items === undefined) return <CartSkeleton />;
  if (placed && items.length === 0) return <OrderPlaced order={placed} />;
  if (items.length === 0) return <EmptyCart />;

  const subtotal = quote?.subtotal ?? items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const unavailableIds = quote?.issues.filter((i) => i.code !== "below_minimum").map((i) => i.productId) ?? [];

  async function submit() {
    if (!token || !items?.length) return;
    if (attempt.current?.cartKey !== cartKey) {
      attempt.current = { cartKey, key: randomKey() };
    }
    const idempotencyKey = attempt.current.key;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await apiFetch<ApiResponse<Order>>("/orders", {
        method: "POST",
        token,
        body: {
          items: items.map(({ productId, quantity }) => ({ productId, quantity })),
          notes,
          idempotencyKey,
        },
      });
      setPlaced(res.data);
      setNotes("");
      attempt.current = null;
      clear();
      window.scrollTo({ top: 0 });
    } catch (err) {
      if (err instanceof ApiError && err.status === 400 && err.details && !err.details.profile) {
        refresh(); // Prices or availability changed under us; show the updated issues inline.
      }
      setSubmitError(
        err instanceof ApiError
          ? err.status === 0
            ? "We couldn't reach the server, so we're not sure the order went through. Press Submit again; it won't create a duplicate."
            : err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl">Your order</h1>
          <p className="mt-1 text-sm text-ink-muted">Review quantities, then submit. Prices are per unit.</p>
        </div>
        <Link href="/products" className="text-sm font-semibold text-brand hover:underline">
          Continue browsing
        </Link>
      </div>

      <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-10">
        <section aria-label="Items in your order">
          {quoteError && (
            <p role="alert" className="mb-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              {quoteError}{" "}
              <button type="button" onClick={refresh} className="font-semibold underline">
                Try again
              </button>
            </p>
          )}
          {unavailableIds.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3.5 py-2.5 text-sm text-ink-soft">
              <span>
                {unavailableIds.length === 1 ? "One item is" : `${unavailableIds.length} items are`} no longer available.
              </span>
              <button
                type="button"
                onClick={() => unavailableIds.forEach(remove)}
                className="font-semibold text-brand hover:underline"
              >
                Remove {unavailableIds.length === 1 ? "it" : "them"}
              </button>
            </div>
          )}
          <ul className="divide-y divide-line border-y border-line">
            {items.map((item) => (
              <CartLine
                key={item.productId}
                item={item}
                line={linesById.get(item.productId)}
                issue={issuesById.get(item.productId)}
                onQuantity={(quantity) => setQuantity(item.productId, quantity)}
                onRemove={() => remove(item.productId)}
              />
            ))}
          </ul>
        </section>

        <aside className="lg:sticky lg:top-24">
          <CheckoutPanel
            subtotal={subtotal}
            productCount={items.length}
            totalQuantity={totalQuantity}
            pricing={quoteError ? "failed" : pending ? "updating" : "current"}
            blocked={Boolean(quote?.issues.length)}
            notes={notes}
            onNotesChange={setNotes}
            submitting={submitting}
            error={submitError}
            onSubmit={submit}
          />
        </aside>
      </div>
    </>
  );
}

/** crypto.randomUUID is unavailable on plain-http origins (e.g. testing on a phone over the LAN). */
function randomKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function EmptyCart() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center sm:py-24">
      <span className="flex size-14 items-center justify-center rounded-full bg-sunken text-ink-muted">
        <ShoppingBag className="size-6" aria-hidden />
      </span>
      <h1 className="mt-5 text-3xl">Your order is empty</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Add products from the catalogue. Each item shows its minimum order quantity.
      </p>
      <Link href="/products" className={cn(buttonClasses("primary", "lg"), "mt-6 rounded-full")}>
        Browse catalogue
      </Link>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div aria-busy aria-label="Loading your order">
      <div className="h-10 w-48 animate-pulse rounded-lg bg-sunken" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-sunken" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-2xl bg-sunken" />
      </div>
    </div>
  );
}
