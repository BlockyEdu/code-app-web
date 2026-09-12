import { describe, expect, it } from "@rstest/core";
import {
  isFreeLabel,
  nextCheckoutAction,
  sellableOfferings,
  stripClientPriceFields,
} from "./commerce";
import { EN_COMMON, flattenLocaleKeys, ZH_COMMON } from "./i18n";

describe("isFreeLabel", () => {
  it("treats Chinese and English unsubscribed labels as free-ish", () => {
    expect(isFreeLabel("免费用户")).toBe(true);
    expect(isFreeLabel("免费版")).toBe(true);
    expect(isFreeLabel("Not subscribed")).toBe(true);
    expect(isFreeLabel("free user")).toBe(true);
    expect(isFreeLabel("free")).toBe(true);
    expect(isFreeLabel("专业版 Pro")).toBe(false);
    expect(isFreeLabel("Pro")).toBe(false);
  });
});

describe("locale parity", () => {
  it("keeps en/zh keys aligned without Free commercial labels", () => {
    expect(flattenLocaleKeys(EN_COMMON).sort()).toEqual(flattenLocaleKeys(ZH_COMMON).sort());
    const values = [
      ...Object.entries(EN_COMMON.membership),
      ...Object.entries(ZH_COMMON.membership),
    ]
      .filter(([key]) => key !== "planNone")
      .map(([, value]) => String(value));
    expect(values.some((value) => isFreeLabel(value))).toBe(false);
  });

  it("does not ship i18n defaultValue in locale dictionaries", () => {
    expect(JSON.stringify(EN_COMMON)).not.toContain("defaultValue");
    expect(JSON.stringify(ZH_COMMON)).not.toContain("defaultValue");
  });
});

describe("checkout actions", () => {
  it("strips prices and maps qr/redirect/manual/complete", () => {
    expect(stripClientPriceFields({ offeringId: "a", amountCents: 9, currency: "CNY" })).toEqual({
      offeringId: "a",
    });
    expect(nextCheckoutAction({ qrCode: "qr" }, "o1").kind).toBe("qr");
    expect(nextCheckoutAction({ redirectUrl: "https://x" }, "o1").kind).toBe("redirect");
    expect(nextCheckoutAction({ action: { type: "manual" } }, "o1").kind).toBe("manual");
    expect(nextCheckoutAction({}, "o1").kind).toBe("complete");
    expect(
      sellableOfferings(
        [
          { planCode: "free", interval: "month" },
          { planCode: "ultra", interval: "month" },
        ],
        "month",
      ),
    ).toHaveLength(1);
  });
});
