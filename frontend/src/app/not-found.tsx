import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="container-page flex flex-1 flex-col items-center justify-center py-24 text-center">
      <p className="font-display text-6xl text-ink-faint">404</p>
      <h1 className="mt-4 text-2xl sm:text-3xl">We couldn’t find that page</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        The product may have been renamed or removed from the catalogue.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/products" className={cn(buttonClasses("primary", "md"), "rounded-full")}>
          Browse catalogue
        </Link>
        <Link href="/" className={cn(buttonClasses("secondary", "md"), "rounded-full")}>
          Home
        </Link>
      </div>
    </main>
  );
}
