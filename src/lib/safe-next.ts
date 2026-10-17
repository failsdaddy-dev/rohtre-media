/** Only same-site paths are allowed after sign-in (no open redirects). */
export function safeNext(next: string | null | undefined, fallback = "/admin"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
