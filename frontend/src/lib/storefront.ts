import { cacheLife, cacheTag } from "next/cache";
import { ApiError, apiFetch, type ApiResponse, type Paginated } from "@/lib/api";
import type { CatalogQuery } from "@/lib/catalog";
import type { HomeData, Product, ProductSummary, TagCount } from "@/types";

/** Must match CACHE_TAGS in backend/src/services/storefrontRevalidate.js. */
export const CACHE_TAGS = {
  products: "products",
  settings: "settings",
  product: (slug: string) => `product:${slug}`,
};

export const CATALOG_PAGE_SIZE = 24;

/*
 * Every storefront read is cached and refreshed at least once a minute. The API also calls
 * /api/revalidate with these tags after admin edits, so changes normally show up immediately.
 * Failures return null rather than throwing so a brief API outage (or a build without the API
 * reachable) renders an "unavailable" state instead of an error page.
 */

export async function getHomeData(): Promise<HomeData | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.settings, CACHE_TAGS.products);

  try {
    return (await apiFetch<ApiResponse<HomeData>>("/storefront/home")).data;
  } catch (err) {
    console.error("[storefront] home:", err);
    return null;
  }
}

export async function getCatalog(query: CatalogQuery): Promise<Paginated<ProductSummary> | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.products);

  const params = new URLSearchParams({
    sort: query.sort,
    page: String(query.page),
    limit: String(CATALOG_PAGE_SIZE),
  });
  if (query.q) params.set("q", query.q);
  if (query.tags.length) params.set("tags", query.tags.join(","));

  try {
    return await apiFetch<Paginated<ProductSummary>>(`/products?${params}`);
  } catch (err) {
    console.error("[storefront] catalog:", err);
    return null;
  }
}

export async function getCatalogTags(): Promise<TagCount[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.products);

  try {
    return (await apiFetch<ApiResponse<TagCount[]>>("/products/tags")).data;
  } catch (err) {
    console.error("[storefront] tags:", err);
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.product(slug));

  try {
    return (await apiFetch<ApiResponse<Product>>(`/products/${encodeURIComponent(slug)}`)).data;
  } catch (err) {
    if (!(err instanceof ApiError && (err.status === 404 || err.status === 400))) {
      console.error("[storefront] product:", err);
    }
    return null;
  }
}

export async function getRelatedProducts(tags: string[], excludeId: string): Promise<ProductSummary[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.products);

  if (!tags.length) return [];
  try {
    const res = await apiFetch<Paginated<ProductSummary>>(
      `/products?tags=${encodeURIComponent(tags.join(","))}&limit=13`
    );
    return res.data.filter((product) => product._id !== excludeId).slice(0, 12);
  } catch (err) {
    console.error("[storefront] related:", err);
    return [];
  }
}
