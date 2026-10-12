/** Official programming site can be opened before sign-in. Private deploys keep the wall. */

const PUBLIC_PREFIXES = ["/login", "/auth", "/legal"];

export function shouldForceEntryLogin(input: {
  requireLogin: boolean;
  hasToken: boolean;
  path: string;
}): boolean {
  if (!input.requireLogin || input.hasToken) return false;
  return !PUBLIC_PREFIXES.some(
    (prefix) => input.path === prefix || input.path.startsWith(`${prefix}/`),
  );
}
