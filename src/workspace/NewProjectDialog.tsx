import {
  ApiOutlined,
  AppstoreOutlined,
  ArrowRightOutlined,
  CheckOutlined,
  CodeOutlined,
  ExperimentOutlined,
  GlobalOutlined,
  HomeOutlined,
  MobileOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import { Button, Modal, Select } from "antd";
import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import { t } from "../lib/i18n";
import { kindLabel, untitledArtifactName } from "../lib/kind-label";
import { useLocaleStore } from "../lib/locale-store";
import type { ArtifactKind } from "../types/artifact";
import { ARTIFACT_KIND_ORDER, KIND_COLOR } from "../types/artifact";
import styles from "./NewProjectDialog.module.scss";

const KIND_META: Record<ArtifactKind, { icon: ReactNode; templates: string[] }> = {
  web: {
    icon: <GlobalOutlined />,
    templates: ["落地页", "作品集", "博客", "管理后台"],
  },
  miniprogram: {
    icon: <MobileOutlined />,
    templates: ["资讯小程序", "活动报名", "商城小程序"],
  },
  smarthome: {
    icon: <HomeOutlined />,
    templates: ["灯光场景", "温控联动", "安防演示"],
  },
  iot: {
    icon: <ApiOutlined />,
    templates: [
      "智慧窗控",
      "智慧灌溉",
      "鱼塘增氧",
      "HP-01 Air Beacon",
      "HP-02 Desk Rover",
      "HP-03 Room Node",
    ],
  },
  toy: {
    icon: <RobotOutlined />,
    templates: ["互动玩具", "传感器演示"],
  },
  free: {
    icon: <ExperimentOutlined />,
    templates: ["空白项目", "脚本草稿"],
  },
  exercise: {
    icon: <CodeOutlined />,
    templates: ["空白练习", "Hello World", "排序算法"],
  },
};

const LANGUAGE_OPTIONS = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
];

export interface NewProjectDialogProps {
  open: boolean;
  onConfirm: (
    kind: ArtifactKind,
    name: string,
    language: string,
    extras: { templateId: string; intent?: string },
  ) => void;
  onCancel: () => void;
  /** Prefill when opened from AI or hub. */
  initialKind?: ArtifactKind | null;
  initialName?: string;
  initialLanguage?: string;
  initialIntent?: string;
}

export function NewProjectDialog({
  open,
  onConfirm,
  onCancel,
  initialKind = null,
  initialName = "",
  initialLanguage = "javascript",
  initialIntent,
}: NewProjectDialogProps) {
  useLocaleStore((s) => s.locale);
  const [step, setStep] = useState<"kind" | "template">("kind");
  const [selectedKind, setSelectedKind] = useState<ArtifactKind | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [language, setLanguage] = useState("javascript");

  useEffect(() => {
    if (!open) return;
    setLanguage(initialLanguage || "javascript");
    setProjectName(initialName || "");
    if (initialKind) {
      setSelectedKind(initialKind);
      setSelectedTemplate(KIND_META[initialKind].templates[0] ?? null);
      setStep("template");
    } else if (initialIntent === "learn") {
      setSelectedKind("free");
      setSelectedTemplate(KIND_META.free.templates[0] ?? null);
      setStep("template");
    } else if (initialIntent === "ship") {
      setSelectedKind("iot");
      setSelectedTemplate(KIND_META.iot.templates[0] ?? null);
      setStep("template");
    } else {
      setSelectedKind(null);
      setSelectedTemplate(null);
      setStep("kind");
    }
  }, [open, initialKind, initialName, initialLanguage, initialIntent]);

  const kindMeta = selectedKind ? KIND_META[selectedKind] : null;

  const reset = () => {
    setStep("kind");
    setSelectedKind(null);
    setSelectedTemplate(null);
    setProjectName("");
    setLanguage("javascript");
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  const handleSelectKind = (k: ArtifactKind) => {
    setSelectedKind(k);
    setSelectedTemplate(null);
    setStep("template");
  };

  const handleCreate = () => {
    if (!selectedKind || !selectedTemplate) return;
    const name = projectName.trim() || untitledArtifactName(selectedKind);
    onConfirm(selectedKind, name, language, {
      templateId: selectedTemplate,
      intent: initialIntent,
    });
    reset();
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={680}
      centered
      destroyOnHidden
      styles={{ mask: { background: "rgba(0,0,0,0.75)" } }}
      title={
        <div className={styles.dialogHeader}>
          <span>{t("project.title")}</span>
          {step === "template" && (
            <button type="button" className={styles.backBtn} onClick={() => setStep("kind")}>
              ← {t("project.back")}
            </button>
          )}
        </div>
      }
    >
      {step === "kind" && (
        <div className={styles.dialog}>
          <p className={styles.dialogSub}>{t("project.pickKind")}</p>
          <div className={styles.kindGrid}>
            {ARTIFACT_KIND_ORDER.map((kind) => {
              const opt = KIND_META[kind];
              const color = KIND_COLOR[kind];
              return (
                <button
                  key={kind}
                  type="button"
                  className={`${styles.kindCard} ${selectedKind === kind ? styles.kindCardSelected : ""}`}
                  style={{ "--kind-color": color } as CSSProperties}
                  onClick={() => handleSelectKind(kind)}
                >
                  <div className={styles.kindCardIcon}>{opt.icon}</div>
                  <div className={styles.kindCardLabel}>{kindLabel(kind)}</div>
                  <div className={styles.kindCardDesc}>{t(`project.desc.${kind}`)}</div>
                  {selectedKind === kind && (
                    <div className={styles.kindCardCheck}>
                      <CheckOutlined />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === "template" && kindMeta && selectedKind && (
        <div className={styles.dialog}>
          <div className={styles.templateStepHeader}>
            <div
              className={styles.kindChip}
              style={{
                color: KIND_COLOR[selectedKind],
                borderColor: `${KIND_COLOR[selectedKind]}40`,
                background: `${KIND_COLOR[selectedKind]}15`,
              }}
            >
              {kindMeta.icon} <span>{kindLabel(selectedKind)}</span>
            </div>
            <span className={styles.templateStepSub}>{t("project.pickTemplate")}</span>
          </div>

          <div className={styles.templateGrid}>
            {kindMeta.templates.map((tmpl) => (
              <button
                key={tmpl}
                type="button"
                className={`${styles.templateCard} ${selectedTemplate === tmpl ? styles.templateCardSelected : ""}`}
                style={{ "--kind-color": KIND_COLOR[selectedKind] } as CSSProperties}
                onClick={() => setSelectedTemplate(tmpl)}
              >
                <AppstoreOutlined className={styles.templateCardIcon} />
                <span className={styles.templateCardLabel}>{tmpl}</span>
                {selectedTemplate === tmpl && (
                  <span className={styles.templateCardCheck}>
                    <CheckOutlined />
                  </span>
                )}
              </button>
            ))}
          </div>

          {selectedKind !== "iot" && (
            <div className={styles.nameField}>
              <label className={styles.nameLabel} htmlFor="artifact-language">
                {t("project.language")}
              </label>
              <Select
                id="artifact-language"
                value={language}
                onChange={setLanguage}
                options={LANGUAGE_OPTIONS}
                style={{ width: "100%" }}
                size="large"
              />
            </div>
          )}

          <div className={styles.nameField}>
            <label className={styles.nameLabel} htmlFor="artifact-name">
              {t("project.name")}
            </label>
            <input
              id="artifact-name"
              type="text"
              className={styles.nameInput}
              placeholder={untitledArtifactName(selectedKind)}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>

          <div className={styles.modalActions}>
            <Button onClick={handleCancel} size="large" className={styles.cancelBtn}>
              {t("project.cancel")}
            </Button>
            <Button
              type="primary"
              size="large"
              className={styles.confirmBtn}
              disabled={!selectedTemplate}
              onClick={handleCreate}
            >
              {t("project.create")} <ArrowRightOutlined />
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
