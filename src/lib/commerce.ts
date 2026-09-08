export type CommerceJson = Record<string, unknown>;

const PRICE_FIELDS = ["amountCents", "amountMinor", "currency", "planCode", "endsAt"] as const;

export function stripClientPriceFields(body: CommerceJson): CommerceJson {
  const next = { ...body };
  for (const field of PRICE_FIELDS) delete next[field];
  return next;
}

export function isFreeLabel(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "free" ||
    normalized === "free plan" ||
    value.includes("免费版") ||
    value.includes("免费用户")
  );
}

export type CheckoutAction =
  | { kind: "qr"; qrPayload: string }
  | { kind: "redirect"; url: string }
  | { kind: "manual"; instructions: string }
  | { kind: "complete"; orderId: string };

export function nextCheckoutAction(payResult: CommerceJson, orderId: string): CheckoutAction {
  const qr =
    (typeof payResult.qrPayload === "string" && payResult.qrPayload) ||
    (typeof payResult.qrCode === "string" && payResult.qrCode) ||
    "";
  if (qr) return { kind: "qr", qrPayload: qr };
  const url =
    (typeof payResult.checkoutUrl === "string" && payResult.checkoutUrl) ||
    (typeof payResult.redirectUrl === "string" && payResult.redirectUrl) ||
    "";
  if (url) return { kind: "redirect", url };
  const action = payResult.action;
  if (action && typeof action === "object") {
    const type = String((action as CommerceJson).type ?? "");
    if (type.includes("manual")) {
      return {
        kind: "manual",
        instructions: String((action as CommerceJson).instructions ?? type),
      };
    }
  }
  return { kind: "complete", orderId };
}

export function sellableOfferings(
  items: Array<CommerceJson>,
  interval: "month" | "year",
): Array<CommerceJson> {
  return items.filter((item) => {
    const plan = String(item.planCode ?? item.plan ?? "");
    const itemInterval = String(item.interval ?? item.billingInterval ?? "");
    if (plan === "free" || plan === "none") return false;
    if (plan !== "pro" && plan !== "ultra") return false;
    return itemInterval === interval;
  });
}

export function offeringIdOf(item: CommerceJson): string {
  return String(item.id ?? item.offeringId ?? item.sku ?? "");
}
