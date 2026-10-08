import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10 sm:justify-center sm:py-16">
      <Link href="/" className="mb-8 font-display text-2xl font-semibold text-ink">
        {siteConfig.shortName}
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
        <h1 className="text-2xl">Sign in</h1>
        <p className="mt-1 text-sm text-ink-muted">Access wholesale pricing and your trade account.</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
