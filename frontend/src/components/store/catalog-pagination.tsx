import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { catalogHref, type CatalogQuery } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/** First, last, current ±1, with gaps collapsed: 1 … 4 5 6 … 12 */
function pageWindow(current: number, total: number): (number | "gap")[] {
  const pages = new Set([1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((page, i) => (i > 0 && page - sorted[i - 1] > 1 ? ["gap" as const, page] : [page]));
}

export function CatalogPagination({ query, totalPages }: { query: CatalogQuery; totalPages: number }) {
  if (totalPages <= 1) return null;
  const current = Math.min(query.page, totalPages);
  const href = (page: number) => catalogHref(query, { page });

  const arrow = "flex h-10 items-center gap-1 rounded-full px-3 text-sm font-medium";

  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-1">
      {current > 1 ? (
        <Link href={href(current - 1)} className={cn(arrow, "text-ink-soft hover:bg-sunken")} rel="prev">
          <ChevronLeft className="size-4" aria-hidden />
          <span className="hidden sm:inline">Previous</span>
          <span className="sr-only sm:hidden">Previous page</span>
        </Link>
      ) : (
        <span className={cn(arrow, "text-ink-faint")} aria-hidden>
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Previous</span>
        </span>
      )}

      {pageWindow(current, totalPages).map((page, i) =>
        page === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-ink-faint" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={page}
            href={href(page)}
            aria-current={page === current ? "page" : undefined}
            className={cn(
              "flex size-10 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
              page === current ? "bg-ink text-white" : "text-ink-soft hover:bg-sunken"
            )}
          >
            {page}
          </Link>
        )
      )}

      {current < totalPages ? (
        <Link href={href(current + 1)} className={cn(arrow, "text-ink-soft hover:bg-sunken")} rel="next">
          <span className="hidden sm:inline">Next</span>
          <span className="sr-only sm:hidden">Next page</span>
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className={cn(arrow, "text-ink-faint")} aria-hidden>
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
