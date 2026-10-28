import { ReloadOutlined } from "@ant-design/icons";
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
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

export const StageChromeContext = createContext<Dispatch<SetStateAction<ReactNode>> | null>(null);

function zoomStep(current: number, delta: number): number {
  return Math.min(1.8, Math.max(1, Number((current + delta).toFixed(1))));
}

export function DeviceStage({ kind, children }: { kind: StageKind; children?: ReactNode }) {
  const world = useWorkspaceStore((s) => s.previewWorld);
  const boardSku = useWorkspaceStore((s) => s.boardSku);
  const packSlug = useWorkspaceStore((s) => s.iotPackSlug);
  const templateId = useWorkspaceStore((s) => s.templateId);
  const files = useWorkspaceStore((s) => s.artifactFiles);
  const firmware = useWorkspaceStore((s) => s.firmwareSim);
  const [layer, setLayer] = useState<"circuit" | "scene">("scene");
  const [epoch, setEpoch] = useState(0);
  const [zoom, setZoom] = useState(1);
  const setStageChrome = useContext(StageChromeContext);
  useLocaleStore((s) => s.locale);
  const circuitLabel = t("stage.circuit");
  const sceneLabel = t("stage.scene");
  const zoomInLabel = t("stage.zoomIn");
  const zoomOutLabel = t("stage.zoomOut");
  const resetLabel = t("stage.reset");

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

  const planePreview = kind === "smarthome" && layer === "scene";
  const hosted = kind === "smarthome" && setStageChrome != null;

  const resetStage = useCallback(() => {
    setLayer("scene");
    setEpoch((value) => value + 1);
    if (kind === "smarthome") {
      setZoom(1);
      useWorkspaceStore.getState().setPreviewWorld(null);
    }
  }, [kind]);

  const toolbar = useMemo(
    () => (
      <div className={hosted ? styles.toolbarHost : styles.toolbar}>
        <fieldset className={styles.segment}>
          <button
            type="button"
            className={layer === "circuit" ? styles.segmentOn : undefined}
            onClick={() => setLayer("circuit")}
          >
            {circuitLabel}
          </button>
          <button
            type="button"
            className={layer === "scene" ? styles.segmentOn : undefined}
            onClick={() => setLayer("scene")}
          >
            {sceneLabel}
          </button>
        </fieldset>
        {hosted && layer === "scene" ? (
          <>
            <button
              type="button"
              className={styles.resetBtn}
              aria-label={zoomInLabel}
              title={zoomInLabel}
              disabled={zoom >= 1.8}
              onClick={() => setZoom((value) => zoomStep(value, 0.2))}
            >
              +
            </button>
            <button
              type="button"
              className={styles.resetBtn}
              aria-label={zoomOutLabel}
              title={zoomOutLabel}
              disabled={zoom <= 1}
              onClick={() => setZoom((value) => zoomStep(value, -0.2))}
            >
              −
            </button>
          </>
        ) : null}
        <button
          type="button"
          className={styles.resetBtn}
          aria-label={resetLabel}
          title={resetLabel}
          onClick={resetStage}
        >
          <ReloadOutlined />
        </button>
      </div>
    ),
    [
      circuitLabel,
      hosted,
      layer,
      resetLabel,
      resetStage,
      sceneLabel,
      zoom,
      zoomInLabel,
      zoomOutLabel,
    ],
  );

  useLayoutEffect(() => {
    if (!hosted || !setStageChrome) return;
    setStageChrome(toolbar);
  }, [hosted, setStageChrome, toolbar]);

  useLayoutEffect(() => {
    if (!setStageChrome) return;
    return () => setStageChrome(null);
  }, [setStageChrome]);

  return (
    <div className={`${styles.shell}${planePreview ? ` ${styles.shellPlane}` : ""}`}>
      <div className={`${styles.viewport} ${planePreview ? styles.viewportPlane : ""}`}>
        {planePreview ? null : <div className={styles.caption}>{title}</div>}
        {hosted ? null : toolbar}
        <div key={epoch} className={styles.layer}>
          {layer === "circuit" ? (
            <CircuitLayer boardSku={boardSku || hardware.boardSku} moduleSkus={modules} />
          ) : (
            <SceneView model={model} label={title} zoom={kind === "smarthome" ? zoom : undefined} />
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
