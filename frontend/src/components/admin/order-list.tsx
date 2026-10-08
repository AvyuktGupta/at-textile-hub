"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Inbox, Mail, Phone, Search } from "lucide-react";
import { PageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { adminApi } from "@/lib/admin-api";
import { ApiError, type Paginated } from "@/lib/api";
import { EMAIL_STATUS_META, ORDER_STATUS_OPTIONS, formatOrderDate, orderStatusMeta } from "@/lib/orders";
import { formatPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import type { Order, OrderStatus } from "@/types";

const PAGE_SIZE = 20;

export function OrderList() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState({ q: "", status: "", page: 1 });
  const [result, setResult] = useState<{ key: string; data?: Paginated<Order>; error?: string } | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  // Debounce typing into the search box.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery((current) => (current.q === search.trim() ? current : { ...current, q: search.trim(), page: 1 }));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const key = `${query.q}|${query.status}|${query.page}|${reloadCount}`;

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    adminApi
      .listOrders(token, { ...query, limit: PAGE_SIZE })
      .then((data) => !cancelled && setResult({ key, data }))
      .catch((err) => !cancelled && setResult({ key, error: err instanceof ApiError ? err.message : "Couldn't load orders" }));
    return () => {
      cancelled = true;
    };
  }, [token, query, key]);

  const current = result?.key === key ? result : null;
  const shown = current ?? result; // keep the previous page visible while the next one loads
  const pagination = shown?.data?.pagination;

  const replaceOrder = (order: Order) =>
    setResult((prev) =>
      prev?.data
        ? { ...prev, data: { ...prev.data, data: prev.data.data.map((o) => (o._id === order._id ? order : o)) } }
        : prev
    );

  return (
    <>
      <PageHeader title="Orders" description="Submitted orders, newest first. Buyers are emailed a copy automatically." />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-faint" aria-hidden />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Order number, company, email or phone"
            className="pl-10"
            aria-label="Search orders"
          />
        </div>
        <Select
          value={query.status}
          onChange={(event) => setQuery((q) => ({ ...q, status: event.target.value, page: 1 }))}
          className="sm:w-48"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {ORDER_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {shown?.error ? (
        <Card className="p-6 text-center text-sm text-danger">
          {shown.error}{" "}
          <button type="button" className="font-semibold underline" onClick={() => setReloadCount((c) => c + 1)}>
            Retry
          </button>
        </Card>
      ) : !shown?.data ? (
        <div className="space-y-3" aria-busy aria-label="Loading orders">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-card bg-sunken" />
          ))}
        </div>
      ) : !shown.data.data.length ? (
        <Card className="flex flex-col items-center px-6 py-14 text-center">
          <Inbox className="size-7 text-ink-faint" aria-hidden />
          <p className="mt-3 font-semibold text-ink">{query.q || query.status ? "No matching orders" : "No orders yet"}</p>
          <p className="mt-1 text-sm text-ink-muted">
            {query.q || query.status ? "Try a different search or status." : "Orders appear here as soon as buyers submit them."}
          </p>
        </Card>
      ) : (
        <ul className={cn("space-y-3 transition-opacity", !current && "opacity-60")}>
          {shown.data.data.map((order) => (
            <OrderCard key={order._id} order={order} token={token!} onChange={replaceOrder} />
          ))}
        </ul>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-ink-muted">
          <span>
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} orders
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}
            >
              <ChevronLeft aria-hidden /> Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}
            >
              Next <ChevronRight aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function OrderCard({ order, token, onChange }: { order: Order; token: string; onChange: (order: Order) => void }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const status = orderStatusMeta(order.status);
  const businessEmail = order.emails?.business;
  const c = order.customer;
  const address = c.shippingAddress ?? {};

  async function run(label: string, action: () => Promise<{ data: Order }>, report: (order: Order) => void) {
    setBusy(label);
    try {
      const res = await action();
      onChange(res.data);
      report(res.data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  const changeStatus = (next: OrderStatus) =>
    run("status", () => adminApi.updateOrderStatus(token, order._id, next), () =>
      toast.success(`${order.orderNumber} marked ${orderStatusMeta(next).label.toLowerCase()}`)
    );

  const resend = (target: "business" | "customer") =>
    run(target, () => adminApi.resendOrderEmail(token, order._id, target), (updated) => {
      const delivery = updated.emails?.[target];
      if (delivery?.status === "sent") toast.success(`Email sent to ${delivery.to}`);
      else if (delivery?.status === "skipped") toast.error("Not sent: SMTP isn't configured on the server");
      else toast.error(delivery?.error ? `Couldn't send: ${delivery.error}` : "Couldn't send the email");
    });

  return (
    <li>
      <Card className="overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex w-full items-center gap-4 px-4 py-4 text-left hover:bg-sunken/40 sm:px-5"
        >
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold text-ink">{order.orderNumber}</span>
              <Badge tone={status.tone}>{status.label}</Badge>
              {businessEmail && businessEmail.status !== "sent" && (
                <Badge tone={EMAIL_STATUS_META[businessEmail.status].tone}>{EMAIL_STATUS_META[businessEmail.status].label}</Badge>
              )}
            </p>
            <p className="mt-1 truncate text-sm text-ink-soft">
              <span className="font-semibold text-ink">{c.companyName}</span> · {c.name}
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">
              {formatOrderDate(order.createdAt, true)} · {order.itemCount} {order.itemCount === 1 ? "product" : "products"} ·{" "}
              {order.totalQuantity.toLocaleString("en-IN")} units
            </p>
          </div>
          <span className="text-base font-bold text-ink tabular-nums">{formatPrice(order.subtotal)}</span>
          <ChevronDown className={cn("size-4 shrink-0 text-ink-muted transition-transform", open && "rotate-180")} aria-hidden />
        </button>

        {open && (
          <div className="border-t border-line px-4 py-5 sm:px-5">
            <div className="grid gap-5 text-sm sm:grid-cols-3">
              <div>
                <h3 className="font-sans text-xs font-semibold tracking-wide text-ink-muted uppercase">Contact</h3>
                <p className="mt-1.5 font-semibold text-ink">{c.name}</p>
                <a href={`mailto:${c.email}`} className="mt-1 flex items-center gap-1.5 text-brand hover:underline">
                  <Mail className="size-3.5" aria-hidden /> {c.email}
                </a>
                <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="mt-1 flex items-center gap-1.5 text-brand hover:underline">
                  <Phone className="size-3.5" aria-hidden /> {c.phone}
                </a>
              </div>
              <div>
                <h3 className="font-sans text-xs font-semibold tracking-wide text-ink-muted uppercase">Business</h3>
                <p className="mt-1.5 font-semibold text-ink">{c.companyName}</p>
                {c.businessType && <p className="text-ink-soft">{c.businessType}</p>}
                {c.gstin && <p className="text-ink-soft">GSTIN {c.gstin}</p>}
              </div>
              <div>
                <h3 className="font-sans text-xs font-semibold tracking-wide text-ink-muted uppercase">Ship to</h3>
                <p className="mt-1.5 leading-relaxed text-ink-soft">
                  {address.line1}
                  {address.line2 && <>, {address.line2}</>}
                  <br />
                  {address.city}, {address.state} {address.postalCode}
                  <br />
                  {address.country}
                </p>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[32rem] text-sm">
                <thead className="bg-sunken/60 text-left text-xs text-ink-muted">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Product</th>
                    <th className="px-3 py-2 text-right font-semibold">Qty</th>
                    <th className="px-3 py-2 text-right font-semibold">Unit price</th>
                    <th className="px-3 py-2 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {order.items.map((item) => (
                    <tr key={item.product}>
                      <td className="px-3 py-2.5">
                        <span className="font-medium text-ink">{item.title}</span>
                        <span className="block text-xs text-ink-muted">SKU {item.sku}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums">
                        {item.quantity.toLocaleString("en-IN")} {item.unit}
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums">
                        {formatPrice(item.unitPrice)}
                        {item.discountPercentage > 0 && (
                          <span className="block text-xs text-clay">{item.discountPercentage}% off</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold whitespace-nowrap tabular-nums">
                        {formatPrice(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-line">
                    <td colSpan={3} className="px-3 py-2.5 text-right font-semibold">
                      Order total
                    </td>
                    <td className="px-3 py-2.5 text-right text-base font-bold tabular-nums">{formatPrice(order.subtotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {order.notes && (
              <p className="mt-4 rounded-lg bg-sunken/60 px-3.5 py-2.5 text-sm whitespace-pre-line text-ink-soft">
                <span className="font-semibold text-ink">Buyer notes: </span>
                {order.notes}
              </p>
            )}

            <div className="mt-5 flex flex-col gap-4 border-t border-line pt-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
                {(["business", "customer"] as const).map((target) => {
                  const delivery = order.emails?.[target];
                  const meta = delivery ? EMAIL_STATUS_META[delivery.status] : null;
                  return (
                    <div key={target}>
                      <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                        {target === "business" ? "Order email to you" : "Confirmation to buyer"}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        {meta && <Badge tone={meta.tone}>{meta.label}</Badge>}
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={busy === target}
                          disabled={Boolean(busy)}
                          onClick={() => resend(target)}
                        >
                          {delivery?.status === "sent" ? "Send again" : "Resend"}
                        </Button>
                      </div>
                      {delivery?.error && delivery.status === "failed" && (
                        <p className="mt-1 max-w-xs text-xs text-danger">{delivery.error}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <label className="flex items-center gap-2 text-sm text-ink-muted">
                Status
                <Select
                  value={order.status}
                  disabled={Boolean(busy)}
                  onChange={(event) => changeStatus(event.target.value as OrderStatus)}
                  className="h-10 w-44"
                >
                  {ORDER_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
          </div>
        )}
      </Card>
    </li>
  );
}
