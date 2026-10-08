"use client";

import { useRef, useState } from "react";
import { MediaImage } from "@/components/ui/media-image";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types";

export function ProductGallery({ images, title }: { images: ProductImage[]; title: string }) {
  const [active, setActive] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (!images.length) {
    return <MediaImage src={null} alt={title} className="aspect-square w-full rounded-2xl border border-line" />;
  }

  const show = (index: number) => {
    setActive(index);
    const el = scrollerRef.current;
    el?.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-3 lg:flex-row-reverse lg:items-start">
      <div className="relative min-w-0 flex-1">
        {/* Swipeable on touch; thumbnails drive it on larger screens. */}
        <div
          ref={scrollerRef}
          onScroll={(event) => {
            const el = event.currentTarget;
            const index = Math.round(el.scrollLeft / el.clientWidth);
            if (index !== active) setActive(index);
          }}
          className="scroll-rail aspect-square rounded-2xl border border-line bg-sunken"
          aria-roledescription="carousel"
          aria-label={`${title} images`}
        >
          {images.map((image, index) => (
            <div
              key={image.url + index}
              className="size-full snap-center"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${images.length}`}
            >
              <MediaImage
                src={image.url}
                alt={image.alt || title}
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : undefined}
                className="size-full"
              />
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 lg:hidden" aria-hidden>
            {images.map((image, index) => (
              <span
                key={image.url + index}
                className={cn(
                  "h-1.5 rounded-full bg-ink/25 transition-all",
                  index === active ? "w-5 bg-ink/70" : "w-1.5"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <ul className="hidden gap-2.5 lg:flex lg:w-20 lg:flex-col">
          {images.map((image, index) => (
            <li key={image.url + index}>
              <button
                type="button"
                onClick={() => show(index)}
                aria-label={`Show image ${index + 1}`}
                aria-current={index === active}
                className={cn(
                  "block aspect-square w-full overflow-hidden rounded-lg border-2 bg-sunken transition",
                  index === active ? "border-brand" : "border-transparent opacity-75 hover:opacity-100"
                )}
              >
                <MediaImage src={image.url} alt="" className="size-full" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
