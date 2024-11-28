import { useEffect } from "react";
import { usePathname } from "./hooks/usePathname";
import {
  type EntitlementRequiredError,
  setEntitlementRequiredHandler,
  setUnauthorizedHandler,
} from "./lib/api";
import { useAuthStore } from "./lib/auth-store";
import { useMembershipStore } from "./lib/membership-store";
import { isWorkspacePath } from "./lib/navigate";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { LoginPage } from "./pages/LoginPage";
import { ProjectsHub } from "./pages/ProjectsHub";
import { CreateWorkspace } from "./workspace/CreateWorkspace";

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const user = useAuthStore((s) => s.user);
  const openLoginPrompt = useAuthStore((s) => s.openLoginPrompt);
  const ensureTrialOnEntry = useMembershipStore((s) => s.ensureTrialOnEntry);
  const path = usePathname();
  const isAuthCallback = path === "/auth/callback";
  const isLogin = path === "/login";
  const isWorkspace = isWorkspacePath(path);

  useEffect(() => {
    setUnauthorizedHandler(openLoginPrompt);
    setEntitlementRequiredHandler((err: EntitlementRequiredError) => {
      const edu = import.meta.env.VITE_EDU_APP_URL?.replace(/\/$/, "") || "http://localhost:18082";
      const go = window.confirm(`${err.message}\n\n前往套餐页升级？`);
      if (go) window.location.href = `${edu}/membership`;
    });
  }, [openLoginPrompt]);

  useEffect(() => {
    void fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (user) void ensureTrialOnEntry();
  }, [user, ensureTrialOnEntry]);

  if (isAuthCallback) {
    return <AuthCallbackPage />;
  }

  if (isLogin) {
    return <LoginPage />;
  }

  if (isWorkspace) {
    return <CreateWorkspace />;
  }

  return <ProjectsHub />;
}
