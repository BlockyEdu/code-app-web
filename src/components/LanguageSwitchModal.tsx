import type { ReactNode } from "react";
import { t } from "../lib/i18n";
import { useLocaleStore } from "../lib/locale-store";

interface Props {
  title: string;
  tone?: "info" | "warn";
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  disabled?: boolean;
  children: ReactNode;
}

export function LanguageSwitchModal({
  title,
  tone = "warn",
  confirmLabel,
  onConfirm,
  onCancel,
  disabled,
  children,
}: Props) {
  useLocaleStore((s) => s.locale);
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className={`modal-card modal-card--${tone}`}>
        <h2>{title}</h2>
        <div className="modal-body">{children}</div>
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onCancel}>
            {t("confirm.cancel")}
          </button>
          <button
            type="button"
            className={tone === "warn" ? "btn-warn" : "btn-primary-inline"}
            onClick={onConfirm}
            disabled={disabled}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
