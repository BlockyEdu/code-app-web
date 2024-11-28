import { describe, expect, it } from "@rstest/core";
import type { CreateArtifact, Project } from "./api";
import { mergeWorkItems } from "./work-items";

describe("mergeWorkItems", () => {
  it("shows unbridged projects as exercise and hides linked ones", () => {
    const artifacts: CreateArtifact[] = [
      {
        id: "a1",
        title: "已桥接练习",
        kind: "exercise",
        summary: null,
        visibility: "private",
        lifecycleState: "draft",
        ownerId: "u1",
        tenantId: "default",
        currentVersionId: null,
        currentVersion: 1,
        workspaceProjectId: "p1",
        language: "javascript",
        createdAt: "2026-08-01T10:00:00.000Z",
        updatedAt: "2026-08-02T10:00:00.000Z",
      },
      {
        id: "a2",
        title: "Web 站",
        kind: "web",
        summary: null,
        visibility: "private",
        lifecycleState: "draft",
        ownerId: "u1",
        tenantId: "default",
        currentVersionId: null,
        currentVersion: 1,
        createdAt: "2026-08-01T09:00:00.000Z",
        updatedAt: "2026-08-03T10:00:00.000Z",
      },
    ];
    const projects: Project[] = [
      {
        id: "p1",
        name: "应被隐藏",
        code: "",
        blockXml: "",
        language: "javascript",
        createdAt: "2026-08-01T08:00:00.000Z",
        updatedAt: "2026-08-01T08:00:00.000Z",
      },
      {
        id: "p2",
        name: "旧练习",
        code: "console.log(1)",
        blockXml: "",
        language: "python",
        createdAt: "2026-08-01T07:00:00.000Z",
        updatedAt: "2026-08-04T10:00:00.000Z",
      },
    ];

    const items = mergeWorkItems(artifacts, projects);
    expect(items.map((i) => i.key)).toEqual([
      "project:p2",
      "artifact:a2",
      "artifact:a1",
    ]);
    expect(items.find((i) => i.key === "project:p2")?.kind).toBe("exercise");
    expect(items.find((i) => i.key === "project:p1")).toBeUndefined();
  });
});
