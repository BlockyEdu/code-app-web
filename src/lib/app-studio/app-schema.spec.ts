import { expect, test } from "@rstest/core";
import {
  applySchemaPatch,
  defaultBlogSchema,
  defaultSchemaForTemplate,
  parseAppSchema,
} from "./app-schema";

test("defaultBlogSchema can parse", () => {
  const raw = defaultBlogSchema();
  const { schema, issues } = parseAppSchema(raw);
  expect(issues).toEqual([]);
  expect(schema?.templateId).toBe("博客");
  expect(schema?.pages.length).toBe(2);
  expect(schema?.pages[0]?.nodes.some((n) => n.type === "hero")).toBe(true);

  const fromJson = parseAppSchema(JSON.parse(JSON.stringify(raw)));
  expect(fromJson.issues).toEqual([]);
  expect(fromJson.schema?.site.title).toBe(raw.site.title);
});

test("applySchemaPatch updates hero.heading", () => {
  const { schema, issues } = applySchemaPatch(defaultBlogSchema(), [
    { op: "setNodeProp", nodeId: "hero", field: "heading", value: "你好世界" },
  ]);
  expect(issues).toEqual([]);
  const hero = schema.pages[0]?.nodes.find((n) => n.id === "hero");
  expect(hero?.props.heading).toBe("你好世界");
});

test("landing and news templates parse", () => {
  const landing = defaultSchemaForTemplate("落地页", "开放日");
  expect(parseAppSchema(landing).issues).toEqual([]);
  expect(landing.pages.length).toBe(1);
  const news = defaultSchemaForTemplate("资讯小程序");
  expect(parseAppSchema(news).issues).toEqual([]);
  expect(news.templateId).toBe("资讯小程序");
});
