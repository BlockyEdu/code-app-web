/**
 * Build isolated HTML documents for kind=web Artifact preview.
 * Never executes UGC in the parent page (no new Function / DOM inject on host).
 */
import type { WorldState } from "./targets";

const DOC_CSP =
  "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data: blob:; font-src data:; base-uri 'none'; form-action 'none'; frame-ancestors *;";

/** iframe sandbox without allow-same-origin → opaque origin (parent XSS isolation). */
export const WEB_IFRAME_SANDBOX = "allow-scripts allow-forms allow-modals";

export function buildHtmlFromWorld(world: WorldState): string {
  const title = escapeHtml(world.web.title || "Web Preview");
  const bg = world.web.background || "#0f172a";
  const primary = world.web.primary || "#1677ff";
  const parts: string[] = [];

  for (const el of world.web.elements) {
    if (el.kind === "heading") {
      const tag = el.level === "h2" || el.level === "h3" ? el.level : "h1";
      parts.push(`<${tag} style="color:${escapeAttr(primary)}">${escapeHtml(el.text)}</${tag}>`);
    } else if (el.kind === "text") {
      parts.push(`<p>${escapeHtml(el.text)}</p>`);
    } else if (el.kind === "card") {
      parts.push(
        `<article class="card"><strong>${escapeHtml(el.text)}</strong><div>${escapeHtml(el.extra || "")}</div></article>`,
      );
    } else if (el.kind === "button") {
      const msg = escapeAttr(el.extra || el.text);
      parts.push(
        `<button type="button" class="btn" onclick="alert('${msg}')">${escapeHtml(el.text)}</button>`,
      );
    } else if (el.kind === "image") {
      parts.push(`<div class="card">🖼 ${escapeHtml(el.text || "图片")}</div>`);
    } else if (el.kind === "notice") {
      parts.push(`<aside class="notice">${escapeHtml(el.text)}</aside>`);
    }
  }

  if (parts.length === 0) {
    parts.push(`<p class="muted">暂无内容。在积木中添加页面元素后再次预览。</p>`);
  }

  const notices = world.web.notices
    .map((n) => `<div class="notice">${escapeHtml(n)}</div>`)
    .join("");

  const body = `
<main style="background:${escapeAttr(bg)};color:#e2e8f0;min-height:100vh;padding:24px;box-sizing:border-box">
  <header style="margin-bottom:16px">
    <div style="font-size:12px;color:#94a3b8">BlockyEdu · 隔离预览</div>
    <h1 style="margin:4px 0 0;font-size:22px;color:${escapeAttr(primary)}">${title}</h1>
  </header>
  ${parts.join("\n  ")}
  ${notices}
</main>`;

  return wrapDocument(body, {
    title: world.web.title || "Web Preview",
    css: `
.card{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:12px;margin:8px 0}
.btn{background:${primary};color:#fff;border:none;border-radius:6px;padding:8px 14px;cursor:pointer;margin:6px 0}
.notice{background:#172554;border:1px solid #1d4ed8;padding:8px 12px;border-radius:6px;margin:8px 0;font-size:13px}
.muted{color:#64748b}
p{line-height:1.6}
`,
  });
}

export function composeStaticSiteClient(files: Record<string, string>): string | null {
  const htmlPath = pick(files, ["index.html", "src/index.html"]);
  if (!htmlPath) return null;
  let html = files[htmlPath];
  const css = pickContent(files, ["styles.css", "style.css", "src/styles.css"]) ?? "";
  const js = pickContent(files, ["app.js", "main.js", "src/app.js"]) ?? "";
  html = html
    .replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi, "")
    .replace(/<script\b[^>]*\bsrc=["'][^"']+["'][^>]*>\s*<\/script>/gi, "");
  if (!/<html[\s>]/i.test(html)) {
    return wrapDocument(html, { css, js });
  }
  if (css) html = html.replace(/<\/head>/i, `<style>\n${css}\n</style></head>`);
  if (js) html = html.replace(/<\/body>/i, `<script>\n${js}\n<\/script></body>`);
  if (!/Content-Security-Policy/i.test(html)) {
    html = html.replace(
      /<head([^>]*)>/i,
      `<head$1>\n<meta http-equiv="Content-Security-Policy" content="${DOC_CSP.replace(/"/g, "&quot;")}" />`,
    );
  }
  return html;
}

export function wrapDocument(
  bodyHtml: string,
  opts?: { title?: string; css?: string; js?: string },
): string {
  const title = escapeHtml(opts?.title?.trim() || "BlockyEdu Preview");
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="Content-Security-Policy" content="${DOC_CSP.replace(/"/g, "&quot;")}" />
<title>${title}</title>
<style>html,body{margin:0;padding:0;min-height:100%;font-family:system-ui,sans-serif}${opts?.css ?? ""}</style>
</head>
<body>
${bodyHtml}
${opts?.js ? `<script>\n${opts.js}\n</script>` : ""}
</body>
</html>`;
}

/** Offline / unauthenticated fallback: srcdoc (still sandboxed opaque origin). */
export function toSrcDoc(html: string): string {
  return html;
}

function pick(files: Record<string, string>, candidates: string[]): string | undefined {
  const keys = Object.keys(files);
  for (const c of candidates) {
    const hit = keys.find((k) => k === c || k.endsWith(`/${c}`));
    if (hit) return hit;
  }
  return undefined;
}

function pickContent(files: Record<string, string>, candidates: string[]): string | undefined {
  const path = pick(files, candidates);
  return path ? files[path] : undefined;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
