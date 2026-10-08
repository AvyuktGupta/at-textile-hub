import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";

const MAX_TAGS = 50;

function isAuthorized(provided: string | null) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Called by the API after product or settings changes. */
export async function POST(request: Request) {
  if (!isAuthorized(request.headers.get("x-revalidate-secret"))) {
    return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { tags?: unknown } | null;
  const tags = Array.isArray(body?.tags)
    ? body.tags.filter((tag): tag is string => typeof tag === "string" && tag.length > 0 && tag.length <= 256)
    : [];

  if (!tags.length) {
    return Response.json({ ok: false, message: "Provide a non-empty tags array" }, { status: 400 });
  }

  const revalidated = tags.slice(0, MAX_TAGS);
  // The admin who just saved expects to see the change on their next page load, so don't serve stale.
  for (const tag of revalidated) revalidateTag(tag, { expire: 0 });

  return Response.json({ ok: true, revalidated });
}
