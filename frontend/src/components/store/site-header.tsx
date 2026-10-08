import Link from "next/link";
import { AccountMenu } from "@/components/store/account-menu";
import { HeaderSearch } from "@/components/store/header-search";
import { siteConfig } from "@/config/site";

const NAV = [
  { href: "/products", label: "Catalogue" },
  { href: "/products?sort=discount", label: "Offers" },
];

export function Logo() {
  return (
    <Link href="/" className="flex shrink-0 items-baseline gap-1.5 rounded-md" aria-label={`${siteConfig.name} home`}>
      <span className="font-display text-[22px] leading-none font-semibold tracking-tight text-ink">
        {siteConfig.shortName}
        <span className="text-clay">.</span>
      </span>
      <span className="hidden text-[11px] font-semibold tracking-[0.14em] text-ink-muted uppercase sm:inline">
        Wholesale
      </span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/92 backdrop-blur-md supports-[backdrop-filter]:bg-canvas/80">
      <div className="container-page flex h-16 items-center gap-6">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:bg-sunken hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <HeaderSearch id="search-desktop" className="ml-auto hidden w-full max-w-sm md:block" />

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link
            href="/products"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-sunken hover:text-ink md:hidden"
          >
            Catalogue
          </Link>
          <AccountMenu />
        </div>
      </div>

      <div className="container-page pb-3 md:hidden">
        <HeaderSearch id="search-mobile" />
      </div>
    </header>
  );
}
