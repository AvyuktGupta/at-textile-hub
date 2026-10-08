/** Only allow same-site relative redirects. */
export function safeNext(value: string | null | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
}

export function withNext(path: string, next: string | null | undefined) {
  const safe = safeNext(next);
  return safe ? `${path}?next=${encodeURIComponent(safe)}` : path;
}
