"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OrderHistory } from "@/components/account/order-history";
import { PasswordSection } from "@/components/account/password-section";
import { ProfileSection } from "@/components/account/profile-section";
import { withNext } from "@/lib/navigation";
import { isProfileComplete } from "@/lib/profile-form";
import { useAuth } from "@/providers/auth-provider";

export function AccountView() {
  const router = useRouter();
  const { status, user, token } = useAuth();

  useEffect(() => {
    if (status === "anonymous") router.replace(withNext("/login", "/account"));
  }, [status, router]);

  if (!user || !token) {
    return (
      <div aria-busy aria-label="Loading your account" className="space-y-6">
        <div className="h-10 w-56 animate-pulse rounded-lg bg-sunken" />
        <div className="h-96 animate-pulse rounded-card bg-sunken" />
      </div>
    );
  }

  return (
    <>
      <div>
        <h1 className="text-3xl sm:text-4xl">Your account</h1>
        <p className="mt-1 text-sm text-ink-muted">{user.business?.companyName || user.name}</p>
      </div>

      {!isProfileComplete(user) && (
        <p className="mt-6 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-ink-soft">
          Add your phone number, company name and shipping address below so you can submit orders.
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_24rem] lg:items-start">
        <div className="flex flex-col gap-6">
          <ProfileSection user={user} />
          <PasswordSection email={user.email} />
        </div>
        <div className="lg:sticky lg:top-24">
          <OrderHistory token={token} />
        </div>
      </div>
    </>
  );
}
