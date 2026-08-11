import { useEffect, useState } from "react";
import { normalizePath } from "../lib/navigate";

/** SPA pathname that updates on pushState / popstate. */
export function usePathname(): string {
  const [path, setPath] = useState(() => normalizePath());

  useEffect(() => {
    const sync = () => setPath(normalizePath());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  return path;
}
