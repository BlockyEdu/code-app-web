/** Minimal SPA navigation without react-router. */

export function normalizePath(pathname = window.location.pathname): string {
  const p = pathname.replace(/\/$/, "") || "/";
  return p;
}

export function navigate(path: string): void {
  const next = path.startsWith("/") ? path : `/${path}`;
  if (normalizePath() === normalizePath(next)) return;
  window.history.pushState({}, "", next);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function parseWorkspaceArtifactId(pathname = window.location.pathname): string | null {
  const path = normalizePath(pathname);
  const m = path.match(/^\/workspace\/([^/]+)$/);
  return m?.[1] ?? null;
}

export function isWorkspacePath(pathname = window.location.pathname): boolean {
  const path = normalizePath(pathname);
  return path === "/workspace" || path.startsWith("/workspace/");
}

export function parseLaunchArtifactId(pathname = window.location.pathname): string | null {
  const path = normalizePath(pathname);
  const m = path.match(/^\/launch\/([^/]+)$/);
  return m?.[1] ?? null;
}

export function isLaunchPath(pathname = window.location.pathname): boolean {
  const path = normalizePath(pathname);
  return path === "/launch" || path.startsWith("/launch/");
}
