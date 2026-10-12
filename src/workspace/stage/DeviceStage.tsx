import { ReloadOutlined } from "@ant-design/icons";
import { type ReactNode, useMemo, useState } from "react";
import { readHardwareFile } from "../../lib/hardware-catalog-static";
import { t } from "../../lib/i18n";
import { useLocaleStore } from "../../lib/locale-store";
import { useWorkspaceStore } from "../../stores/workspace";
import { CircuitLayer } from "./CircuitLayer";
import { EventTimeline } from "./EventTimeline";
import { defaultModuleSkus, mapStage } from "./map-scene";
import { ReadoutStrip } from "./ReadoutStrip";
import { SceneView, sceneTitleKey } from "./SceneView";
import styles from "./stage.module.scss";

type StageKind = "iot" | "smarthome" | "toy";

export function DeviceStage({ kind, children }: { kind: StageKind; children?: ReactNode }) {
  useLocaleStore((s) => s.locale);
  const world = useWorkspaceStore((s) => s.previewWorld);
  const boardSku = useWorkspaceStore((s) => s.boardSku);
  const packSlug = useWorkspaceStore((s) => s.iotPackSlug);
  const templateId = useWorkspaceStore((s) => s.templateId);
  const files = useWorkspaceStore((s) => s.artifactFiles);
  const firmware = useWorkspaceStore((s) => s.firmwareSim);
  const [layer, setLayer] = useState<"circuit" | "scene">("scene");
  const [epoch, setEpoch] = useState(0);

  const hardware = useMemo(() => readHardwareFile(files), [files]);
  const model = useMemo(
    () =>
      mapStage({
        kind,
        world,
        packSlug: packSlug || hardware.packSlug,
        templateId,
        boardSku: boardSku || hardware.boardSku,
        firmware,
      }),
    [kind, world, packSlug, hardware.packSlug, hardware.boardSku, templateId, boardSku, firmware],
  );
  const modules =
    hardware.moduleSkus.length > 0 ? hardware.moduleSkus : defaultModuleSkus(model.sceneId);
  const title = t(sceneTitleKey(model.sceneId));

  return (
    <div className={styles.shell}>
      <div className={styles.viewport}>
        <div className={styles.caption}>{title}</div>
        <div className={styles.toolbar}>
          <fieldset className={styles.segment}>
            <button
              type="button"
              className={layer === "circuit" ? styles.segmentOn : undefined}
              onClick={() => setLayer("circuit")}
            >
              {t("stage.circuit")}
            </button>
            <button
              type="button"
              className={layer === "scene" ? styles.segmentOn : undefined}
              onClick={() => setLayer("scene")}
            >
              {t("stage.scene")}
            </button>
          </fieldset>
          <button
            type="button"
            className={styles.resetBtn}
            aria-label={t("stage.reset")}
            title={t("stage.reset")}
            onClick={() => {
              setLayer("scene");
              setEpoch((value) => value + 1);
            }}
          >
            <ReloadOutlined />
          </button>
        </div>
        <div key={epoch} className={styles.layer}>
          {layer === "circuit" ? (
            <CircuitLayer boardSku={boardSku || hardware.boardSku} moduleSkus={modules} />
          ) : (
            <SceneView model={model} label={title} />
          )}
        </div>
      </div>
      <div className={styles.lower}>
        <ReadoutStrip items={model.readouts} />
        {children}
        <EventTimeline events={model.events} assertions={model.assertions} />
      </div>
    </div>
  );
}
