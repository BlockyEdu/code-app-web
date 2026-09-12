import { useEffect, useRef, useState } from "react";
import { QRCode } from "antd";
import { api } from "../lib/api";
import {
  type CheckoutAction,
  type CommerceJson,
  nextCheckoutAction,
  offeringIdOf,
  sellableOfferings,
  stripClientPriceFields,
} from "../lib/commerce";
import { t } from "../lib/i18n";
import { useMembershipStore } from "../lib/membership-store";

function isPaidLikeOrderStatus(status: unknown): boolean {
  return status === "paid" || status === "fulfilled";
}

function itemsOf(payload: unknown): CommerceJson[] {
  if (Array.isArray(payload)) return payload as CommerceJson[];
  if (payload && typeof payload === "object") {
    const rec = payload as CommerceJson;
    if (Array.isArray(rec.items)) return rec.items as CommerceJson[];
    if (Array.isArray(rec.offerings)) return rec.offerings as CommerceJson[];
    if (Array.isArray(rec.methods)) return rec.methods as CommerceJson[];
  }
  return [];
}

export function MembershipPage() {
  const trialActive = useMembershipStore((s) => s.trialActive)();
  const trialEndsAt = useMembershipStore((s) => s.trialEndsAt)();
  const plan = useMembershipStore((s) => s.effectivePlan)();
  const [yearly, setYearly] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [offerings, setOfferings] = useState<CommerceJson[]>([]);
  const [methods, setMethods] = useState<CommerceJson[]>([]);
  const [offeringId, setOfferingId] = useState("");
  const [methodId, setMethodId] = useState("");
  const [action, setAction] = useState<CheckoutAction | null>(null);
  const [orderId, setOrderId] = useState("");
  const [status, setStatus] = useState("");
  const pollStopped = useRef(false);

  useEffect(() => {
    pollStopped.current = false;
  }, [orderId, action?.kind]);

  useEffect(() => {
    if (action?.kind !== "qr" || !orderId) return;
    let cancelled = false;
    const poll = async () => {
      if (pollStopped.current) return;
      try {
        const order = await api.commerceOrderStatus(orderId);
        if (cancelled || pollStopped.current || !isPaidLikeOrderStatus(order.status)) return;
        pollStopped.current = true;
        await api.commerceCompleteOrder(orderId, {});
        await useMembershipStore.getState().fetchMembership();
        setStatus(t("membership.complete"));
        setAction(null);
      } catch {
        /* ignore transient poll errors */
      }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [action?.kind, orderId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returned = params.get("orderId") ?? params.get("order_id");
    if (!returned) return;
    void api
      .commerceCompleteOrder(returned, {})
      .then(() => setStatus(t("membership.returnComplete")))
      .catch((err) => setStatus(err instanceof Error ? err.message : t("membership.busy")));
  }, []);

  useEffect(() => {
    void (async () => {
      const [catalog, methodRes] = await Promise.all([
        api.commerceCatalog().catch(() => ({ items: [] })),
        api.commerceMethods().catch(() => ({ items: [] })),
        api.commerceLegal().catch(() => ({})),
      ]);
      const interval = yearly ? "year" : "month";
      const next = sellableOfferings(itemsOf(catalog), interval);
      setOfferings(next);
      setOfferingId(next[0] ? offeringIdOf(next[0]) : "");
      const methodItems = itemsOf(methodRes);
      setMethods(methodItems);
      setMethodId(String(methodItems[0]?.id ?? methodItems[0]?.providerId ?? "mock"));
    })();
  }, [yearly]);

  const pay = async () => {
    if (!accepted) {
      setStatus(t("membership.legalRequired"));
      return;
    }
    if (!offeringId) {
      setStatus(t("membership.selectOffering"));
      return;
    }
    await api.commerceAcceptLegal({ policyVersion: "current", accepted: true });
    const order = await api.commerceCreateOrder(
      stripClientPriceFields({ offeringId, amountCents: 1, currency: "CNY", planCode: "pro" }),
    );
    const id = String(order.id ?? order.orderId ?? "");
    setOrderId(id);
    const paid = await api.commercePayOrder(
      id,
      stripClientPriceFields({ methodId, amountCents: 1 }),
    );
    const next = nextCheckoutAction(paid, id);
    setAction(next);
    if (next.kind === "redirect") {
      window.location.assign(next.url);
      return;
    }
    if (next.kind === "complete") {
      await api.commerceCompleteOrder(id, {});
      setStatus(t("membership.complete"));
    }
  };

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 24 }}>
      <h1>{t("membership.heroTitle")}</h1>
      <p>{t("membership.heroLead")}</p>
      <p>
        {t("membership.current")}: {plan}
        {trialActive && trialEndsAt ? ` · ${t("membership.trialTag")} ${trialEndsAt}` : ""}
      </p>
      {trialActive ? <p>{t("membership.exportWarning")}</p> : null}
      <label>
        <input type="checkbox" checked={yearly} onChange={(e) => setYearly(e.target.checked)} />
        {t("membership.yearly")}
      </label>
      <fieldset>
        <legend>{t("membership.legalTitle")}</legend>
        <label>
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          {t("membership.legalAccept")}
        </label>
      </fieldset>
      <fieldset>
        <legend>{t("membership.selectOffering")}</legend>
        {offerings.map((item) => (
          <label key={offeringIdOf(item)} style={{ display: "block" }}>
            <input
              type="radio"
              name="offering"
              checked={offeringId === offeringIdOf(item)}
              onChange={() => setOfferingId(offeringIdOf(item))}
            />
            {String(item.sku ?? offeringIdOf(item))}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>{t("membership.methods")}</legend>
        {methods.map((item) => (
          <label key={String(item.id ?? item.providerId)} style={{ display: "block" }}>
            <input
              type="radio"
              name="method"
              checked={methodId === String(item.id ?? item.providerId)}
              onChange={() => setMethodId(String(item.id ?? item.providerId))}
            />
            {String(item.name ?? item.providerId ?? item.id)}
          </label>
        ))}
      </fieldset>
      {action?.kind === "qr" ? (
        <div style={{ marginTop: 16 }}>
          <p>{t("membership.qr")}</p>
          <QRCode value={action.qrPayload} size={168} />
        </div>
      ) : null}
      {action?.kind === "manual" ? (
        <p>
          {t("membership.manual")} {action.instructions}
        </p>
      ) : null}
      <button type="button" onClick={() => void pay()}>
        {t("membership.pay")}
      </button>
      <button
        type="button"
        disabled={!orderId}
        onClick={() =>
          void api
            .commerceCompleteOrder(orderId, {})
            .then(() => setStatus(t("membership.complete")))
        }
      >
        {t("membership.complete")}
      </button>
      {status ? <p>{status}</p> : null}
    </main>
  );
}
