// Secret admin sign-in address. Set ADMIN_LOGIN_PATH (e.g. "/some-long-secret")
// in .env.local / host settings; the page at /login is then only reachable
// through it, and /login itself answers 404. Unset or invalid = plain /login
// (so nobody gets locked out). Read by next.config.ts (rewrite) and proxy.ts.

export const LOGIN_PATH_PATTERN = /^\/[A-Za-z0-9_-]{12,80}$/;

export function secretLoginPath(value = process.env.ADMIN_LOGIN_PATH): string | null {
  const v = value?.trim();
  return v && LOGIN_PATH_PATTERN.test(v) && v !== "/login" ? v : null;
}
