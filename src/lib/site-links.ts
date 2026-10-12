export function coursePlatformUrl(): string {
  return import.meta.env.VITE_EDU_APP_URL?.replace(/\/$/, "") || "http://localhost:18082";
}

export function salesContactUrl(): string {
  return import.meta.env.VITE_SALES_CONTACT_URL?.trim() || "mailto:hello@blockyedu.com";
}
