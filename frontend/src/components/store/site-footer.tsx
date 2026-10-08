import Link from "next/link";
import { Logo } from "@/components/store/site-header";
import { siteConfig } from "@/config/site";

const LINKS = [
  {
    heading: "Shop",
    items: [
      { href: "/products", label: "Full catalogue" },
      { href: "/products?sort=newest", label: "New arrivals" },
      { href: "/products?sort=discount", label: "Current offers" },
    ],
  },
  {
    heading: "Account",
    items: [{ href: "/login", label: "Sign in" }],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-[1.5fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">{siteConfig.description}</p>
        </div>
        {LINKS.map((group) => (
          <div key={group.heading}>
            <h2 className="font-sans text-xs font-semibold tracking-[0.12em] text-ink-muted uppercase">
              {group.heading}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-ink-soft hover:text-brand">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <p className="container-page py-5 text-xs text-ink-faint">
          © {siteConfig.name}. Prices shown per unit; minimum order quantities apply.
        </p>
      </div>
    </footer>
  );
}
