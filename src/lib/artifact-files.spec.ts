import { describe, expect, it } from "@rstest/core";
import {
  assetPathForUpload,
  buildBinaryRefEntry,
  contentTypeForPath,
  isBinaryRefFile,
  mergeTextMapWithBinaryRefs,
} from "./artifact-files";

describe("contentTypeForPath", () => {
  it("returns json for .json paths (case-insensitive)", () => {
    expect(contentTypeForPath("app.schema.json")).toBe("json");
    expect(contentTypeForPath("hardware.json")).toBe("json");
    expect(contentTypeForPath("DATA.JSON")).toBe("json");
  });

  it("returns text for non-json paths", () => {
    expect(contentTypeForPath("app.js")).toBe("text");
    expect(contentTypeForPath("blocks/web.blocks.xml")).toBe("text");
    expect(contentTypeForPath("notes.md")).toBe("text");
    expect(contentTypeForPath("app.json.bak")).toBe("text");
  });
});

describe("binary asset helpers", () => {
  it("builds assets/ paths and binary_ref entries", () => {
    expect(assetPathForUpload("Hero Photo.PNG")).toBe("assets/Hero_Photo.PNG");
    const entry = buildBinaryRefEntry({
      path: "assets/a.png",
      storageRef: "obj/key",
      mimeType: "image/png",
      sizeBytes: 8,
    });
    expect(isBinaryRefFile(entry)).toBe(true);
    expect(entry.contentType).toBe("binary_ref");
  });

  it("preserves binary_ref when merging text maps", () => {
    const files = [
      { path: "main.js", contentType: "text", content: "a" },
      buildBinaryRefEntry({ path: "assets/a.png", storageRef: "k" }),
    ];
    const merged = mergeTextMapWithBinaryRefs(files, { "main.js": "b", "notes.md": "n" });
    expect(merged.find((f) => f.path === "assets/a.png")?.storageRef).toBe("k");
    expect(merged.find((f) => f.path === "main.js")?.content).toBe("b");
    expect(merged.find((f) => f.path === "notes.md")?.content).toBe("n");
  });
});
