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
