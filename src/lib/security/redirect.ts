const DEFAULT_REDIRECT_PATH = "/dashboard";

// Accept only same-origin relative paths such as "/dashboard/projects".
// Rejects absolute URLs, protocol-relative "//evil.com", "/\evil.com",
// userinfo tricks like "@evil.com" and anything with control characters.
export function getSafeRedirectPath(
  rawPath: string | null | undefined,
  fallback: string = DEFAULT_REDIRECT_PATH,
): string {
  if (typeof rawPath !== "string") {
    return fallback;
  }

  const path = rawPath.trim();

  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(path)
  ) {
    return fallback;
  }

  try {
    const base = "http://localhost";
    const resolved = new URL(path, base);

    if (resolved.origin !== base) {
      return fallback;
    }

    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}
