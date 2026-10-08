import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MediaImage } from "@/components/ui/media-image";
import { cn } from "@/lib/utils";

interface HomeHeroProps {
  imageUrl: string;
  title: string;
  subtitle: string;
  productCount: number;
  offerCount: number;
}

export function HomeHero({ imageUrl, title, subtitle, productCount, offerCount }: HomeHeroProps) {
  const hasImage = Boolean(imageUrl);

  return (
    <section className="container-page pt-4 sm:pt-6">
      <div
        className={cn(
          "relative isolate flex min-h-[24rem] items-end overflow-hidden rounded-2xl sm:min-h-[28rem] sm:rounded-3xl lg:min-h-[32rem]",
          hasImage ? "bg-ink" : "bg-brand"
        )}
      >
        {hasImage ? (
          <>
            <MediaImage
              src={imageUrl}
              alt=""
              loading="eager"
              fetchPriority="high"
              className="absolute inset-0 -z-10 size-full"
            />
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-linear-to-t from-ink/80 via-ink/35 to-ink/5 sm:bg-linear-to-r sm:from-ink/75 sm:via-ink/35 sm:to-transparent"
            />
          </>
        ) : (
          <HeroPattern />
        )}

        <div className="w-full p-6 sm:p-10 lg:p-14">
          <div className="max-w-xl">
            <p className="text-xs font-semibold tracking-[0.16em] text-white/75 uppercase">Wholesale catalogue</p>
            <h1 className="mt-3 text-[2.5rem] leading-[1.02] text-white sm:text-5xl lg:text-6xl">{title}</h1>
            {subtitle && <p className="mt-4 max-w-lg text-base leading-relaxed text-white/85 sm:text-lg">{subtitle}</p>}
            <div className="mt-7 flex flex-wrap gap-2.5 sm:gap-3">
              <Link
                href="/products"
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 text-sm sm:px-6 font-semibold text-ink shadow-sm transition hover:bg-canvas"
              >
                Browse catalogue
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <Link
                href="/products?sort=discount"
                className="inline-flex h-12 items-center rounded-full border border-white/40 px-5 text-sm sm:px-6 font-semibold text-white transition hover:border-white hover:bg-white/10"
              >
                See offers
              </Link>
            </div>
          </div>

          {productCount > 0 && (
            <dl className="mt-10 flex gap-8 border-t border-white/20 pt-5 text-white sm:absolute sm:right-10 sm:bottom-10 sm:mt-0 sm:border-0 sm:pt-0 lg:right-14 lg:bottom-14">
              <Stat label="Products" value={productCount} />
              {offerCount > 0 && <Stat label="On offer" value={offerCount} />}
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold tracking-[0.14em] text-white/70 uppercase">{label}</dt>
      <dd className="font-display mt-1 text-3xl leading-none tabular-nums">{value.toLocaleString("en-IN")}</dd>
    </div>
  );
}

/** Shown until an admin uploads a banner: concentric cup rims, drawn rather than stock imagery. */
function HeroPattern() {
  return (
    <svg
      aria-hidden
      className="absolute inset-0 -z-10 size-full"
      viewBox="0 0 800 500"
      preserveAspectRatio="xMaxYMid slice"
    >
      <defs>
        <radialGradient id="hero-glow" cx="78%" cy="40%" r="60%">
          <stop offset="0" stopColor="#2c6a50" />
          <stop offset="1" stopColor="#1f4d3a" />
        </radialGradient>
      </defs>
      <rect width="800" height="500" fill="url(#hero-glow)" />
      <g fill="none" stroke="#fbfaf7" strokeOpacity="0.09">
        {[60, 110, 160, 210, 260, 310].map((r) => (
          <ellipse key={r} cx="640" cy="210" rx={r} ry={r * 0.36} strokeWidth="1.5" />
        ))}
      </g>
      <circle cx="640" cy="210" r="6" fill="#c0532b" className="max-sm:hidden" />
    </svg>
  );
}
