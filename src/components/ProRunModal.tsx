import { t } from "../lib/i18n";
import { useMembershipStore } from "../lib/membership-store";
import { planLabel } from "../lib/membership-types";

interface ProRunModalProps {
  onClose: () => void;
}

export function ProRunModal({ onClose }: ProRunModalProps) {
  const plan = useMembershipStore((s) => s.effectivePlan)();
  const trialActive = useMembershipStore((s) => s.trialActive)();
  const trialEndsAt = useMembershipStore((s) => s.trialEndsAt)();

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card modal-card--pro">
        <h3>{t("membership.checkoutTitle")}</h3>
        <p>
          {planLabel(plan)}
          {trialActive && trialEndsAt ? `（${t("membership.trialTag")} ${trialEndsAt}）` : ""}
        </p>
        {trialActive ? <p>{t("membership.exportWarning")}</p> : null}
        <p>{t("membership.compareLead")}</p>
        <div className="modal-actions">
          <a className="btn-primary" href="/membership">
            {t("membership.upgrade")}
          </a>
          <button type="button" className="btn-ghost" onClick={onClose}>
            {t("membership.later")}
          </button>
        </div>
      </div>
    </div>
  );
}
