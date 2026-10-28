import type { ArtifactKind } from "../types/artifact";

/** Bundled samples on the programming site. Same app as the editor; not a demo host. */
export type SampleCategory = "web" | "miniprogram" | "smarthome" | "iot" | "basics";

export type SampleLevel = "beginner" | "advanced";

/** Home page grouping. Independent of `category`, which drives the samples filter chips. */
export type SampleTrack = "iot" | "apps" | "basics";

export type SamplePalette = {
  from: string;
  to: string;
  ink: string;
  accent: string;
};

export type OfficialSample = {
  slug: string;
  kind: ArtifactKind;
  templateId?: string;
  intent: "learn" | "build" | "ship";
  nameKey: string;
  blurbKey: string;
  category: SampleCategory;
  track: SampleTrack;
  level: SampleLevel;
  minutes: number;
  featured: boolean;
  palette: SamplePalette;
};

export const SAMPLE_CHIP_IDS = ["web", "miniprogram", "smarthome", "iot", "basics"] as const;

export type SampleChipId = (typeof SAMPLE_CHIP_IDS)[number];

export const OFFICIAL_SAMPLES: readonly OfficialSample[] = [
  {
    slug: "landing-page",
    kind: "web",
    templateId: "落地页",
    intent: "build",
    nameKey: "samples.landing.name",
    blurbKey: "samples.landing.blurb",
    category: "web",
    track: "apps",
    level: "beginner",
    minutes: 10,
    featured: false,
    palette: { from: "#DBEAFE", to: "#2563EB", ink: "#1E3A8A", accent: "#EFF6FF" },
  },
  {
    slug: "portfolio",
    kind: "web",
    templateId: "作品集",
    intent: "build",
    nameKey: "samples.portfolio.name",
    blurbKey: "samples.portfolio.blurb",
    category: "web",
    track: "apps",
    level: "beginner",
    minutes: 20,
    featured: false,
    palette: { from: "#EDE9FE", to: "#7C3AED", ink: "#4C1D95", accent: "#F5F3FF" },
  },
  {
    slug: "blog",
    kind: "web",
    templateId: "博客",
    intent: "build",
    nameKey: "samples.blog.name",
    blurbKey: "samples.blog.blurb",
    category: "web",
    track: "apps",
    level: "beginner",
    minutes: 20,
    featured: true,
    palette: { from: "#FCE7F3", to: "#DB2777", ink: "#831843", accent: "#FFF1F2" },
  },
  {
    slug: "news-miniprogram",
    kind: "miniprogram",
    templateId: "资讯小程序",
    intent: "build",
    nameKey: "samples.news.name",
    blurbKey: "samples.news.blurb",
    category: "miniprogram",
    track: "apps",
    level: "beginner",
    minutes: 10,
    featured: true,
    palette: { from: "#DCFCE7", to: "#16A34A", ink: "#14532D", accent: "#F0FDF4" },
  },
  {
    slug: "smart-window",
    kind: "iot",
    templateId: "智慧窗控",
    intent: "build",
    nameKey: "samples.window.name",
    blurbKey: "samples.window.blurb",
    category: "iot",
    track: "iot",
    level: "beginner",
    minutes: 10,
    featured: true,
    palette: { from: "#E0F2FE", to: "#0369A1", ink: "#0C4A6E", accent: "#F0F9FF" },
  },
  {
    slug: "air-beacon",
    kind: "iot",
    templateId: "HP-01 Air Beacon",
    intent: "ship",
    nameKey: "samples.air.name",
    blurbKey: "samples.air.blurb",
    category: "iot",
    track: "iot",
    level: "advanced",
    minutes: 20,
    featured: true,
    palette: { from: "#CCFBF1", to: "#0F766E", ink: "#134E4A", accent: "#F0FDFA" },
  },
  {
    slug: "desk-rover",
    kind: "iot",
    templateId: "HP-02 Desk Rover",
    intent: "ship",
    nameKey: "samples.rover.name",
    blurbKey: "samples.rover.blurb",
    category: "iot",
    track: "iot",
    level: "advanced",
    minutes: 20,
    featured: false,
    palette: { from: "#FFEDD5", to: "#EA580C", ink: "#7C2D12", accent: "#FFF7ED" },
  },
  {
    slug: "room-node",
    kind: "iot",
    templateId: "HP-03 Room Node",
    intent: "ship",
    nameKey: "samples.room.name",
    blurbKey: "samples.room.blurb",
    category: "iot",
    track: "iot",
    level: "beginner",
    minutes: 10,
    featured: false,
    palette: { from: "#E0F2FE", to: "#0284C7", ink: "#0C4A6E", accent: "#F0F9FF" },
  },
  {
    slug: "living-room",
    kind: "smarthome",
    templateId: "灯光场景",
    intent: "build",
    nameKey: "samples.living.name",
    blurbKey: "samples.living.blurb",
    category: "smarthome",
    track: "iot",
    level: "beginner",
    minutes: 10,
    featured: true,
    palette: { from: "#EEF2FF", to: "#4F46E5", ink: "#312E81", accent: "#F5F3FF" },
  },
  {
    slug: "movie-night",
    kind: "smarthome",
    templateId: "观影模式",
    intent: "build",
    nameKey: "samples.movie.name",
    blurbKey: "samples.movie.blurb",
    category: "smarthome",
    track: "iot",
    level: "beginner",
    minutes: 10,
    featured: true,
    palette: { from: "#F5F3FF", to: "#6D28D9", ink: "#4C1D95", accent: "#EDE9FE" },
  },
  {
    slug: "motion-light",
    kind: "smarthome",
    templateId: "人体感应",
    intent: "build",
    nameKey: "samples.motion.name",
    blurbKey: "samples.motion.blurb",
    category: "smarthome",
    track: "iot",
    level: "beginner",
    minutes: 15,
    featured: true,
    palette: { from: "#ECFEFF", to: "#0E7490", ink: "#155E75", accent: "#CFFAFE" },
  },
  {
    slug: "good-night",
    kind: "smarthome",
    templateId: "晚安模式",
    intent: "build",
    nameKey: "samples.sleep.name",
    blurbKey: "samples.sleep.blurb",
    category: "smarthome",
    track: "iot",
    level: "beginner",
    minutes: 10,
    featured: false,
    palette: { from: "#E0E7FF", to: "#1E1B4B", ink: "#312E81", accent: "#EEF2FF" },
  },
  {
    slug: "desk-pet",
    kind: "toy",
    templateId: "互动玩具",
    intent: "build",
    nameKey: "samples.pet.name",
    blurbKey: "samples.pet.blurb",
    category: "iot",
    track: "iot",
    level: "beginner",
    minutes: 10,
    featured: false,
    palette: { from: "#FFE4E6", to: "#E11D48", ink: "#881337", accent: "#FFF1F2" },
  },
  {
    slug: "irrigation",
    kind: "iot",
    templateId: "智慧灌溉",
    intent: "build",
    nameKey: "samples.irrigation.name",
    blurbKey: "samples.irrigation.blurb",
    category: "iot",
    track: "iot",
    level: "beginner",
    minutes: 20,
    featured: false,
    palette: { from: "#DCFCE7", to: "#15803D", ink: "#14532D", accent: "#F0FDF4" },
  },
  {
    slug: "pond",
    kind: "iot",
    templateId: "鱼塘增氧",
    intent: "build",
    nameKey: "samples.pond.name",
    blurbKey: "samples.pond.blurb",
    category: "iot",
    track: "iot",
    level: "beginner",
    minutes: 20,
    featured: false,
    palette: { from: "#CFFAFE", to: "#0891B2", ink: "#164E63", accent: "#ECFEFF" },
  },
  {
    slug: "climate",
    kind: "smarthome",
    templateId: "温控联动",
    intent: "build",
    nameKey: "samples.climate.name",
    blurbKey: "samples.climate.blurb",
    category: "smarthome",
    track: "iot",
    level: "beginner",
    minutes: 10,
    featured: false,
    palette: { from: "#CCFBF1", to: "#0D9488", ink: "#134E4A", accent: "#F0FDFA" },
  },
  {
    slug: "security",
    kind: "smarthome",
    templateId: "安防演示",
    intent: "build",
    nameKey: "samples.security.name",
    blurbKey: "samples.security.blurb",
    category: "smarthome",
    track: "iot",
    level: "beginner",
    minutes: 10,
    featured: false,
    palette: { from: "#FFEDD5", to: "#B45309", ink: "#7C2D12", accent: "#FFF7ED" },
  },
  {
    slug: "event-signup",
    kind: "miniprogram",
    templateId: "活动报名",
    intent: "build",
    nameKey: "samples.event.name",
    blurbKey: "samples.event.blurb",
    category: "miniprogram",
    track: "apps",
    level: "beginner",
    minutes: 10,
    featured: false,
    palette: { from: "#ECFCCB", to: "#65A30D", ink: "#365314", accent: "#F7FEE7" },
  },
  {
    slug: "shop-mini",
    kind: "miniprogram",
    templateId: "商城小程序",
    intent: "build",
    nameKey: "samples.shop.name",
    blurbKey: "samples.shop.blurb",
    category: "miniprogram",
    track: "apps",
    level: "beginner",
    minutes: 20,
    featured: false,
    palette: { from: "#FAE8FF", to: "#C026D3", ink: "#701A75", accent: "#FDF4FF" },
  },
  {
    slug: "sensor-buddy",
    kind: "toy",
    templateId: "传感器演示",
    intent: "build",
    nameKey: "samples.sensor.name",
    blurbKey: "samples.sensor.blurb",
    category: "iot",
    track: "iot",
    level: "beginner",
    minutes: 10,
    featured: false,
    palette: { from: "#FFE4E6", to: "#BE123C", ink: "#881337", accent: "#FFF1F2" },
  },
  {
    slug: "hello-world",
    kind: "exercise",
    templateId: "Hello World",
    intent: "learn",
    nameKey: "samples.hello.name",
    blurbKey: "samples.hello.blurb",
    category: "basics",
    track: "basics",
    level: "beginner",
    minutes: 5,
    featured: false,
    palette: { from: "#FEF9C3", to: "#CA8A04", ink: "#713F12", accent: "#FEFCE8" },
  },
  {
    slug: "sort-numbers",
    kind: "exercise",
    templateId: "排序算法",
    intent: "learn",
    nameKey: "samples.sort.name",
    blurbKey: "samples.sort.blurb",
    category: "basics",
    track: "basics",
    level: "beginner",
    minutes: 10,
    featured: false,
    palette: { from: "#E0E7FF", to: "#4338CA", ink: "#312E81", accent: "#EEF2FF" },
  },
  {
    slug: "pair-exercise",
    kind: "free",
    intent: "learn",
    nameKey: "samples.pair.name",
    blurbKey: "samples.pair.blurb",
    category: "basics",
    track: "basics",
    level: "beginner",
    minutes: 5,
    featured: true,
    palette: { from: "#FEF3C7", to: "#D97706", ink: "#78350F", accent: "#FFFBEB" },
  },
];

export function findOfficialSample(slug: string): OfficialSample | null {
  return OFFICIAL_SAMPLES.find((sample) => sample.slug === slug) ?? null;
}

export function officialSamplesByTrack(track: SampleTrack): readonly OfficialSample[] {
  return OFFICIAL_SAMPLES.filter((sample) => sample.track === track);
}

export function featuredOfficialSamples(): readonly OfficialSample[] {
  return OFFICIAL_SAMPLES.filter((sample) => sample.featured);
}

export function filterOfficialSamples(category: string | null): readonly OfficialSample[] {
  if (!category || category === "all") return OFFICIAL_SAMPLES;
  if (category === "apps") {
    return OFFICIAL_SAMPLES.filter(
      (sample) => sample.category === "web" || sample.category === "miniprogram",
    );
  }
  if (category === "devices") {
    return OFFICIAL_SAMPLES.filter(
      (sample) => sample.category === "smarthome" || sample.category === "iot",
    );
  }
  return OFFICIAL_SAMPLES.filter((sample) => sample.category === category);
}

export function sampleChipSelected(chip: "all" | SampleChipId, category: string | null): boolean {
  if (chip === "all") return category == null;
  if (category == null) return false;
  if (category === "apps") return chip === "web" || chip === "miniprogram";
  if (category === "devices") return chip === "smarthome" || chip === "iot";
  return chip === category;
}
