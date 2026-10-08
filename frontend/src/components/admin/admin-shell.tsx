"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardList, ExternalLink, LogOut, Package, Settings2, ShieldAlert } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

const NAV = [
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/settings", label: "Site settings", icon: Settings2 },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { status, user, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === "anonymous") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [status, pathname, router]);

  if (status !== "authenticated") return <ShellSkeleton />;

  if (!isAdmin) {
    return (
      <main className="container-page flex flex-1 flex-col items-center justify-center py-24 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-clay-soft text-clay">
          <ShieldAlert className="size-6" aria-hidden />
        </span>
        <h1 className="mt-5 text-3xl">Admins only</h1>
        <p className="mt-2 max-w-sm text-ink-muted">
          You&apos;re signed in as {user?.email}, which doesn&apos;t have access to the dashboard.
        </p>
        <Link href="/" className={cn(buttonClasses("secondary"), "mt-6")}>
          Back to the store
        </Link>
      </main>
    );
  }

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <aside className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur lg:h-dvh lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex h-14 items-center justify-between gap-3 px-4 lg:h-auto lg:flex-col lg:items-stretch lg:gap-0 lg:px-5 lg:pt-6">
          <Link href="/admin" className="flex items-baseline gap-2">
            <span className="font-display text-lg font-semibold text-ink">{siteConfig.shortName}</span>
            <span className="rounded bg-sunken px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-ink-muted uppercase">
              Admin
            </span>
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-ink-muted hover:bg-sunken hover:text-ink lg:hidden"
          >
            <LogOut className="size-4" aria-hidden /> Sign out
          </button>
        </div>

        <nav
          aria-label="Admin"
          className="scroll-rail gap-1 px-3 pb-2 lg:mt-8 lg:flex-col lg:overflow-visible lg:px-3 lg:pb-0"
        >
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-brand-soft text-brand" : "text-ink-muted hover:bg-sunken hover:text-ink"
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            );
          })}
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-sunken hover:text-ink"
          >
            <ExternalLink className="size-4" aria-hidden />
            View store
          </Link>
        </nav>

        <div className="mt-auto hidden border-t border-line px-5 py-4 lg:absolute lg:inset-x-0 lg:bottom-0 lg:block">
          <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
          <p className="truncate text-[13px] text-ink-muted">{user?.email}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-3 flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
          >
            <LogOut className="size-4" aria-hidden /> Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}

export function ShellSkeleton() {
  return (
    <div className="flex flex-1 items-center justify-center py-24" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-3 text-sm text-ink-muted">
        <span className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-brand" />
        Checking your session…
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[28px] leading-tight sm:text-[34px]">{title}</h1>
        {description && <p className="mt-1 text-[15px] text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}
