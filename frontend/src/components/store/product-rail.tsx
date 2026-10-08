"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import { cn } from "@/lib/utils";
import type { ProductSummary } from "@/types";

interface ProductRailProps {
  title: string;
  description?: string;
  href?: string;
  products: ProductSummary[];
  /** Eager-load images in the first few cards (for rails near the top of the page). */
  priority?: boolean;
}

export function ProductRail({ title, description, href, products, priority = false }: ProductRailProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });

  const measure = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setEdges({
      atStart: el.scrollLeft <= 4,
      atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // Fires once on observe, then whenever the rail resizes.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const page = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const headingId = `rail-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const scrollable = !(edges.atStart && edges.atEnd);

  return (
    <section aria-labelledby={headingId} className="py-7 sm:py-9">
      <div className="container-page flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 id={headingId} className="text-[22px] leading-tight sm:text-[28px]">
            {title}
          </h2>
          {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {href && (
            <Link
              href={href}
              className="group inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-hover"
            >
              View all
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          )}
          {scrollable && (
            <div className="hidden gap-1.5 md:flex">
              <RailButton label={`Scroll ${title} left`} disabled={edges.atStart} onClick={() => page(-1)}>
                <ChevronLeft />
              </RailButton>
              <RailButton label={`Scroll ${title} right`} disabled={edges.atEnd} onClick={() => page(1)}>
                <ChevronRight />
              </RailButton>
            </div>
          )}
        </div>
      </div>

      <div ref={scrollerRef} onScroll={measure} className="scroll-rail rail-inset mt-4 gap-3.5 pb-2 sm:mt-5 sm:gap-5">
        {products.map((product, index) => (
          <ProductCard
            key={product._id}
            product={product}
            priority={priority && index < 4}
            className="w-[42vw] max-w-56 min-w-36 shrink-0 snap-start sm:w-52 lg:w-56"
          />
        ))}
      </div>
    </section>
  );
}

function RailButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink shadow-sm transition",
        "hover:border-ink-faint hover:bg-sunken disabled:pointer-events-none disabled:opacity-35 [&_svg]:size-4"
      )}
    >
      {children}
    </button>
  );
}
