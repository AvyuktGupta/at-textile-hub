"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, PackageOpen, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input, Select } from "@/components/ui/input";
import { MediaImage } from "@/components/ui/media-image";
import { adminApi, type ProductQuery, type TagCount } from "@/lib/admin-api";
import { ApiError, type Paginated } from "@/lib/api";
import { formatTag, stockStatusMeta } from "@/lib/catalog";
import { formatPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import type { Product } from "@/types";

const PAGE_SIZE = 20;

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function ProductList() {
  const { token } = useAuth();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<NonNullable<ProductQuery["status"]>>("all");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const q = useDebounced(search);

  const [result, setResult] = useState<Paginated<Product> | null>(null);
  const [tags, setTags] = useState<TagCount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const query = { q, status, tags: tag, sort, page, limit: PAGE_SIZE };
  const queryKey = JSON.stringify(query);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loading = loadedKey !== `${queryKey}:${reloadKey}`;

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const key = `${queryKey}:${reloadKey}`;
    adminApi
      .listProducts(token, JSON.parse(queryKey))
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Could not load products");
      })
      .finally(() => {
        if (!cancelled) setLoadedKey(key);
      });
    return () => {
      cancelled = true;
    };
  }, [token, queryKey, reloadKey]);

  useEffect(() => {
    if (!token) return;
    adminApi
      .listTags(token)
      .then((res) => setTags(res.data))
      .catch(() => setTags([]));
  }, [token, reloadKey]);

  const updateFilter = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  async function confirmDelete() {
    if (!token || !pendingDelete) return;
    setDeleting(true);
    try {
      await adminApi.deleteProduct(token, pendingDelete._id);
      toast.success(`Deleted “${pendingDelete.title}”`);
      setPendingDelete(null);
      if (result?.data.length === 1 && page > 1) setPage(page - 1);
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete product");
    } finally {
      setDeleting(false);
    }
  }

  const products = result?.data ?? [];
  const pagination = result?.pagination;
  const hasFilters = Boolean(q || tag || status !== "all");

  return (
    <>
      <PageHeader
        title="Products"
        description={pagination ? `${pagination.total} product${pagination.total === 1 ? "" : "s"}` : " "}
        actions={
          <Link href="/admin/products/new" className={buttonClasses("primary")}>
            <Plus /> Add product
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-[minmax(0,1fr)_10rem_12rem_11rem]">
        <div className="relative col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" />
          <Input
            type="search"
            value={search}
            onChange={(event) => updateFilter(setSearch)(event.target.value)}
            placeholder="Search by title, SKU or tag"
            className="pl-9"
            aria-label="Search products"
          />
        </div>
        <Select
          value={status}
          onChange={(event) => updateFilter(setStatus)(event.target.value as typeof status)}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Hidden</option>
        </Select>
        <Select value={tag} onChange={(event) => updateFilter(setTag)(event.target.value)} aria-label="Filter by tag">
          <option value="">All tags</option>
          {tags.map((t) => (
            <option key={t.tag} value={t.tag}>
              {formatTag(t.tag)} ({t.count})
            </option>
          ))}
        </Select>
        <Select
          value={sort}
          onChange={(event) => updateFilter(setSort)(event.target.value)}
          aria-label="Sort products"
          className="col-span-2 sm:col-span-1"
        >
          <option value="newest">Newest first</option>
          <option value="title">Title A–Z</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="discount">Biggest discount</option>
        </Select>
      </div>

      {error ? (
        <Card className="px-6 py-12 text-center">
          <p className="text-ink-soft">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={() => setReloadKey((k) => k + 1)}>
            Try again
          </Button>
        </Card>
      ) : !result ? (
        <ListSkeleton />
      ) : products.length === 0 ? (
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <PackageOpen className="size-10 text-ink-faint" aria-hidden />
          <p className="mt-4 font-medium text-ink">{hasFilters ? "No products match these filters" : "No products yet"}</p>
          <p className="mt-1 text-sm text-ink-muted">
            {hasFilters ? "Try a different search or clear the filters." : "Add your first product to start building the catalogue."}
          </p>
          {!hasFilters && (
            <Link href="/admin/products/new" className={cn(buttonClasses("primary"), "mt-5")}>
              <Plus /> Add product
            </Link>
          )}
        </Card>
      ) : (
        <div className={cn("transition-opacity", loading && "opacity-60")}>
          {/* Mobile: stacked cards */}
          <ul className="flex flex-col gap-2 md:hidden">
            {products.map((product) => (
              <li key={product._id}>
                <Card className="flex gap-3 p-3">
                  <MediaImage
                    src={product.images[0]?.url}
                    alt={product.title}
                    className="size-20 shrink-0 rounded-lg"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link href={`/admin/products/${product._id}`} className="truncate font-medium text-ink">
                      {product.title}
                    </Link>
                    <p className="text-xs text-ink-muted">{product.sku}</p>
                    <PriceCell product={product} className="mt-1" />
                    <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
                      <StatusBadges product={product} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Link
                      href={`/admin/products/${product._id}`}
                      className={buttonClasses("ghost", "icon")}
                      aria-label={`Edit ${product.title}`}
                    >
                      <Pencil />
                    </Link>
                    <Button
                      variant="danger-ghost"
                      size="icon"
                      onClick={() => setPendingDelete(product)}
                      aria-label={`Delete ${product.title}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-canvas text-xs font-semibold tracking-wide text-ink-muted uppercase">
                <tr>
                  <th className="py-3 pr-3 pl-5 font-semibold">Product</th>
                  <th className="px-3 py-3 font-semibold">Tags</th>
                  <th className="px-3 py-3 text-right font-semibold">Price</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="py-3 pr-5 pl-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {products.map((product) => (
                  <tr key={product._id} className="group hover:bg-canvas/60">
                    <td className="py-3 pr-3 pl-5">
                      <div className="flex items-center gap-3">
                        <MediaImage
                          src={product.images[0]?.url}
                          alt={product.title}
                          className="size-12 shrink-0 rounded-lg border border-line"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${product._id}`}
                            className="block max-w-xs truncate font-medium text-ink hover:text-brand"
                          >
                            {product.title}
                          </Link>
                          <p className="text-xs text-ink-muted">
                            {product.sku} · MOQ {product.minOrderQty} {product.unit}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex max-w-56 flex-wrap gap-1">
                        {product.tags.slice(0, 3).map((t) => (
                          <Badge key={t}>{formatTag(t)}</Badge>
                        ))}
                        {product.tags.length > 3 && <Badge>+{product.tags.length - 3}</Badge>}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <PriceCell product={product} className="justify-end" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        <StatusBadges product={product} />
                      </div>
                    </td>
                    <td className="py-3 pr-5 pl-3">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/admin/products/${product._id}`}
                          className={buttonClasses("ghost", "icon")}
                          aria-label={`Edit ${product.title}`}
                        >
                          <Pencil />
                        </Link>
                        <Button
                          variant="danger-ghost"
                          size="icon"
                          onClick={() => setPendingDelete(product)}
                          aria-label={`Delete ${product.title}`}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm text-ink-muted">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft /> Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next <ChevronRight />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this product?"
        description={
          <>
            <strong className="font-semibold text-ink">{pendingDelete?.title}</strong> will be removed from the
            catalogue and any uploaded images will be deleted. This can&apos;t be undone. To hide it temporarily, mark
            it as hidden instead.
          </>
        }
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}

function PriceCell({ product, className }: { product: Product; className?: string }) {
  return (
    <div className={cn("flex items-baseline gap-2 tabular-nums", className)}>
      {product.discountPercentage > 0 && (
        <>
          <span className="text-xs text-ink-faint line-through">{formatPrice(product.basePrice)}</span>
          <Badge tone="clay" className="px-1.5 text-[11px]">
            −{product.discountPercentage}%
          </Badge>
        </>
      )}
      <span className="font-semibold text-ink">{formatPrice(product.finalPrice)}</span>
    </div>
  );
}

function StatusBadges({ product }: { product: Product }) {
  const stock = stockStatusMeta(product.stockStatus);
  return (
    <>
      {!product.isActive && <Badge tone="neutral">Hidden</Badge>}
      <Badge tone={stock.tone}>{stock.label}</Badge>
    </>
  );
}

function ListSkeleton() {
  return (
    <Card className="divide-y divide-line" aria-busy="true">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-4">
          <div className="size-12 animate-pulse rounded-lg bg-sunken" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/3 animate-pulse rounded bg-sunken" />
            <div className="h-3 w-1/5 animate-pulse rounded bg-sunken" />
          </div>
        </div>
      ))}
    </Card>
  );
}
