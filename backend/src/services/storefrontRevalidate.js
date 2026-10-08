import env from "../config/env.js";

export const CACHE_TAGS = Object.freeze({
  PRODUCTS: "products",
  SETTINGS: "settings",
  product: (slug) => `product:${slug}`,
});

/**
 * Asks the Next.js storefront to drop cached pages for the given tags.
 * Fire-and-forget: storefront caches also expire on their own, so a failed call only delays freshness.
 */
export function revalidateStorefront(tags) {
  const { url, secret } = env.storefrontRevalidate;
  if (!url || !secret) return;

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-revalidate-secret": secret },
    body: JSON.stringify({ tags: [...new Set(tags)] }),
    signal: AbortSignal.timeout(5000),
  })
    .then((res) => {
      if (!res.ok) console.warn(`[revalidate] Storefront responded ${res.status}`);
    })
    .catch((err) => console.warn("[revalidate] Could not reach storefront:", err.message));
}
