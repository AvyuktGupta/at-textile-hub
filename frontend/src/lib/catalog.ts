import type { BadgeTone } from "@/components/ui/badge";
import type { StockStatus } from "@/types";

export const STOCK_STATUS_OPTIONS: { value: StockStatus; label: string; tone: BadgeTone }[] = [
  { value: "in_stock", label: "In stock", tone: "success" },
  { value: "low_stock", label: "Low stock", tone: "warning" },
  { value: "made_to_order", label: "Made to order", tone: "brand" },
  { value: "out_of_stock", label: "Out of stock", tone: "danger" },
];

export function stockStatusMeta(status: StockStatus) {
  return STOCK_STATUS_OPTIONS.find((option) => option.value === status) ?? STOCK_STATUS_OPTIONS[0];
}

/** Mirrors normalizeTag in backend/src/models/Product.js. */
export function normalizeTag(tag: string) {
  return tag.trim().toLowerCase().replace(/\s+/g, "-");
}

export function formatTag(tag: string) {
  return tag.replace(/-/g, " ");
}

/** "pcs" reads badly after "per", so use the singular for the default unit. */
export function unitLabel(unit?: string) {
  const value = unit?.trim();
  return !value || value === "pcs" ? "pc" : value;
}

export function formatDiscount(percentage: number) {
  return `${Number.isInteger(percentage) ? percentage : percentage.toFixed(1)}%`;
}

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "discount", label: "Biggest discount" },
  { value: "title", label: "Name A–Z" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export interface CatalogQuery {
  q: string;
  tags: string[];
  sort: SortValue;
  page: number;
}

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export function parseCatalogQuery(params: RawParams): CatalogQuery {
  const sort = first(params.sort);
  return {
    q: first(params.q).trim().slice(0, 100),
    tags: [...new Set(first(params.tags).split(",").map(normalizeTag).filter(Boolean))].sort(),
    sort: SORT_OPTIONS.some((option) => option.value === sort) ? (sort as SortValue) : "newest",
    page: Math.max(Number.parseInt(first(params.page), 10) || 1, 1),
  };
}

export function catalogHref(query: CatalogQuery, overrides: Partial<CatalogQuery> = {}) {
  const next = { ...query, page: 1, ...overrides };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.tags.length) params.set("tags", next.tags.join(","));
  if (next.sort !== "newest") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));
  const qs = params.toString();
  return qs ? `/products?${qs}` : "/products";
}

export function tagHref(tag: string) {
  return `/products?tags=${encodeURIComponent(tag)}`;
}
