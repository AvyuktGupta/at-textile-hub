"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

export function AccountMenu() {
  const { status, user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Close the menu if this UI is hidden by a navigation (Activity keeps state otherwise).
  useLayoutEffect(() => () => setOpen(false), []);

  if (status === "loading") {
    return <div className="h-9 w-24 animate-pulse rounded-full bg-sunken" aria-hidden />;
  }

  if (!user) {
    return (
      <Link href="/login" className={cn(buttonClasses("secondary", "sm"), "rounded-full")}>
        <UserRound aria-hidden />
        Sign in
      </Link>
    );
  }

  const firstName = user.name.split(" ")[0];
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 items-center gap-2 rounded-full border border-line bg-surface py-1 pr-2.5 pl-1 text-sm font-semibold text-ink shadow-sm transition hover:border-line-strong"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
          {initials}
        </span>
        <span className="hidden max-w-28 truncate sm:inline">{firstName}</span>
        <ChevronDown className={cn("size-4 text-ink-muted transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute top-full right-0 z-50 mt-2 w-60 overflow-hidden rounded-card border border-line bg-surface shadow-lift"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
            <p className="truncate text-xs text-ink-muted">{user.business?.companyName || user.email}</p>
          </div>
          <div className="p-1.5">
            {isAdmin && (
              <Link
                href="/admin"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-soft hover:bg-sunken hover:text-ink"
              >
                <LayoutDashboard className="size-4" aria-hidden />
                Admin dashboard
              </Link>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-ink-soft hover:bg-sunken hover:text-ink"
            >
              <LogOut className="size-4" aria-hidden />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
