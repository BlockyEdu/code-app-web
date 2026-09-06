import { expect, test } from "@rstest/core";
import { encodeProviderModel, parseProviderModel } from "./ai-settings";

test("round-trips provider and model", () => {
  const encoded = encodeProviderModel("gemini", "gemini-2.0-flash-lite");
  expect(parseProviderModel(encoded)).toEqual({
    provider: "gemini",
    model: "gemini-2.0-flash-lite",
  });
});

test("rejects malformed values", () => {
  expect(parseProviderModel("gemini")).toBeNull();
  expect(parseProviderModel("::flash")).toBeNull();
});
