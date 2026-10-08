"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { useAuth } from "@/providers/auth-provider";
import type { TagSuggestion } from "./tag-input";

/** Existing product tags merged with the tags that drive homepage sections. */
export function useTagSuggestions() {
  const { token } = useAuth();
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    Promise.all([adminApi.listTags(token), adminApi.getSettings(token)])
      .then(([tagsRes, settingsRes]) => {
        if (cancelled) return;
        const map = new Map<string, TagSuggestion>();
        for (const { tag, count } of tagsRes.data) map.set(tag, { tag, count });
        for (const scroll of settingsRes.data.homepageScrolls) {
          const entry = map.get(scroll.filterTag) ?? { tag: scroll.filterTag, count: 0 };
          entry.sections = [...(entry.sections ?? []), scroll.title];
          map.set(scroll.filterTag, entry);
        }
        setSuggestions([...map.values()]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token]);

  return suggestions;
}
