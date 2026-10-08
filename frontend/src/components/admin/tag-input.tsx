"use client";

import { useId, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { formatTag, normalizeTag } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export interface TagSuggestion {
  tag: string;
  count?: number;
  /** Homepage section titles that are populated by this tag. */
  sections?: string[];
}

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: TagSuggestion[];
  id?: string;
  invalid?: boolean;
}

export function TagInput({ value, onChange, suggestions = [], id, invalid }: TagInputProps) {
  const [draft, setDraft] = useState("");
  const listId = useId();

  const add = (raw: string) => {
    const tags = raw.split(",").map(normalizeTag).filter(Boolean);
    if (!tags.length) return;
    onChange([...new Set([...value, ...tags])]);
    setDraft("");
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  const available = useMemo(() => {
    const query = normalizeTag(draft);
    return suggestions
      .filter((s) => !value.includes(s.tag) && (!query || s.tag.includes(query)))
      .sort((a, b) => Number(Boolean(b.sections?.length)) - Number(Boolean(a.sections?.length)))
      .slice(0, 12);
  }, [suggestions, value, draft]);

  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          "flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border bg-surface px-2 py-1.5 transition-[border-color,box-shadow] focus-within:border-brand focus-within:shadow-ring",
          invalid ? "border-danger" : "border-line-strong"
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-brand-soft py-1 pr-1 pl-2 text-[13px] font-medium text-brand"
          >
            {formatTag(tag)}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="rounded p-0.5 hover:bg-brand/10"
              aria-label={`Remove tag ${formatTag(tag)}`}
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(event) => {
            const next = event.target.value;
            if (next.endsWith(",")) add(next);
            else setDraft(next);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add(draft);
            } else if (event.key === "Backspace" && !draft && value.length) {
              remove(value[value.length - 1]);
            }
          }}
          onBlur={() => add(draft)}
          placeholder={value.length ? "Add another…" : "e.g. popular, hot-cups, 8oz"}
          aria-describedby={listId}
          className="h-8 min-w-32 flex-1 bg-transparent px-1.5 text-[15px] outline-none placeholder:text-ink-faint"
        />
      </div>

      {available.length > 0 && (
        <div id={listId} className="flex flex-wrap gap-1.5">
          {available.map((s) => (
            <button
              key={s.tag}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => add(s.tag)}
              title={s.sections?.length ? `Shown on homepage: ${s.sections.join(", ")}` : undefined}
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[13px] transition-colors",
                s.sections?.length
                  ? "border-clay/30 bg-clay-soft text-clay hover:border-clay/60"
                  : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink"
              )}
            >
              <Plus className="size-3" aria-hidden />
              {formatTag(s.tag)}
              {s.count !== undefined && <span className="text-ink-faint">· {s.count}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
