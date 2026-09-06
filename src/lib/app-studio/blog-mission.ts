import type { BlogPostRecord, WebPublishStatus } from "../api";
import type { AppSchema } from "./app-schema";
import { usesHostedPosts } from "./app-schema";

export const BLOG_DEFAULT_HERO = "欢迎来到我的博客";
export const LANDING_DEFAULT_HERO = "欢迎来到我的站点";
export const PORTFOLIO_DEFAULT_HERO = "欢迎来到我的作品集";
export const NEWS_DEFAULT_HERO = "欢迎来到我的资讯小程序";

export const BLOG_MISSION_STEPS = [
  { id: "page", title: "搭页面", hint: "在 Design 改 Hero 标题，右侧预览会跟着变。" },
  { id: "data", title: "建数据", hint: "到 Data 新建一篇内容并设为已发布。" },
  { id: "bind", title: "绑定详情", hint: "预览里点一条内容，打开详情页。" },
  { id: "publish", title: "上线分享", hint: "发布后复制链接发给家长，或下载 zip。" },
] as const;

export const LANDING_MISSION_STEPS = [
  { id: "page", title: "搭页面", hint: "改 Hero 标题和介绍。" },
  { id: "publish", title: "上线分享", hint: "发布后复制链接，或下载 zip 自己部署。" },
] as const;

export type BlogMissionId = (typeof BLOG_MISSION_STEPS)[number]["id"];

function defaultHero(templateId: string | undefined): string {
  if (templateId === "落地页") return LANDING_DEFAULT_HERO;
  if (templateId === "作品集") return PORTFOLIO_DEFAULT_HERO;
  if (templateId === "资讯小程序") return NEWS_DEFAULT_HERO;
  return BLOG_DEFAULT_HERO;
}

export function studioMissionTitle(templateId: string | null | undefined, zh: boolean): string {
  if (templateId === "落地页") return zh ? "做出我的落地页" : "Ship my landing page";
  if (templateId === "作品集") return zh ? "做出我的作品集" : "Ship my portfolio";
  if (templateId === "资讯小程序") return zh ? "做出我的资讯小程序" : "Ship my mini program";
  return zh ? "做出我的博客" : "Ship my blog";
}

export function studioMissionSteps(templateId: string | null | undefined) {
  return usesHostedPosts(templateId) ? BLOG_MISSION_STEPS : LANDING_MISSION_STEPS;
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
  const page = Boolean(hero?.props.heading && hero.props.heading !== defaultHero(templateId));
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
