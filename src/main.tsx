import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { requireLoginOnEntry } from "./lib/deploy-profile";
import { shouldForceEntryLogin } from "./lib/guest-access";
import { rememberPostLoginPath } from "./lib/idp";
import { normalizePath } from "./lib/navigate";
import "./styles.css";

const initialPath = normalizePath();
if (
  shouldForceEntryLogin({
    requireLogin: requireLoginOnEntry(),
    hasToken: Boolean(localStorage.getItem("blockyedu_token")),
    path: initialPath,
  })
) {
  rememberPostLoginPath(initialPath);
  window.history.replaceState({}, "", "/login");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
