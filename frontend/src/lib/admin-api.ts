import { apiFetch, type ApiResponse, type Paginated } from "@/lib/api";
import type { HomepageScroll, Product, ProductImage, SiteSettings, StockStatus, TagCount } from "@/types";

export type { TagCount };

export interface ProductInput {
  title: string;
  sku: string;
  description: string;
  basePrice: number;
  discountPercentage: number;
  images: ProductImage[];
  tags: string[];
  stockStatus: StockStatus;
  minOrderQty: number;
  unit: string;
  isActive: boolean;
}

export type ScrollInput = Pick<HomepageScroll, "title" | "filterTag" | "limit" | "isActive"> & { _id?: string };

export interface SettingsInput {
  headerImageUrl: string;
  headerTitle: string;
  headerSubtitle: string;
  orderDestinationEmail: string;
  homepageScrolls: ScrollInput[];
}

export interface ProductQuery {
  q?: string;
  tags?: string;
  status?: "all" | "active" | "inactive";
  sort?: string;
  page?: number;
  limit?: number;
}

function toQueryString(params: object) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const adminApi = {
  listProducts: (token: string, query: ProductQuery) =>
    apiFetch<Paginated<Product>>(`/products${toQueryString(query)}`, { token }),

  getProduct: (token: string, id: string) => apiFetch<ApiResponse<Product>>(`/products/${id}`, { token }),

  createProduct: (token: string, body: ProductInput) =>
    apiFetch<ApiResponse<Product>>("/products", { method: "POST", token, body }),

  updateProduct: (token: string, id: string, body: Partial<ProductInput>) =>
    apiFetch<ApiResponse<Product>>(`/products/${id}`, { method: "PATCH", token, body }),

  deleteProduct: (token: string, id: string) =>
    apiFetch<ApiResponse<{ _id: string }>>(`/products/${id}`, { method: "DELETE", token }),

  listTags: (token: string) => apiFetch<ApiResponse<TagCount[]>>("/products/tags?status=all", { token }),

  uploadImages: (token: string, files: File[]) => {
    const form = new FormData();
    files.forEach((file) => form.append("images", file));
    return apiFetch<ApiResponse<{ url: string; originalName: string }[]>>("/uploads", {
      method: "POST",
      token,
      body: form,
    });
  },

  getSettings: (token: string) => apiFetch<ApiResponse<SiteSettings>>("/settings/admin", { token }),

  updateSettings: (token: string, body: SettingsInput) =>
    apiFetch<ApiResponse<SiteSettings>>("/settings", { method: "PUT", token, body }),
};
