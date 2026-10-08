"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, PackageOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/card";
import { apiFetch, type ApiResponse } from "@/lib/api";
import { formatOrderDate, orderStatusMeta } from "@/lib/orders";
import { formatPrice } from "@/lib/pricing";
import type { Order } from "@/types";

export function OrderHistory({ token }: { token: string }) {
  const [state, setState] = useState<{ token: string; orders?: Order[]; error?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<ApiResponse<Order[]>>("/me/orders", { token, cache: "no-store" })
      .then((res) => !cancelled && setState({ token, orders: res.data }))
      .catch(() => !cancelled && setState({ token, error: "Couldn't load your orders." }));
    return () => {
      cancelled = true;
    };
  }, [token]);

  const current = state?.token === token ? state : null;

  return (
    <SectionCard id="orders" title="Your orders" description="Everything you've submitted, newest first." className="scroll-mt-28">
      {!current ? (
        <div className="space-y-3" aria-busy aria-label="Loading orders">
          {[0, 1].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-sunken" />
          ))}
        </div>
      ) : current.error ? (
        <p className="text-sm text-danger">{current.error}</p>
      ) : !current.orders?.length ? (
        <div className="flex flex-col items-center py-6 text-center">
          <PackageOpen className="size-6 text-ink-faint" aria-hidden />
          <p className="mt-3 text-sm text-ink-muted">You haven&apos;t placed any orders yet.</p>
          <Link href="/products" className="mt-2 text-sm font-semibold text-brand hover:underline">
            Browse the catalogue
          </Link>
        </div>
      ) : (
        <ul className="-my-2 divide-y divide-line">
          {current.orders.map((order) => (
            <OrderRow key={order._id} order={order} />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function OrderRow({ order }: { order: Order }) {
  const status = orderStatusMeta(order.status);
  return (
    <li>
      <details className="group py-2">
        <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg py-2 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold text-ink">{order.orderNumber}</span>
              <Badge tone={status.tone}>{status.label}</Badge>
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">
              {formatOrderDate(order.createdAt)} · {order.itemCount} {order.itemCount === 1 ? "product" : "products"}
            </p>
          </div>
          <span className="text-sm font-bold text-ink tabular-nums">{formatPrice(order.subtotal)}</span>
          <ChevronDown className="size-4 text-ink-muted transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="mt-2 rounded-xl bg-sunken/60 p-3.5">
          <table className="w-full text-sm">
            <thead className="sr-only">
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.product} className="align-top">
                  <td className="py-1.5 pr-3 text-ink-soft">
                    {item.slug ? (
                      <Link href={`/products/${item.slug}`} className="hover:text-brand">
                        {item.title}
                      </Link>
                    ) : (
                      item.title
                    )}
                    <span className="block text-xs text-ink-muted">
                      {formatPrice(item.unitPrice)} × {item.quantity.toLocaleString("en-IN")} {item.unit}
                    </span>
                  </td>
                  <td className="py-1.5 text-right font-semibold whitespace-nowrap text-ink tabular-nums">
                    {formatPrice(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {order.notes && <p className="mt-3 border-t border-line pt-3 text-xs text-ink-muted">Notes: {order.notes}</p>}
        </div>
      </details>
    </li>
  );
}
