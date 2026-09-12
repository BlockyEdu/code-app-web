import { describe, expect, it } from "@rstest/core";
import { contentTypeForPath } from "./artifact-files";

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
