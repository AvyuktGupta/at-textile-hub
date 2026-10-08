import Form from "next/form";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeaderSearch({ className, id }: { className?: string; id: string }) {
  return (
    <Form action="/products" role="search" className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-faint"
        aria-hidden
      />
      <input
        id={id}
        name="q"
        type="search"
        placeholder="Search cups, lids, SKUs…"
        autoComplete="off"
        enterKeyHint="search"
        maxLength={100}
        className="h-10 w-full rounded-full border border-line bg-surface pr-4 pl-10 text-sm text-ink shadow-sm transition placeholder:text-ink-faint focus:border-brand focus:ring-3 focus:ring-brand/15 focus:outline-none"
      />
    </Form>
  );
}
