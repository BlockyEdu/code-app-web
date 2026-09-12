import type { BlogPostRecord, WebPublishStatus } from "../api";
import { t } from "../i18n";
import type { AppSchema } from "./app-schema";
import { usesHostedPosts } from "./app-schema";

export const BLOG_DEFAULT_HERO = "欢迎来到我的博客";
export const LANDING_DEFAULT_HERO = "欢迎来到我的站点";
export const PORTFOLIO_DEFAULT_HERO = "欢迎来到我的作品集";
export const NEWS_DEFAULT_HERO = "欢迎来到我的资讯小程序";

const BLOG_DEFAULT_HERO_EN = "Welcome to my blog" as const;
const LANDING_DEFAULT_HERO_EN = "Welcome to my site" as const;
const PORTFOLIO_DEFAULT_HERO_EN = "Welcome to my portfolio" as const;
const NEWS_DEFAULT_HERO_EN = "Welcome to my news mini program" as const;

export function BLOG_MISSION_STEPS() {
  return [
    { id: "page" as const, title: t("mission.page"), hint: t("mission.pageHint") },
    { id: "data" as const, title: t("mission.data"), hint: t("mission.dataHint") },
    { id: "bind" as const, title: t("mission.bind"), hint: t("mission.bindHint") },
    { id: "publish" as const, title: t("mission.publish"), hint: t("mission.publishHint") },
  ];
}

export function LANDING_MISSION_STEPS() {
  return [
    { id: "page" as const, title: t("mission.page"), hint: t("mission.landingPageHint") },
    { id: "publish" as const, title: t("mission.publish"), hint: t("mission.landingPublishHint") },
  ];
}

export type BlogMissionId = ReturnType<typeof BLOG_MISSION_STEPS>[number]["id"];

function defaultHero(templateId: string | undefined): ReadonlySet<string> {
  if (templateId === "落地页") return new Set([LANDING_DEFAULT_HERO, LANDING_DEFAULT_HERO_EN]);
  if (templateId === "作品集") return new Set([PORTFOLIO_DEFAULT_HERO, PORTFOLIO_DEFAULT_HERO_EN]);
  if (templateId === "资讯小程序") return new Set([NEWS_DEFAULT_HERO, NEWS_DEFAULT_HERO_EN]);
  return new Set([BLOG_DEFAULT_HERO, BLOG_DEFAULT_HERO_EN]);
}

export function studioMissionTitle(templateId: string | null | undefined): string {
  if (templateId === "落地页") return t("mission.titleLanding");
  if (templateId === "作品集") return t("mission.titlePortfolio");
  if (templateId === "资讯小程序") return t("mission.titleNews");
  return t("mission.titleBlog");
}

export function studioMissionSteps(templateId: string | null | undefined) {
  return usesHostedPosts(templateId) ? BLOG_MISSION_STEPS() : LANDING_MISSION_STEPS();
}

export function blogMissionDone(input: {
  schema: AppSchema | null;
  posts: BlogPostRecord[];
  detailVisited: boolean;
  publish: WebPublishStatus | null;
}): Record<BlogMissionId, boolean> {
  return studioMissionDone({ ...input, templateId: input.schema?.templateId });
}

export function studioMissionDone(input: {
  schema: AppSchema | null;
  posts: BlogPostRecord[];
  detailVisited: boolean;
  publish: WebPublishStatus | null;
  templateId?: string | null;
}): Record<BlogMissionId, boolean> {
  const templateId = input.templateId ?? input.schema?.templateId;
  const hero = input.schema?.pages.flatMap((p) => p.nodes).find((n) => n.type === "hero");
  const ownPublished = input.posts.some(
    (p) => p.status === "published" && p.slug !== "hello-blockyedu",
  );
  const heading = hero?.props.heading;
  const page = Boolean(heading && !defaultHero(templateId).has(heading));
  const data = ownPublished || input.posts.filter((p) => p.status === "published").length > 1;
  const publish = Boolean(input.publish?.publicUrl || input.publish?.liveRelease?.publicUrl);
  if (!usesHostedPosts(templateId)) {
    return { page, data: true, bind: true, publish };
  }
  return {
    page,
    data,
    bind: input.detailVisited,
    publish,
  };
}
