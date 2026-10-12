/** AppSchema for web App Studio (blog slice). Spec: spec/app-studio-spec.md */

import { t } from "../i18n";

export const APP_SCHEMA_VERSION = 1;
export const BLOG_TEMPLATE_IDS = new Set(["博客", "blog"]);
export const WEB_STUDIO_TEMPLATES = new Set(["博客", "blog", "落地页", "作品集"]);
export const MP_STUDIO_TEMPLATES = new Set(["资讯小程序", "活动报名", "商城小程序"]);
export const NODE_TYPES = ["nav", "hero", "postList", "postDetail", "footer"] as const;
export type AppNodeType = (typeof NODE_TYPES)[number];

export type NavLink = { label: string; href: string };

export type AppNode = {
  id: string;
  type: AppNodeType;
  props: Record<string, string>;
};

export type AppPage = {
  id: string;
  path: string;
  title: string;
  nodes: AppNode[];
};

export type AppLogic = {
  id: string;
  trigger: { nodeId: string; event: string };
  actions: Array<{ type: string; to?: string }>;
};

export type AppSchema = {
  version: number;
  templateId: string;
  site: {
    title: string;
    tagline: string;
    primary: string;
    background: string;
  };
  pages: AppPage[];
  logic: AppLogic[];
};

export type SchemaIssue = { code: string; message: string };

export function isBlogTemplate(templateId: string | null | undefined): boolean {
  return Boolean(templateId && BLOG_TEMPLATE_IDS.has(templateId));
}

export function isAppStudioTemplate(templateId: string | null | undefined): boolean {
  if (!templateId) return false;
  return WEB_STUDIO_TEMPLATES.has(templateId) || MP_STUDIO_TEMPLATES.has(templateId);
}

export function usesHostedPosts(templateId: string | null | undefined): boolean {
  if (!templateId) return false;
  return (
    BLOG_TEMPLATE_IDS.has(templateId) ||
    templateId === "作品集" ||
    MP_STUDIO_TEMPLATES.has(templateId)
  );
}

export function hasDetailPage(schema: AppSchema): boolean {
  return schema.pages.some((p) => p.path.includes(":slug"));
}

export function defaultBlogSchema(title = t("schema.myBlog")): AppSchema {
  const brand = title.trim() || t("schema.myBlog");
  return {
    version: APP_SCHEMA_VERSION,
    templateId: "博客",
    site: {
      title: brand,
      tagline: t("schema.taglineBlog"),
      primary: "#1677ff",
      background: "#f8fafc",
    },
    pages: [
      {
        id: "home",
        path: "/",
        title: t("schema.home"),
        nodes: [
          {
            id: "nav",
            type: "nav",
            props: { brand, links: JSON.stringify([{ label: t("schema.home"), href: "/" }]) },
          },
          {
            id: "hero",
            type: "hero",
            props: {
              heading: t("schema.heroBlog"),
              subheading: t("schema.heroBlogSub"),
            },
          },
          {
            id: "list",
            type: "postList",
            props: { heading: t("schema.latestPosts"), emptyText: t("schema.emptyPosts") },
          },
          {
            id: "footer",
            type: "footer",
            props: { text: t("schema.footerLearn") },
          },
        ],
      },
      {
        id: "post",
        path: "/posts/:slug",
        title: t("schema.posts"),
        nodes: [
          {
            id: "nav-detail",
            type: "nav",
            props: { brand, links: JSON.stringify([{ label: t("schema.home"), href: "/" }]) },
          },
          {
            id: "detail",
            type: "postDetail",
            props: { notFoundText: t("schema.notFoundPost") },
          },
          {
            id: "footer-detail",
            type: "footer",
            props: { text: t("schema.footerLearn") },
          },
        ],
      },
    ],
    logic: [
      {
        id: "open-post",
        trigger: { nodeId: "list", event: "selectPost" },
        actions: [{ type: "navigate", to: "/posts/:slug" }],
      },
    ],
  };
}

export function defaultLandingSchema(title = t("schema.mySite")): AppSchema {
  const brand = title.trim() || t("schema.mySite");
  return {
    version: APP_SCHEMA_VERSION,
    templateId: "落地页",
    site: {
      title: brand,
      tagline: t("schema.taglineLanding"),
      primary: "#1677ff",
      background: "#f8fafc",
    },
    pages: [
      {
        id: "home",
        path: "/",
        title: t("schema.home"),
        nodes: [
          {
            id: "nav",
            type: "nav",
            props: { brand, links: JSON.stringify([{ label: t("schema.home"), href: "/" }]) },
          },
          {
            id: "hero",
            type: "hero",
            props: {
              heading: t("schema.heroLanding"),
              subheading: t("schema.heroLandingSub"),
            },
          },
          {
            id: "footer",
            type: "footer",
            props: { text: t("schema.footerDeploy") },
          },
        ],
      },
    ],
    logic: [],
  };
}

export function defaultPortfolioSchema(title = t("schema.myPortfolio")): AppSchema {
  const brand = title.trim() || t("schema.myPortfolio");
  const schema = defaultBlogSchema(brand);
  schema.templateId = "作品集";
  schema.site.tagline = t("schema.taglinePortfolio");
  const hero = schema.pages[0]?.nodes.find((n) => n.id === "hero");
  if (hero) {
    hero.props.heading = t("schema.heroPortfolio");
    hero.props.subheading = t("schema.heroPortfolioSub");
  }
  const list = schema.pages[0]?.nodes.find((n) => n.id === "list");
  if (list) {
    list.props.heading = t("schema.works");
    list.props.emptyText = t("schema.emptyWorks");
  }
  const detail = schema.pages[1]?.nodes.find((n) => n.id === "detail");
  if (detail) detail.props.notFoundText = t("schema.notFoundWork");
  return schema;
}

function defaultListMiniSchema(
  templateId: string,
  title: string | undefined,
  copy: {
    brand: string;
    tagline: string;
    heading: string;
    subheading: string;
    listHeading: string;
    emptyText: string;
  },
): AppSchema {
  const brand = title?.trim() || copy.brand;
  const schema = defaultBlogSchema(brand);
  schema.templateId = templateId;
  schema.site.tagline = copy.tagline;
  const hero = schema.pages[0]?.nodes.find((n) => n.id === "hero");
  if (hero) {
    hero.props.heading = copy.heading;
    hero.props.subheading = copy.subheading;
  }
  const list = schema.pages[0]?.nodes.find((n) => n.id === "list");
  if (list) {
    list.props.heading = copy.listHeading;
    list.props.emptyText = copy.emptyText;
  }
  return schema;
}

export function defaultNewsMiniSchema(title = t("schema.myNews")): AppSchema {
  return defaultListMiniSchema("资讯小程序", title, {
    brand: t("schema.myNews"),
    tagline: t("schema.taglineNews"),
    heading: t("schema.heroNews"),
    subheading: t("schema.heroNewsSub"),
    listHeading: t("schema.news"),
    emptyText: t("schema.emptyNews"),
  });
}

export function defaultEventMiniSchema(title = t("schema.myEvent")): AppSchema {
  return defaultListMiniSchema("活动报名", title, {
    brand: t("schema.myEvent"),
    tagline: t("schema.taglineEvent"),
    heading: t("schema.heroEvent"),
    subheading: t("schema.heroEventSub"),
    listHeading: t("schema.events"),
    emptyText: t("schema.emptyEvents"),
  });
}

export function defaultShopMiniSchema(title = t("schema.myShop")): AppSchema {
  return defaultListMiniSchema("商城小程序", title, {
    brand: t("schema.myShop"),
    tagline: t("schema.taglineShop"),
    heading: t("schema.heroShop"),
    subheading: t("schema.heroShopSub"),
    listHeading: t("schema.products"),
    emptyText: t("schema.emptyProducts"),
  });
}

export function defaultSchemaForTemplate(templateId: string, title?: string): AppSchema {
  if (templateId === "落地页") return defaultLandingSchema(title);
  if (templateId === "作品集") return defaultPortfolioSchema(title);
  if (templateId === "资讯小程序") return defaultNewsMiniSchema(title);
  if (templateId === "活动报名") return defaultEventMiniSchema(title);
  if (templateId === "商城小程序") return defaultShopMiniSchema(title);
  return defaultBlogSchema(title);
}

export function parseAppSchema(raw: unknown): { schema: AppSchema | null; issues: SchemaIssue[] } {
  const issues: SchemaIssue[] = [];
  if (!raw || typeof raw !== "object") {
    return { schema: null, issues: [{ code: "APP-ERR-SCHEMA", message: t("schema.mustObject") }] };
  }
  const obj = raw as Record<string, unknown>;
  const site = obj.site as Record<string, unknown> | undefined;
  const pages = obj.pages;
  if (!site || typeof site.title !== "string") {
    issues.push({ code: "APP-ERR-SCHEMA", message: t("schema.siteTitle") });
  }
  if (!Array.isArray(pages) || pages.length === 0) {
    issues.push({ code: "APP-ERR-SCHEMA", message: t("schema.needPage") });
  }
  const nodes: AppNode[] = [];
  if (Array.isArray(pages)) {
    for (const page of pages) {
      if (!page || typeof page !== "object") continue;
      const p = page as Record<string, unknown>;
      if (typeof p.id !== "string" || typeof p.path !== "string") {
        issues.push({ code: "APP-ERR-SCHEMA", message: t("schema.pageIdPath") });
      }
      if (!Array.isArray(p.nodes)) {
        issues.push({
          code: "APP-ERR-SCHEMA",
          message: t("schema.pageNodes", { id: String(p.id) }),
        });
        continue;
      }
      for (const node of p.nodes) {
        if (!node || typeof node !== "object") continue;
        const n = node as Record<string, unknown>;
        if (typeof n.id !== "string" || typeof n.type !== "string") {
          issues.push({ code: "APP-ERR-SCHEMA", message: t("schema.nodeIdType") });
          continue;
        }
        if (!NODE_TYPES.includes(n.type as AppNodeType)) {
          issues.push({ code: "APP-ERR-SCHEMA", message: t("schema.badNode", { type: n.type }) });
        }
        nodes.push({
          id: n.id,
          type: n.type as AppNodeType,
          props: (n.props && typeof n.props === "object" ? n.props : {}) as Record<string, string>,
        });
      }
    }
  }
  if (issues.length) return { schema: null, issues };
  return {
    schema: {
      version: typeof obj.version === "number" ? obj.version : APP_SCHEMA_VERSION,
      templateId: typeof obj.templateId === "string" ? obj.templateId : "博客",
      site: {
        title: String(site?.title ?? t("schema.myBlog")),
        tagline: String(site?.tagline ?? ""),
        primary: String(site?.primary ?? "#1677ff"),
        background: String(site?.background ?? "#f8fafc"),
      },
      pages: (pages as AppPage[]).map((p) => ({
        id: p.id,
        path: p.path,
        title: typeof p.title === "string" ? p.title : p.id,
        nodes: (p.nodes ?? []).map((n) => ({
          id: n.id,
          type: n.type,
          props: (n.props ?? {}) as Record<string, string>,
        })),
      })),
      logic: Array.isArray(obj.logic) ? (obj.logic as AppLogic[]) : [],
    },
    issues: [],
  };
}

export function applySchemaPatch(
  schema: AppSchema,
  operations: Array<{
    op: string;
    pageId?: string;
    nodeId?: string;
    field?: string;
    value?: unknown;
  }>,
): { schema: AppSchema; issues: SchemaIssue[] } {
  const next: AppSchema = structuredClone(schema);
  const issues: SchemaIssue[] = [];
  for (const op of operations) {
    if (op.op === "setSiteField" && op.field && typeof op.value === "string") {
      if (
        op.field === "title" ||
        op.field === "tagline" ||
        op.field === "primary" ||
        op.field === "background"
      ) {
        next.site[op.field] = op.value;
      } else {
        issues.push({
          code: "APP-ERR-SCHEMA",
          message: t("schema.badSiteField", { field: op.field }),
        });
      }
      continue;
    }
    if (op.op === "setNodeProp" && op.nodeId && op.field && typeof op.value === "string") {
      let found = false;
      for (const page of next.pages) {
        if (op.pageId && page.id !== op.pageId) continue;
        const node = page.nodes.find((n) => n.id === op.nodeId);
        if (node) {
          node.props[op.field] = op.value;
          found = true;
        }
      }
      if (!found)
        issues.push({
          code: "APP-ERR-SCHEMA",
          message: t("schema.missingNode", { nodeId: op.nodeId }),
        });
      continue;
    }
    issues.push({ code: "APP-ERR-SCHEMA", message: t("schema.badOp", { op: op.op }) });
  }
  return { schema: next, issues };
}

export type BlogPostView = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  publishedAt?: string | null;
};

export function slugifyTitle(title: string): string {
  const ascii = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (ascii && /^[a-z0-9-]+$/.test(ascii)) return ascii.slice(0, 60);
  const compact = ascii.replace(/[^a-z0-9-]/g, "").slice(0, 24);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${compact || "post"}-${suffix}`;
}
