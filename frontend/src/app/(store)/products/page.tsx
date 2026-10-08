import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Check, SearchX, X } from "lucide-react";
import { CatalogPagination } from "@/components/store/catalog-pagination";
import { ProductGrid, ProductGridSkeleton } from "@/components/store/product-grid";
import { SortSelect } from "@/components/store/sort-select";
import { StoreUnavailable } from "@/components/store/store-unavailable";
import { buttonClasses } from "@/components/ui/button";
import { SORT_OPTIONS, catalogHref, formatTag, parseCatalogQuery, type CatalogQuery } from "@/lib/catalog";
import { getCatalog, getCatalogTags } from "@/lib/storefront";
import { cn } from "@/lib/utils";
import type { TagCount } from "@/types";

export const metadata: Metadata = {
  title: "Catalogue",
  description: "Browse wholesale cups, lids and food containers with per-unit pricing and minimum order quantities.",
};

export default function CatalogPage({ searchParams }: PageProps<"/products">) {
  return (
    <div className="container-page py-6 sm:py-10">
      <Suspense fallback={<CatalogSkeleton />}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Catalog({ searchParams }: Pick<PageProps<"/products">, "searchParams">) {
  const query = parseCatalogQuery(await searchParams);
  const [result, tags] = await Promise.all([getCatalog(query), getCatalogTags()]);
  if (!result) return <StoreUnavailable />;

  const { data: products, pagination } = result;
  const toggleTag = (tag: string) =>
    catalogHref(query, {
      tags: query.tags.includes(tag) ? query.tags.filter((t) => t !== tag) : [...query.tags, tag].sort(),
    });
  const filtered = Boolean(query.q || query.tags.length);

  const heading = query.q
    ? `Results for “${query.q}”`
    : query.tags.length === 1
      ? formatTag(query.tags[0])
      : "Catalogue";

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl capitalize sm:text-4xl">{heading}</h1>
        <p className="text-sm text-ink-muted">
          {pagination.total.toLocaleString("en-IN")} {pagination.total === 1 ? "product" : "products"}
          {query.tags.length > 1 && " matching any selected type"}
        </p>
      </header>

      <div className="mt-6 lg:mt-8 lg:grid lg:grid-cols-[14rem_1fr] lg:gap-10">
        <TagFilters tags={tags} query={query} toggleTag={toggleTag} />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <ActiveFilters query={query} toggleTag={toggleTag} />
            <SortSelect
              value={query.sort}
              options={SORT_OPTIONS.map((option) => ({
                ...option,
                href: catalogHref(query, { sort: option.value }),
              }))}
            />
          </div>

          <div className="mt-6">
            {products.length ? (
              <>
                <ProductGrid products={products} />
                <CatalogPagination query={query} totalPages={pagination.totalPages} />
              </>
            ) : (
              <EmptyResults filtered={filtered} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function TagFilters({
  tags,
  query,
  toggleTag,
}: {
  tags: TagCount[];
  query: CatalogQuery;
  toggleTag: (tag: string) => string;
}) {
  if (!tags.length) return null;

  // On the swipeable row, keep selected types in view by listing them first.
  const selectedFirst = [...tags].sort(
    (a, b) => Number(query.tags.includes(b.tag)) - Number(query.tags.includes(a.tag))
  );

  return (
    <nav aria-label="Filter by type" className="mb-4 lg:mb-0">
      <h2 className="hidden font-sans text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase lg:block">
        Product type
      </h2>

      {/* Mobile and tablet: one swipeable row of chips. */}
      <ul className="scroll-rail -mx-(--page-pad) gap-2 px-(--page-pad) pb-1 lg:hidden">
        {selectedFirst.map(({ tag }) => {
          const active = query.tags.includes(tag);
          return (
            <li key={tag}>
              <Link
                href={toggleTag(tag)}
                aria-current={active ? "true" : undefined}
                scroll={false}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium capitalize transition",
                  active
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-surface text-ink-soft hover:border-brand/40 hover:text-brand"
                )}
              >
                {active && <Check className="size-3.5" aria-hidden />}
                {formatTag(tag)}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Desktop: checklist sidebar. */}
      <ul className="mt-3 hidden space-y-0.5 lg:block">
        {tags.map(({ tag, count }) => {
          const active = query.tags.includes(tag);
          return (
            <li key={tag}>
              <Link
                href={toggleTag(tag)}
                aria-current={active ? "true" : undefined}
                scroll={false}
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm capitalize transition-colors",
                  active ? "font-semibold text-ink" : "text-ink-soft hover:bg-sunken hover:text-ink"
                )}
              >
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                    active ? "border-brand bg-brand text-white" : "border-line-strong bg-surface group-hover:border-ink-faint"
                  )}
                  aria-hidden
                >
                  {active && <Check className="size-3" strokeWidth={3} />}
                </span>
                <span className="flex-1 truncate">{formatTag(tag)}</span>
                <span className="text-xs text-ink-faint tabular-nums">{count}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ActiveFilters({ query, toggleTag }: { query: CatalogQuery; toggleTag: (tag: string) => string }) {
  if (!query.q && !query.tags.length) {
    return <span className="text-sm text-ink-muted">All products</span>;
  }

  const chip =
    "inline-flex h-8 items-center gap-1.5 rounded-full bg-sunken pr-2 pl-3 text-sm text-ink-soft capitalize transition hover:bg-line";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {query.q && (
        <Link href={catalogHref(query, { q: "" })} className={chip} scroll={false}>
          <span className="normal-case">“{query.q}”</span>
          <X className="size-3.5" aria-label="Clear search" />
        </Link>
      )}
      {query.tags.map((tag) => (
        <Link key={tag} href={toggleTag(tag)} className={chip} scroll={false}>
          {formatTag(tag)}
          <X className="size-3.5" aria-label={`Remove ${formatTag(tag)} filter`} />
        </Link>
      ))}
      <Link
        href={catalogHref(query, { q: "", tags: [] })}
        className="px-1 text-sm font-semibold text-brand hover:underline"
        scroll={false}
      >
        Clear all
      </Link>
    </div>
  );
}

function EmptyResults({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong px-6 py-16 text-center">
      <SearchX className="size-6 text-ink-faint" aria-hidden />
      <h2 className="mt-4 text-xl">{filtered ? "Nothing matches those filters" : "No products yet"}</h2>
      <p className="mt-1.5 max-w-sm text-sm text-ink-muted">
        {filtered
          ? "Try removing a filter or searching by SKU. Need something specific? Ask us about custom runs."
          : "Our catalogue is being updated. Please check back shortly."}
      </p>
      {filtered && (
        <Link href="/products" className={cn(buttonClasses("secondary", "sm"), "mt-5 rounded-full")}>
          View all products
        </Link>
      )}
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div aria-busy aria-label="Loading products">
      <div className="h-9 w-48 animate-pulse rounded-lg bg-sunken" />
      <div className="mt-2 h-4 w-24 animate-pulse rounded bg-sunken" />
      <div className="mt-8 lg:grid lg:grid-cols-[14rem_1fr] lg:gap-10">
        <div className="hidden space-y-2 lg:block">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-7 animate-pulse rounded-lg bg-sunken" />
          ))}
        </div>
        <div>
          <div className="mb-6 h-10 animate-pulse rounded-full bg-sunken sm:w-1/2" />
          <ProductGridSkeleton />
        </div>
      </div>
    </div>
  );
}
