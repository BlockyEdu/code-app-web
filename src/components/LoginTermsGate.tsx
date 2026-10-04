import { readLoginLegalConfigFromEnv } from "@luminaryworks/auth-react";
import type { CSSProperties } from "react";
import { useState } from "react";
import { t } from "../lib/i18n";

const TOS_KEY = "blockyedu.code.tos.login.v2";
const CARD_INK = "#14212b";
const STAGE_INK = "#f7fbff";
const STAGE_LINK = "#79b8ff";

function legalUrls() {
  const env = import.meta.env as Record<string, string | undefined>;
  return readLoginLegalConfigFromEnv({
    VITE_LEGAL_PLATFORM_TERMS_URL: env.VITE_LEGAL_PLATFORM_TERMS_URL,
    VITE_LEGAL_PLATFORM_PRIVACY_URL: env.VITE_LEGAL_PLATFORM_PRIVACY_URL,
    VITE_LEGAL_PRODUCT_TERMS_URL: env.VITE_LEGAL_PRODUCT_TERMS_URL,
    VITE_LEGAL_PRODUCT_PRIVACY_URL: env.VITE_LEGAL_PRODUCT_PRIVACY_URL,
    PUBLIC_LEGAL_PLATFORM_TERMS_URL: env.PUBLIC_LEGAL_PLATFORM_TERMS_URL,
    PUBLIC_LEGAL_PLATFORM_PRIVACY_URL: env.PUBLIC_LEGAL_PLATFORM_PRIVACY_URL,
    PUBLIC_LEGAL_PRODUCT_TERMS_URL: env.PUBLIC_LEGAL_PRODUCT_TERMS_URL,
    PUBLIC_LEGAL_PRODUCT_PRIVACY_URL: env.PUBLIC_LEGAL_PRODUCT_PRIVACY_URL,
  });
}

export function useLoginTermsAccepted() {
  const [accepted, setAcceptedState] = useState(() => {
    try {
      return localStorage.getItem(TOS_KEY) === "1";
    } catch {
      return false;
    }
  });
  const setAccepted = (next: boolean) => {
    setAcceptedState(next);
    try {
      if (next) localStorage.setItem(TOS_KEY, "1");
      else localStorage.removeItem(TOS_KEY);
    } catch {
      /* private mode */
    }
  };
  return { accepted, setAccepted };
}

export function LoginTermsCheckbox({
  accepted,
  onChange,
  surface,
}: {
  accepted: boolean;
  onChange: (next: boolean) => void;
  surface: "card" | "stage";
}) {
  const urls = legalUrls();
  const onCard = surface === "card";
  const linkStyle: CSSProperties = {
    color: onCard ? "var(--lw-auth-theme, #3a84ff)" : STAGE_LINK,
  };
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        margin: 0,
        color: onCard ? CARD_INK : STAGE_INK,
        fontSize: 13,
        lineHeight: 1.45,
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={accepted}
        onChange={(event) => onChange(event.target.checked)}
        style={{
          marginTop: 3,
          accentColor: onCard ? "var(--lw-auth-theme, #3a84ff)" : STAGE_LINK,
        }}
      />
      <span>
        {t("login.termsLead")}{" "}
        <a href={urls.platformTermsUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
          {t("login.platformTerms")}
        </a>{" "}
        {t("login.termsAnd")}{" "}
        <a href={urls.productTermsUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
          {t("login.productTerms")}
        </a>{" "}
        {t("login.termsAnd")}{" "}
        <a
          href={urls.productPrivacyUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
        >
          {t("login.privacy")}
        </a>
      </span>
    </label>
  );
}
