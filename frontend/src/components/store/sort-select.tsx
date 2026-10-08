"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

interface SortSelectProps {
  value: string;
  options: { label: string; href: string; value: string }[];
}

/** Each option carries a prebuilt URL, so this needs no access to search params. */
export function SortSelect({ value, options }: SortSelectProps) {
  const router = useRouter();

  return (
    <label className="relative flex items-center gap-2 text-sm text-ink-muted">
      <span className="hidden sm:inline">Sort by</span>
      <select
        value={value}
        onChange={(event) => {
          const option = options.find((item) => item.value === event.target.value);
          if (option) router.push(option.href, { scroll: false });
        }}
        className="h-10 appearance-none rounded-full border border-line bg-surface pr-9 pl-4 text-sm font-medium text-ink shadow-sm focus:border-brand focus:ring-3 focus:ring-brand/15 focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-4 text-ink-muted" aria-hidden />
    </label>
  );
}
