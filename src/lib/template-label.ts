import { t } from "./i18n";

const TEMPLATE_LABEL_KEYS: Record<string, string> = {
  落地页: "template.landing",
  作品集: "template.portfolio",
  博客: "template.blog",
  管理后台: "template.admin",
  资讯小程序: "template.newsMp",
  活动报名: "template.event",
  商城小程序: "template.shop",
  灯光场景: "template.lights",
  温控联动: "template.climate",
  安防演示: "template.security",
  智慧窗控: "template.window",
  智慧灌溉: "template.irrigation",
  鱼塘增氧: "template.pond",
  互动玩具: "template.toy",
  传感器演示: "template.sensorDemo",
  空白项目: "template.blank",
  脚本草稿: "template.script",
  空白练习: "template.blankEx",
  "Hello World": "template.hello",
  排序算法: "template.sort",
};

export function templateLabel(templateId: string): string {
  const key = TEMPLATE_LABEL_KEYS[templateId];
  if (!key) return templateId;
  return t(key);
}
