import { useEffect } from "react";
import { usePathname } from "./hooks/usePathname";
import {
  type EntitlementRequiredError,
  setEntitlementRequiredHandler,
  setUnauthorizedHandler,
} from "./lib/api";
import { useAuthStore } from "./lib/auth-store";
import { t } from "./lib/i18n";
import { useLocaleStore } from "./lib/locale-store";
import { useMembershipStore } from "./lib/membership-store";
import { isAboutPath, isLaunchPath, isSamplePath, isWorkspacePath } from "./lib/navigate";
import { AboutPage } from "./pages/AboutPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { HomePage } from "./pages/HomePage";
import { LaunchPage } from "./pages/LaunchPage";
import { LegalPrivacyPage, LegalTermsPage, LegalTrialDeletionPage } from "./pages/LegalPages";
import { LoginPage } from "./pages/LoginPage";
import { MembershipPage } from "./pages/MembershipPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { SamplesPage } from "./pages/SamplesPage";
import { CreateWorkspace } from "./workspace/CreateWorkspace";

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const user = useAuthStore((s) => s.user);
  const openLoginPrompt = useAuthStore((s) => s.openLoginPrompt);
  const locale = useLocaleStore((s) => s.locale);
  const ensureTrialOnEntry = useMembershipStore((s) => s.ensureTrialOnEntry);
  const fetchMembership = useMembershipStore((s) => s.fetchMembership);
  const path = usePathname();
  const isAuthCallback = path === "/auth/callback";
  const isLogin = path === "/login";
  const isLegalTerms = path === "/legal/terms";
  const isLegalPrivacy = path === "/legal/privacy";
  const isLegalTrialDeletion = path === "/legal/trial-deletion";
  const isWorkspace = isWorkspacePath(path);
  const isSample = isSamplePath(path);
  const isMembership = path === "/membership";
  const isLaunch = isLaunchPath(path);
  const isSamples = path === "/samples";
  const isProjects = path === "/projects";
  const isAbout = isAboutPath(path);
  const isCreateTrial = path === "/create";

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

  useEffect(() => {
    if (!user || !locale) return;
    void fetchMembership();
  }, [user, locale, fetchMembership]);

  if (isAuthCallback) {
    return <AuthCallbackPage />;
  }

  if (isLogin) {
    return <LoginPage />;
  }
  if (isLegalTerms) {
    return <LegalTermsPage product="BlockyEdu 编程工作台" />;
  }
  if (isLegalPrivacy) {
    return <LegalPrivacyPage product="BlockyEdu 编程工作台" />;
  }
  if (isLegalTrialDeletion) {
    return <LegalTrialDeletionPage product="BlockyEdu 编程工作台" />;
  }

  if (isMembership) {
    return <MembershipPage />;
  }

  if (isLaunch) {
    return <LaunchPage />;
  }

  if (isWorkspace || isSample) {
    return <CreateWorkspace />;
  }

  if (isSamples) {
    return <SamplesPage />;
  }

  if (isProjects) {
    return <ProjectsPage />;
  }

  if (isAbout) {
    return <AboutPage />;
  }

  return <HomePage trial={isCreateTrial} />;
}
