/** Minimal SPA navigation without react-router. */

export function normalizePath(pathname = window.location.pathname): string {
  const p = pathname.replace(/\/$/, "") || "/";
  return p;
}

function splitHref(href: string): { path: string; suffix: string } {
  const hashIndex = href.indexOf("#");
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const beforeHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const queryIndex = beforeHash.indexOf("?");
  const search = queryIndex >= 0 ? beforeHash.slice(queryIndex) : "";
  const pathOnly = queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash;
  return { path: normalizePath(pathOnly), suffix: `${search}${hash}` };
}

export function navigate(path: string): void {
  const next = path.startsWith("/") ? path : `/${path}`;
  const nextParts = splitHref(next);
  const currentParts = splitHref(
    `${window.location.pathname}${window.location.search}${window.location.hash}`,
  );
  if (nextParts.path === currentParts.path && nextParts.suffix === currentParts.suffix) return;
  window.history.pushState({}, "", `${nextParts.path}${nextParts.suffix}`);
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

export function parseSampleSlug(pathname = window.location.pathname): string | null {
  const path = normalizePath(pathname);
  const match = path.match(/^\/sample\/([^/]+)$/);
  return match?.[1] ?? null;
}

export function isSamplePath(pathname = window.location.pathname): boolean {
  return parseSampleSlug(pathname) !== null;
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

export function samplesPath(category?: string | null): string {
  if (!category || category === "all") return "/samples";
  return `/samples?category=${encodeURIComponent(category)}`;
}

export function projectsPath(): string {
  return "/projects";
}

export function parseSamplesCategory(search = ""): string | null {
  const value = new URLSearchParams(search).get("category");
  if (!value || value === "all") return null;
  return value;
}

export function isSamplesListPath(pathname = window.location.pathname): boolean {
  return normalizePath(pathname) === "/samples";
}

export function isProjectsPath(pathname = window.location.pathname): boolean {
  return normalizePath(pathname) === "/projects";
}

export function isAboutPath(pathname = window.location.pathname): boolean {
  return normalizePath(pathname) === "/about";
}
