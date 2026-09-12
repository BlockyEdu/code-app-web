/** Decide whether a 401 should trigger one local JWT refresh. */

export function shouldAttemptRefresh(input: {
  status: number;
  alreadyRetried?: boolean;
  skipAuthHandlers?: boolean;
  path: string;
}): boolean {
  if (input.skipAuthHandlers) return false;
  if (input.alreadyRetried) return false;
  if (input.status !== 401) return false;
  const pathname = input.path.split("?")[0] ?? input.path;
  if (pathname === "/auth/refresh" || pathname === "/auth/login") return false;
  return true;
}
