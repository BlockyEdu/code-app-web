import { describe, expect, it } from "@rstest/core";
import { filesToTree } from "./file-tree";

describe("filesToTree", () => {
  it("returns an empty list for no paths", () => {
    expect(filesToTree([])).toEqual([]);
  });

  it("nests folders and sorts folders before files", () => {
    expect(filesToTree(["z.ts", "src/index.ts", "src/lib/util.ts", "a.ts"])).toEqual([
      {
        name: "src",
        path: "src",
        children: [
          {
            name: "lib",
            path: "src/lib",
            children: [{ name: "util.ts", path: "src/lib/util.ts" }],
          },
          { name: "index.ts", path: "src/index.ts" },
        ],
      },
      { name: "a.ts", path: "a.ts" },
      { name: "z.ts", path: "z.ts" },
    ]);
  });

  it("ignores empty path segments", () => {
    expect(filesToTree(["/notes.md", "notes.md"])).toEqual([
      { name: "notes.md", path: "notes.md" },
    ]);
  });
});
