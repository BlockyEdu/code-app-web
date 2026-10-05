import {
  HeadlessLoginPanel,
  LoginCanvas,
  type LuminaryAuthSession,
} from "@luminaryworks/auth-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LoginTermsCheckbox, useLoginTermsAccepted } from "../components/LoginTermsGate";
import { useAuthStore } from "../lib/auth-store";
import { t, tFor } from "../lib/i18n";
import {
  isDirectIdpEnabled,
  isLocalPasswordLoginAllowed,
  peekPostLoginPath,
  readLuminaryIdpConfig,
  rememberPostLoginPath,
} from "../lib/idp";
import {
  type AppLocale,
  isAppLocale,
  LOGIN_LOCALE_OPTIONS,
  useLocaleStore,
} from "../lib/locale-store";
import styles from "./login-stage.module.scss";

const LOGIN_LOCALE_KEY = "blockyedu_login_locale";
/** Brand mark. Stays in Chinese when the UI language changes. */
const BRAND_MARK_ZH = "智码学院";
const SITE_NAME = "BlockyEdu";
const LOGO_SRC = "/logo-mark.png";
const THEME_COLOR = "#2563eb";

function productLabelLocale(cardLocale: string): AppLocale | null {
  if (cardLocale === "zh-CN" || cardLocale === "en" || cardLocale === "fr") return cardLocale;
  return null;
}

function readLoginLocale(fallback: AppLocale): AppLocale {
  try {
    const stored = window.localStorage.getItem(LOGIN_LOCALE_KEY);
    if (stored && isAppLocale(stored)) return stored;
  } catch {
    /* private mode */
  }
  return fallback;
}

function BlockyBackdrop({ locale }: { locale: AppLocale }) {
  return (
    <div className={styles.backdrop} aria-hidden="true">
      <div className={styles.glow} />
      <svg className={styles.artLeft} viewBox="0 0 460 460" preserveAspectRatio="xMidYMid meet">
        <g transform="translate(16 70)">
          <rect width="86" height="86" rx="22" fill="#fff" fillOpacity="0.14" />
          <rect y="102" width="86" height="86" rx="22" fill="#fff" fillOpacity="0.1" />
          <rect y="204" width="86" height="86" rx="22" fill="#fff" fillOpacity="0.08" />
          <rect x="112" width="168" height="168" rx="36" fill="#fff" fillOpacity="0.12" />
          <path d="M168 52 L168 116 L224 84 Z" fill="#7ec8ff" fillOpacity="0.9" />
          <rect x="112" y="190" width="168" height="120" rx="28" fill="#fff" fillOpacity="0.1" />
          <path
            d="M148 246 L176 226 L148 206 M196 206 L224 226 L196 246 M178 198 L196 254"
            stroke="#7ec8ff"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.9"
          />
          <path
            d="M196 80 C 250 20, 300 40, 318 8"
            stroke="#f5c518"
            strokeWidth="2"
            strokeDasharray="5 8"
            fill="none"
            opacity="0.85"
          />
          <circle cx="248" cy="48" r="4" fill="#f5c518" />
          <polygon
            points="318,0 326,16 344,16 330,26 336,42 318,32 300,42 306,26 292,16 310,16"
            fill="#f5c518"
          />
        </g>
      </svg>
      <svg className={styles.artRight} viewBox="0 0 460 520" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="loginBeam" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#7ee0ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g transform="translate(20 16)">
          <circle cx="250" cy="36" r="28" fill="#f5c518" fillOpacity="0.85" />
          <path d="M222 58 L120 250 L300 250 Z" fill="url(#loginBeam)" />
          <rect x="78" y="248" width="92" height="92" rx="20" fill="#fff" fillOpacity="0.16" />
          <ellipse cx="168" cy="368" rx="70" ry="16" fill="#04143c" fillOpacity="0.28" />
          <rect x="40" y="80" width="150" height="190" rx="24" fill="#fff" fillOpacity="0.08" />
          <rect x="62" y="108" width="106" height="10" rx="5" fill="#fff" fillOpacity="0.35" />
          <rect x="62" y="132" width="88" height="10" rx="5" fill="#f5c518" fillOpacity="0.85" />
          <rect x="62" y="156" width="100" height="10" rx="5" fill="#fff" fillOpacity="0.28" />
          <rect x="62" y="180" width="72" height="10" rx="5" fill="#fff" fillOpacity="0.2" />
          <path
            d="M168 137 C 210 110, 250 150, 286 168"
            stroke="#f5c518"
            strokeWidth="2"
            strokeDasharray="4 7"
            fill="none"
          />
          <polygon
            points="292,156 298,170 312,170 301,179 305,193 292,184 279,193 283,179 272,170 286,170"
            fill="#f5c518"
          />
        </g>
      </svg>
      <div className={`${styles.scene} ${styles.sceneLeft}`}>
        <article className={styles.panel}>
          <p className={styles.kicker}>{tFor(locale, "login.bgLesson")}</p>
          <p className={styles.panelTitle}>{tFor(locale, "login.bgLessonTitle")}</p>
          <pre className={styles.code}>
            <span>for (const step of lesson) {"{"}</span>
            <span className={styles.codeHot}>  explain(step)</span>
            <span>{"}"}</span>
          </pre>
        </article>
        <article className={styles.panel}>
          <p className={styles.kicker}>{tFor(locale, "login.bgExplain")}</p>
          <p className={styles.explainBody}>{tFor(locale, "login.bgExplainCode")}</p>
        </article>
      </div>
      <div className={`${styles.scene} ${styles.sceneRight}`}>
        <article className={styles.panel}>
          <p className={styles.kicker}>{tFor(locale, "login.bgPassage")}</p>
          <p className={styles.passage}>{tFor(locale, "login.bgPassageBody")}</p>
        </article>
        <article className={styles.panel}>
          <p className={styles.kicker}>{tFor(locale, "login.bgExplain")}</p>
          <p className={styles.explainBody}>{tFor(locale, "login.bgExplainPassage")}</p>
        </article>
      </div>
    </div>
  );
}

export function LoginPage() {
  const uiLocale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const [cardLocale, setCardLocale] = useState<AppLocale>(uiLocale);
  const brandTitle = t("chrome.brandTitle");
  useEffect(() => {
    document.title = brandTitle;
  }, [brandTitle]);
  useEffect(() => {
    setCardLocale(readLoginLocale(uiLocale));
  }, [uiLocale]);

  const fetchMe = useAuthStore((s) => s.fetchMe);
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const ssoEnabled = isDirectIdpEnabled();
  const allowLocal = isLocalPasswordLoginAllowed();
  const config = useMemo(() => readLuminaryIdpConfig(), []);
  const returnUrl = useMemo(() => peekPostLoginPath() || "/", []);
  const { accepted, setAccepted } = useLoginTermsAccepted();
  const [localBlocked, setLocalBlocked] = useState(false);
  const labelLocale = productLabelLocale(cardLocale);

  useEffect(() => {
    rememberPostLoginPath(returnUrl);
  }, [returnUrl]);

  const onTermsChange = (next: boolean) => {
    setAccepted(next);
    if (next) setLocalBlocked(false);
  };

  const onOidcSession = useCallback(
    async (session: LuminaryAuthSession, next?: string) => {
      localStorage.setItem("blockyedu_token", session.accessToken);
      await fetchMe();
      const dest = (next || returnUrl || "/").replace(/^\/?/, "/");
      window.location.replace(dest.startsWith("http") ? "/" : dest);
    },
    [fetchMe, returnUrl],
  );

  return (
    <LoginCanvas
      tone="edu"
      locale={cardLocale}
      locales={LOGIN_LOCALE_OPTIONS}
      languageLabel={tFor(cardLocale, "login.language")}
      decor={<BlockyBackdrop locale={cardLocale} />}
      onLocaleChange={(next) => {
        if (!isAppLocale(next)) return;
        try {
          window.localStorage.setItem(LOGIN_LOCALE_KEY, next);
        } catch {
          /* private mode */
        }
        setLocale(next);
        setCardLocale(next);
        window.location.reload();
      }}
    >
      <header className={styles.brand}>
        <img className={styles.mark} src={LOGO_SRC} width={40} height={40} alt={SITE_NAME} />
        <span className={styles.wordmark}>
          <span className={styles.brandName}>{SITE_NAME}</span>
          <span className={styles.brandSub} lang="zh-CN">
            {BRAND_MARK_ZH}
          </span>
        </span>
      </header>
      <div className={styles.center}>
        {ssoEnabled ? (
          <HeadlessLoginPanel
            key={cardLocale}
            locale={cardLocale}
            config={config}
            productName={SITE_NAME}
            logoSrc={LOGO_SRC}
            themeColor={THEME_COLOR}
            mode="redirect"
            returnUrl={returnUrl}
            showRegister
            consentOk={accepted}
            consent={
              <LoginTermsCheckbox surface="card" accepted={accepted} onChange={onTermsChange} />
            }
            onOidcSession={onOidcSession}
            labels={
              labelLocale
                ? {
                    title: tFor(labelLocale, "login.title", { siteName: SITE_NAME }),
                    subtitle: tFor(labelLocale, "login.subtitle"),
                    identifierPlaceholder: tFor(labelLocale, "login.identifier"),
                    passwordPlaceholder: tFor(labelLocale, "login.password"),
                    submitPassword: tFor(labelLocale, "login.submitPassword"),
                    submitSso: tFor(labelLocale, "login.submitSso"),
                    hint: tFor(labelLocale, "login.hint"),
                    experienceUnavailable: tFor(labelLocale, "login.experienceUnavailable"),
                    consentRequired: tFor(labelLocale, "login.consentRequired"),
                  }
                : undefined
            }
          />
        ) : (
          <>
            <p className={styles.missing}>{t("login.missingClient")}</p>
            <LoginTermsCheckbox surface="stage" accepted={accepted} onChange={onTermsChange} />
          </>
        )}

        {allowLocal ? (
          <form
            className={styles.local}
            onSubmit={async (e) => {
              e.preventDefault();
              if (!accepted) {
                setLocalBlocked(true);
                return;
              }
              const fd = new FormData(e.currentTarget);
              const username = String(fd.get("username") || "");
              const password = String(fd.get("password") || "");
              const ok = await login(username, password);
              if (ok) window.location.replace("/");
            }}
          >
            <p className={styles.localLead}>{t("login.localLead")}</p>
            <input name="username" defaultValue="learner1" placeholder={t("login.username")} />
            <input
              name="password"
              type="password"
              defaultValue="learner123"
              placeholder={t("login.passwordPh")}
            />
            <button type="submit" disabled={loading}>
              {t("login.localSubmit")}
            </button>
            {localBlocked && !accepted ? (
              <p className={styles.localError} role="alert">
                {t("login.consentRequired")}
              </p>
            ) : null}
          </form>
        ) : null}

        <p className={styles.lead}>{tFor(cardLocale, "login.heroSubtitle")}</p>
      </div>
    </LoginCanvas>
  );
}
