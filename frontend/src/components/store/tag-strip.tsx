import Link from "next/link";
import { formatTag, tagHref } from "@/lib/catalog";
import type { TagCount } from "@/types";

export function TagStrip({ tags }: { tags: TagCount[] }) {
  if (!tags.length) return null;

  return (
    <nav aria-label="Shop by type" className="pt-8 sm:pt-10">
      <h2 className="container-page font-sans text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">
        Shop by type
      </h2>
      <ul className="scroll-rail rail-inset mt-3 gap-2 pb-1">
        {tags.map(({ tag, count }) => (
          <li key={tag}>
            <Link
              href={tagHref(tag)}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink-soft capitalize shadow-sm transition hover:border-brand/40 hover:text-brand"
            >
              {formatTag(tag)}
              <span className="text-xs text-ink-faint tabular-nums">{count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
