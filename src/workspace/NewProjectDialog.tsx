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
import type { ArtifactKind } from "../types/artifact";
import { ARTIFACT_KIND_ORDER, KIND_COLOR, KIND_LABEL } from "../types/artifact";
import styles from "./NewProjectDialog.module.scss";

const KIND_META: Record<ArtifactKind, { icon: ReactNode; desc: string; templates: string[] }> = {
  web: {
    icon: <GlobalOutlined />,
    desc: "落地页 / 作品集 / 博客 / 管理后台",
    templates: ["落地页", "作品集", "博客", "管理后台"],
  },
  miniprogram: {
    icon: <MobileOutlined />,
    desc: "原生小程序工程结构",
    templates: ["资讯小程序", "活动报名", "商城小程序"],
  },
  smarthome: {
    icon: <HomeOutlined />,
    desc: "房间 / 设备 / 场景联动 + 设备面板仿真",
    templates: ["灯光场景", "温控联动", "安防演示"],
  },
  iot: {
    icon: <ApiOutlined />,
    desc: "ESP32-S3 / STM32 golden paths · firmware + catalog",
    templates: ["HP-01 Air Beacon", "HP-02 Desk Rover", "HP-03 Room Node"],
  },
  toy: {
    icon: <RobotOutlined />,
    desc: "硬件积木 + 数字孪生仿真",
    templates: ["互动玩具", "传感器演示"],
  },
  free: {
    icon: <ExperimentOutlined />,
    desc: "Pair programming · Monaco first",
    templates: ["空白项目", "脚本草稿"],
  },
  exercise: {
    icon: <CodeOutlined />,
    desc: "积木 / 代码 / AI 辅导，适合课程",
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
    const name = projectName.trim() || `我的${KIND_LABEL[selectedKind]}`;
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
          <span>新建项目</span>
          {step === "template" && (
            <button type="button" className={styles.backBtn} onClick={() => setStep("kind")}>
              ← 返回
            </button>
          )}
        </div>
      }
    >
      {step === "kind" && (
        <div className={styles.dialog}>
          <p className={styles.dialogSub}>选择创作模式 / 作品类型</p>
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
                  <div className={styles.kindCardLabel}>{KIND_LABEL[kind]}</div>
                  <div className={styles.kindCardDesc}>{opt.desc}</div>
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
              {kindMeta.icon} <span>{KIND_LABEL[selectedKind]}</span>
            </div>
            <span className={styles.templateStepSub}>选择起始模板与语言</span>
          </div>

          <div className={styles.templateGrid}>
            {kindMeta.templates.map((t) => (
              <button
                key={t}
                type="button"
                className={`${styles.templateCard} ${selectedTemplate === t ? styles.templateCardSelected : ""}`}
                style={{ "--kind-color": KIND_COLOR[selectedKind] } as CSSProperties}
                onClick={() => setSelectedTemplate(t)}
              >
                <AppstoreOutlined className={styles.templateCardIcon} />
                <span className={styles.templateCardLabel}>{t}</span>
                {selectedTemplate === t && (
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
                编程语言
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
              项目名称
            </label>
            <input
              id="artifact-name"
              type="text"
              className={styles.nameInput}
              placeholder={`我的${KIND_LABEL[selectedKind]}`}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>

          <div className={styles.modalActions}>
            <Button onClick={handleCancel} size="large" className={styles.cancelBtn}>
              取消
            </Button>
            <Button
              type="primary"
              size="large"
              className={styles.confirmBtn}
              disabled={!selectedTemplate}
              onClick={handleCreate}
            >
              创建项目 <ArrowRightOutlined />
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
