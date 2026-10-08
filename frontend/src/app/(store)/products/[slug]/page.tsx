import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { DiscountBadge } from "@/components/store/product-card";
import { ProductGallery } from "@/components/store/product-gallery";
import { ProductRail } from "@/components/store/product-rail";
import { PurchasePanel } from "@/components/store/purchase-panel";
import { TrackProductView } from "@/components/store/track-product-view";
import { Badge } from "@/components/ui/badge";
import { resolveMediaUrl } from "@/lib/api";
import { formatDiscount, formatTag, stockStatusMeta, tagHref, unitLabel } from "@/lib/catalog";
import { formatPrice } from "@/lib/pricing";
import { getProductBySlug, getRelatedProducts } from "@/lib/storefront";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  const image = resolveMediaUrl(product.images[0]?.url);
  return {
    title: product.title,
    description: product.description.slice(0, 160) || undefined,
    openGraph: image ? { images: [image] } : undefined,
  };
}

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

async function ProductDetail({ params }: Pick<PageProps<"/products/[slug]">, "params">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.tags, product._id);
  const stock = stockStatusMeta(product.stockStatus);
  const hasDiscount = product.discountPercentage > 0;
  const unit = unitLabel(product.unit);
  const primaryTag = product.tags[0];

  return (
    <>
      <TrackProductView productId={product._id} />

      <div className="container-page pt-4 pb-6 sm:pt-6">
        <nav aria-label="Breadcrumb">
          <ol className="flex min-w-0 items-center gap-1 text-sm text-ink-muted">
            <li>
              <Link href="/products" className="hover:text-ink">
                Catalogue
              </Link>
            </li>
            {primaryTag && (
              <li className="flex shrink-0 items-center gap-1">
                <ChevronRight className="size-3.5 text-ink-faint" aria-hidden />
                <Link href={tagHref(primaryTag)} className="capitalize hover:text-ink">
                  {formatTag(primaryTag)}
                </Link>
              </li>
            )}
            <li className="flex min-w-0 items-center gap-1 text-ink-soft" aria-current="page">
              <ChevronRight className="size-3.5 shrink-0 text-ink-faint" aria-hidden />
              <span className="truncate">{product.title}</span>
            </li>
          </ol>
        </nav>

        <div className="mt-5 grid gap-8 lg:mt-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <ProductGallery images={product.images} title={product.title} />

          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={stock.tone}>{stock.label}</Badge>
              <span className="text-xs text-ink-muted">SKU {product.sku}</span>
            </div>

            <h1 className="mt-3 text-3xl leading-[1.1] sm:text-4xl">{product.title}</h1>

            <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-2">
              <p className="text-[34px] leading-none font-bold text-ink tabular-nums">
                {formatPrice(product.finalPrice)}
                <span className="ml-1 text-base font-medium text-ink-muted">/ {unit}</span>
              </p>
              {hasDiscount && (
                <>
                  <p className="pb-0.5 text-base text-ink-faint tabular-nums line-through">
                    <span className="sr-only">Base price </span>
                    {formatPrice(product.basePrice)}
                  </p>
                  <DiscountBadge percentage={product.discountPercentage} className="mb-1" />
                </>
              )}
            </div>
            {hasDiscount && (
              <p className="mt-2 text-sm font-medium text-success">
                You save {formatPrice(product.basePrice - product.finalPrice)} per {unit} (
                {formatDiscount(product.discountPercentage)})
              </p>
            )}

            <div className="mt-6">
              <PurchasePanel
                finalPrice={product.finalPrice}
                minOrderQty={product.minOrderQty}
                unit={product.unit}
                stockStatus={product.stockStatus}
              />
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line text-sm">
              <Spec label="Minimum order" value={`${product.minOrderQty.toLocaleString("en-IN")} ${product.unit}`} />
              <Spec label="Sold per" value={unit} />
              <Spec label="Availability" value={stock.label} />
              <Spec label="SKU" value={product.sku} />
            </dl>

            {product.description && (
              <section className="mt-8">
                <h2 className="font-sans text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">
                  Description
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-ink-soft">
                  {product.description}
                </p>
              </section>
            )}

            {product.tags.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Product types">
                {product.tags.map((tag) => (
                  <li key={tag}>
                    <Link
                      href={tagHref(tag)}
                      className="inline-flex h-8 items-center rounded-full border border-line bg-surface px-3 text-xs font-medium text-ink-soft capitalize hover:border-brand/40 hover:text-brand"
                    >
                      {formatTag(tag)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="border-t border-line">
          <ProductRail
            title="You may also need"
            description={primaryTag ? `More in ${formatTag(primaryTag)} and related types.` : undefined}
            href={primaryTag ? tagHref(primaryTag) : undefined}
            products={related}
          />
        </div>
      )}
    </>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-4 py-3">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="mt-0.5 font-semibold text-ink">{value}</dd>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="container-page pt-4 pb-6 sm:pt-6" aria-busy aria-label="Loading product">
      <div className="h-4 w-48 animate-pulse rounded bg-sunken" />
      <div className="mt-5 grid gap-8 lg:mt-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <div className="aspect-square animate-pulse rounded-2xl bg-sunken" />
        <div>
          <div className="h-5 w-32 animate-pulse rounded bg-sunken" />
          <div className="mt-4 h-10 w-4/5 animate-pulse rounded-lg bg-sunken" />
          <div className="mt-6 h-9 w-40 animate-pulse rounded-lg bg-sunken" />
          <div className="mt-6 h-48 animate-pulse rounded-2xl bg-sunken" />
        </div>
      </div>
    </div>
  );
}
