import { describe, expect, it } from "@rstest/core";
import { previewEmbedChromeLabel, resolvePreviewEmbedSrc } from "./web-preview";

describe("preview embed URL helpers", () => {
  it("passes through absolute and relative embed URLs", () => {
    expect(
      resolvePreviewEmbedSrc("https://preview.example.com/api/v1/preview/sessions/x/embed?token=t"),
    ).toBe("https://preview.example.com/api/v1/preview/sessions/x/embed?token=t");
    expect(resolvePreviewEmbedSrc("/api/v1/preview/sessions/x/embed?token=t")).toBe(
      "/api/v1/preview/sessions/x/embed?token=t",
    );
    expect(resolvePreviewEmbedSrc("  ")).toBeUndefined();
    expect(resolvePreviewEmbedSrc(null)).toBeUndefined();
  });

  it("labels absolute preview host origin in the chrome bar", () => {
    expect(
      previewEmbedChromeLabel(
        "https://preview.example.com/api/v1/preview/sessions/x/embed?token=t",
      ),
    ).toBe("https://preview.example.com · sandbox");
    expect(previewEmbedChromeLabel("/api/v1/preview/sessions/x/embed?token=t")).toBe(
      "sandbox://preview (opaque origin)",
    );
  });
});
