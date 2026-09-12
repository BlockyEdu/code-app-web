import { t } from "../i18n";
import type { AppNode, AppSchema, BlogPostView } from "./app-schema";

const DEFAULT_CSP =
  "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data: blob: https:; font-src data:; base-uri 'none'; form-action 'none'; frame-ancestors *;";

export type BlogRenderRoute = { page: "home" } | { page: "post"; slug: string };
export type BlogLinkStyle = "hosted" | "static";

export type BlogRenderOptions = {
  schema: AppSchema;
  posts: BlogPostView[];
  route: BlogRenderRoute;
  /** Public site base path, e.g. /s/my-blog */
  basePath?: string;
  extraCss?: string;
  extraJs?: string;
  mode?: "preview" | "live";
  /** static = relative files for zip / GitHub Pages */
  linkStyle?: BlogLinkStyle;
};

type LinkCtx = {
  posts: BlogPostView[];
  post?: BlogPostView;
  base: string;
  primary: string;
  from: "home" | "post";
  linkStyle: BlogLinkStyle;
};

export function renderBlogHtml(opts: BlogRenderOptions): string {
  const { schema, posts, route, extraCss = "", extraJs = "" } = opts;
  const base = (opts.basePath ?? "").replace(/\/$/, "");
  const linkStyle = opts.linkStyle ?? "hosted";
  const primary = escapeAttr(schema.site.primary || "#1677ff");
  const bg = escapeAttr(schema.site.background || "#f8fafc");
  const page = schema.pages.find((p) =>
    route.page === "home" ? p.path === "/" : p.path.includes(":slug"),
  );
  const nodes = page?.nodes ?? schema.pages[0]?.nodes ?? [];
  const post = route.page === "post" ? posts.find((p) => p.slug === route.slug) : undefined;
  const from = route.page === "post" ? "post" : "home";

  const body = nodes
    .map((n) => renderNode(n, { posts, post, base, primary, from, linkStyle }))
    .join("\n");
  const title =
    route.page === "post"
      ? `${post?.title ?? t("blogHtml.posts")} · ${schema.site.title}`
      : schema.site.title;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="Content-Security-Policy" content="${DEFAULT_CSP.replace(/"/g, "&quot;")}" />
<title>${escapeHtml(title)}</title>
<style>
html,body{margin:0;padding:0;min-height:100%;font-family:system-ui,-apple-system,sans-serif;background:${bg};color:#0f172a;}
a{color:${primary};text-decoration:none}
a:hover{text-decoration:underline}
.wrap{max-width:720px;margin:0 auto;padding:24px 20px 64px}
.nav{display:flex;justify-content:space-between;align-items:center;padding:12px 0 20px;border-bottom:1px solid #e2e8f0;margin-bottom:24px}
.brand{font-weight:700;color:${primary};font-size:18px}
.hero h1{font-size:32px;margin:0 0 8px;line-height:1.25}
.hero p{margin:0;color:#475569;font-size:16px}
.post-card{display:block;padding:16px 0;border-bottom:1px solid #e2e8f0;color:inherit}
.post-card h2{margin:0 0 6px;font-size:20px}
.post-card p{margin:0;color:#64748b}
.article h1{font-size:28px;margin:0 0 8px}
.meta{color:#64748b;font-size:13px;margin-bottom:20px}
.article .body{white-space:pre-wrap;line-height:1.7}
.footer{margin-top:48px;color:#94a3b8;font-size:13px}
.empty{color:#94a3b8;padding:24px 0}
${extraCss}
</style>
</head>
<body>
<div class="wrap">
${body}
</div>
${extraJs ? `<script>\n${extraJs}\n</script>` : ""}
${
  opts.mode === "live"
    ? ""
    : `<script>
document.addEventListener("click",function(e){
  var a=e.target&&e.target.closest?e.target.closest("a"):null;
  if(!a)return;
  e.preventDefault();
  var href=a.getAttribute("href")||"";
  try{parent.postMessage({type:"blockyedu-blog-nav",href:href},"*");}catch(err){}
});
</script>`
}
</body>
</html>`;
}

function hrefFor(
  target: "home" | "post",
  slug: string | undefined,
  ctx: Pick<LinkCtx, "base" | "from" | "linkStyle">,
): string {
  if (ctx.linkStyle === "static") {
    if (ctx.from === "post") {
      return target === "home" ? "../index.html" : `./${encodeURIComponent(slug ?? "")}.html`;
    }
    return target === "home" ? "index.html" : `posts/${encodeURIComponent(slug ?? "")}.html`;
  }
  if (target === "home") return ctx.base || "/";
  const path = `/posts/${encodeURIComponent(slug ?? "")}`;
  return ctx.base ? `${ctx.base}${path}` : path;
}

function renderNode(node: AppNode, ctx: LinkCtx): string {
  const props = node.props ?? {};
  switch (node.type) {
    case "nav": {
      const links = parseLinks(props.links);
      const hrefHome = hrefFor("home", undefined, ctx);
      return `<nav class="nav"><a class="brand" href="${escapeAttr(hrefHome)}">${escapeHtml(props.brand || "Site")}</a><div>${links
        .map((l) => {
          const href =
            l.href === "/" || l.href === ""
              ? hrefFor("home", undefined, ctx)
              : resolveHref(l.href, ctx);
          return `<a href="${escapeAttr(href)}">${escapeHtml(l.label)}</a>`;
        })
        .join(" · ")}</div></nav>`;
    }
    case "hero":
      return `<section class="hero"><h1>${escapeHtml(props.heading || "")}</h1><p>${escapeHtml(props.subheading || "")}</p></section>`;
    case "postList": {
      const heading = escapeHtml(props.heading || t("blogHtml.posts"));
      if (!ctx.posts.length) {
        return `<section><h2>${heading}</h2><p class="empty">${escapeHtml(props.emptyText || t("blogHtml.empty"))}</p></section>`;
      }
      const cards = ctx.posts
        .map((p) => {
          const href = hrefFor("post", p.slug, ctx);
          return `<a class="post-card" href="${escapeAttr(href)}"><h2>${escapeHtml(p.title)}</h2><p>${escapeHtml(p.excerpt || "")}</p></a>`;
        })
        .join("");
      return `<section><h2>${heading}</h2>${cards}</section>`;
    }
    case "postDetail": {
      if (!ctx.post) {
        return `<p class="empty">${escapeHtml(props.notFoundText || t("blogHtml.notFound"))}</p>`;
      }
      return `<article class="article"><h1>${escapeHtml(ctx.post.title)}</h1><div class="meta">${escapeHtml(ctx.post.publishedAt || "")}</div><div class="body">${escapeHtml(ctx.post.content)}</div></article>`;
    }
    case "footer":
      return `<footer class="footer">${escapeHtml(props.text || "")}</footer>`;
    default:
      return "";
  }
}

function parseLinks(raw: string | undefined): Array<{ label: string; href: string }> {
  if (!raw) return [{ label: t("blogHtml.home"), href: "/" }];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [{ label: t("blogHtml.home"), href: "/" }];
    return parsed
      .filter((x) => x && typeof x === "object")
      .map((x) => ({
        label: String((x as { label?: string }).label ?? t("blogHtml.link")),
        href: String((x as { href?: string }).href ?? "/"),
      }));
  } catch {
    return [{ label: t("blogHtml.home"), href: "/" }];
  }
}

function resolveHref(href: string, ctx: Pick<LinkCtx, "base" | "from" | "linkStyle">): string {
  if (href === "/" || href === "") return hrefFor("home", undefined, ctx);
  const post = href.match(/^\/posts\/([^/?#]+)/);
  if (post?.[1]) return hrefFor("post", decodeURIComponent(post[1]), ctx);
  if (ctx.linkStyle === "static") return href;
  if (href.startsWith("/") && ctx.base) return `${ctx.base}${href}`;
  return href;
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

export function previewCspHeader(): string {
  return DEFAULT_CSP;
}
