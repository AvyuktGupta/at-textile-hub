export type Role = "admin" | "user";

export interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface BusinessDetails {
  companyName?: string;
  gstin?: string;
  businessType?: string;
  shippingAddress?: Address;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  business: BusinessDetails;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "made_to_order";

export interface ProductImage {
  url: string;
  alt?: string;
}

export interface Product {
  _id: string;
  title: string;
  slug: string;
  description: string;
  sku: string;
  basePrice: number;
  discountPercentage: number;
  finalPrice: number;
  hasDiscount: boolean;
  savings: number;
  images: ProductImage[];
  tags: string[];
  stockStatus: StockStatus;
  minOrderQty: number;
  unit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Product as returned in listings and rails (no description). */
export type ProductSummary = Omit<Product, "description" | "updatedAt"> & { description?: string };

export interface TagCount {
  tag: string;
  count: number;
}

export interface HomeSection {
  _id: string;
  title: string;
  filterTag: string;
  products: ProductSummary[];
}

export interface HomeData {
  settings: PublicSiteSettings;
  sections: HomeSection[];
  tags: TagCount[];
  totalProducts: number;
  offerCount: number;
}

export interface HomepageScroll {
  _id: string;
  title: string;
  filterTag: string;
  order: number;
  limit: number;
  isActive: boolean;
}

export interface SiteSettings {
  headerImageUrl: string;
  headerTitle: string;
  headerSubtitle: string;
  orderDestinationEmail: string;
  homepageScrolls: HomepageScroll[];
  updatedAt: string;
}

export type PublicSiteSettings = Omit<SiteSettings, "orderDestinationEmail">;

export interface ApiErrorBody {
  success: false;
  message: string;
  details?: Record<string, string>;
}
