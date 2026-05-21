// Only allow same-origin internal paths as post-login redirect targets, so a
// crafted ?redirect= value can't bounce users to an external site
// (open redirect / phishing). Returns `fallback` for anything that isn't a
// plain absolute path beginning with a single "/".
export function safeRedirectPath(value: string | null | undefined, fallback = "/"): string {
  if (!value) return fallback
  // Must be an absolute internal path: starts with "/" but not "//" (which is
  // protocol-relative → external) and not "/\" (browsers treat "\" as "/").
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback
  }
  return value
}
