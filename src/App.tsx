import { useEffect } from "react";
import { usePathname } from "./hooks/usePathname";
import {
  type EntitlementRequiredError,
  setEntitlementRequiredHandler,
  setUnauthorizedHandler,
} from "./lib/api";
import { useAuthStore } from "./lib/auth-store";
import { t } from "./lib/i18n";
import { useMembershipStore } from "./lib/membership-store";
import { isLaunchPath, isWorkspacePath } from "./lib/navigate";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { LaunchPage } from "./pages/LaunchPage";
import { LoginPage } from "./pages/LoginPage";
import { MembershipPage } from "./pages/MembershipPage";
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
  const isMembership = path === "/membership";
  const isLaunch = isLaunchPath(path);

  useEffect(() => {
    setUnauthorizedHandler(openLoginPrompt);
    setEntitlementRequiredHandler((err: EntitlementRequiredError) => {
      const edu = import.meta.env.VITE_EDU_APP_URL?.replace(/\/$/, "") || "http://localhost:18082";
      const go = window.confirm(t("membership.upgradeConfirm", { message: err.message }));
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

  if (isMembership) {
    return <MembershipPage />;
  }

  if (isLaunch) {
    return <LaunchPage />;
  }

  if (isWorkspace) {
    return <CreateWorkspace />;
  }

  return <ProjectsHub />;
}
