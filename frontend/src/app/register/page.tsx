import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Open a trade account",
  description: `Register your business with ${siteConfig.name} to place wholesale orders.`,
};

export default function RegisterPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10 sm:py-14">
      <Link href="/" className="mb-8 font-display text-2xl font-semibold text-ink">
        {siteConfig.shortName}
      </Link>
      <div className="w-full max-w-3xl rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-10">
        <h1 className="text-2xl sm:text-3xl">Open a trade account</h1>
        <p className="mt-1.5 max-w-xl text-sm text-ink-muted">
          One-time setup. Your business and delivery details are attached to every order, so our team can confirm it
          without chasing you for information.
        </p>
        <Suspense>
          <RegisterForm />
        </Suspense>
      </div>
    </main>
  );
}
