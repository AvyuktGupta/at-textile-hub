"use client";

import Link from "next/link";
import { Loader2, LockKeyhole, MapPin, Pencil } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import { withNext } from "@/lib/navigation";
import { isProfileComplete } from "@/lib/profile-form";
import { formatPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import type { User } from "@/types";

interface CheckoutPanelProps {
  subtotal: number;
  productCount: number;
  totalQuantity: number;
  pricing: "current" | "updating" | "failed";
  blocked: boolean;
  notes: string;
  onNotesChange: (notes: string) => void;
  submitting: boolean;
  error: string | null;
  onSubmit: () => void;
}

export function CheckoutPanel(props: CheckoutPanelProps) {
  const { subtotal, productCount, totalQuantity, pricing, blocked, submitting, error } = props;
  const { status, user } = useAuth();

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
      <h2 className="font-sans text-base font-semibold tracking-normal">Order summary</h2>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between text-ink-soft">
          <dt>Products</dt>
          <dd className="tabular-nums">{productCount}</dd>
        </div>
        <div className="flex justify-between text-ink-soft">
          <dt>Total units</dt>
          <dd className="tabular-nums">{totalQuantity.toLocaleString("en-IN")}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <dt className="font-semibold text-ink">Order total</dt>
          <dd className="flex items-center gap-2 text-xl font-bold text-ink tabular-nums">
            {pricing === "updating" && <Loader2 className="size-4 animate-spin text-ink-faint" aria-label="Updating prices" />}
            {formatPrice(subtotal)}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-xs leading-relaxed text-ink-muted">
        No payment is taken online. Taxes and delivery, if any, are confirmed with your invoice.
      </p>

      <div className="mt-5 border-t border-line pt-5">
        {status === "loading" ? (
          <div className="h-24 animate-pulse rounded-xl bg-sunken" aria-hidden />
        ) : !user ? (
          <SignInPrompt />
        ) : !isProfileComplete(user) ? (
          <IncompleteProfile />
        ) : (
          <>
            <DeliverTo user={user} />
            <Field label="Notes for our team" htmlFor="order-notes" hint="Delivery window, print artwork, carton split…" className="mt-4">
              <Textarea
                id="order-notes"
                value={props.notes}
                maxLength={1000}
                onChange={(event) => props.onNotesChange(event.target.value)}
                className="min-h-20"
              />
            </Field>

            {error && (
              <p role="alert" className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}

            <Button
              size="lg"
              className="mt-4 w-full rounded-xl"
              loading={submitting}
              disabled={blocked || pricing !== "current"}
              onClick={props.onSubmit}
            >
              {submitting ? "Submitting order…" : "Submit order"}
            </Button>
            <p className="mt-2 text-center text-xs text-ink-muted">
              {blocked
                ? "Fix the highlighted items to continue."
                : pricing === "failed"
                  ? "We couldn't confirm current prices. Please refresh."
                  : `We'll email a copy to ${user.email}.`}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function DeliverTo({ user }: { user: User }) {
  const address = user.business?.shippingAddress ?? {};
  return (
    <div className="flex items-start gap-3 rounded-xl bg-sunken/70 p-3.5 text-sm">
      <MapPin className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden />
      <div className="min-w-0 flex-1 leading-relaxed text-ink-soft">
        <p className="font-semibold text-ink">{user.business?.companyName}</p>
        <p>
          {[address.line1, address.line2].filter(Boolean).join(", ")}
          <br />
          {address.city}, {address.state} {address.postalCode}
        </p>
        <p className="mt-1 text-ink-muted">
          {user.name} · {user.phone}
        </p>
      </div>
      <Link href="/account" className="-m-1 rounded-md p-1 text-ink-muted hover:text-brand" aria-label="Edit delivery details">
        <Pencil className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

function SignInPrompt() {
  return (
    <div className="text-center">
      <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-brand-soft text-brand">
        <LockKeyhole className="size-4" aria-hidden />
      </span>
      <p className="mt-3 text-sm font-semibold text-ink">Sign in to submit your order</p>
      <p className="mt-1 text-[13px] text-ink-muted">Orders are for registered trade accounts. Your cart is saved.</p>
      <div className="mt-4 grid gap-2">
        <Link href={withNext("/login", "/cart")} className={cn(buttonClasses("primary", "md"), "w-full rounded-xl")}>
          Sign in
        </Link>
        <Link href={withNext("/register", "/cart")} className={cn(buttonClasses("secondary", "md"), "w-full rounded-xl")}>
          Open a trade account
        </Link>
      </div>
    </div>
  );
}

function IncompleteProfile() {
  return (
    <div>
      <p className="text-sm font-semibold text-ink">Add your business details</p>
      <p className="mt-1 text-[13px] text-ink-muted">
        We need a phone number, company name and shipping address before we can take an order.
      </p>
      <Link href="/account" className={cn(buttonClasses("primary", "md"), "mt-4 w-full rounded-xl")}>
        Complete your details
      </Link>
    </div>
  );
}
