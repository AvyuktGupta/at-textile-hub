import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { formatPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { Order } from "@/types";

export function OrderPlaced({ order }: { order: Order }) {
  const emailed = order.emails?.customer?.status === "sent";

  return (
    <div className="mx-auto max-w-xl py-6 text-center sm:py-12">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand">
        <CheckCircle2 className="size-7" aria-hidden />
      </span>
      <h1 className="mt-5 text-3xl sm:text-4xl">Order submitted</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
        Thanks, {order.customer.name.split(" ")[0]}. Our team has your order and will contact you shortly to confirm
        stock, invoicing and dispatch.{" "}
        {emailed ? `A copy has been sent to ${order.customer.email}.` : "You can find it any time under your account."}
      </p>

      <div className="mt-8 rounded-2xl border border-line bg-surface p-5 text-left shadow-card">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase">Order number</dt>
            <dd className="mt-1 font-mono text-base font-semibold text-ink">{order.orderNumber}</dd>
          </div>
          <div className="text-right">
            <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase">Total</dt>
            <dd className="mt-1 text-base font-bold text-ink tabular-nums">{formatPrice(order.subtotal)}</dd>
          </div>
        </dl>
        <ul className="mt-4 divide-y divide-line border-t border-line text-sm">
          {order.items.map((item) => (
            <li key={item.product} className="flex justify-between gap-4 py-2.5">
              <span className="min-w-0 truncate text-ink-soft">{item.title}</span>
              <span className="shrink-0 text-ink-muted tabular-nums">
                {item.quantity.toLocaleString("en-IN")} {item.unit}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/products" className={cn(buttonClasses("primary", "lg"), "rounded-full")}>
          Continue browsing
        </Link>
        <Link href="/account#orders" className={cn(buttonClasses("secondary", "lg"), "rounded-full")}>
          View your orders
        </Link>
      </div>
    </div>
  );
}
