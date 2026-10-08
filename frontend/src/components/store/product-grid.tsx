import { ProductCard } from "@/components/store/product-card";
import type { ProductSummary } from "@/types";

export function ProductGrid({ products }: { products: ProductSummary[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3.5 gap-y-8 sm:grid-cols-3 sm:gap-x-5 xl:grid-cols-4">
      {products.map((product, index) => (
        <li key={product._id} className="flex">
          <ProductCard product={product} priority={index < 4} className="w-full" />
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3.5 gap-y-8 sm:grid-cols-3 sm:gap-x-5 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <div className="aspect-square animate-pulse rounded-card bg-sunken" />
          <div className="mt-3 h-4 w-4/5 animate-pulse rounded bg-sunken" />
          <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-sunken" />
        </li>
      ))}
    </ul>
  );
}
