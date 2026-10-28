import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import { useEffect, useRef, useState } from "react";
import { buildToolbox, ensureTargetGenerators, registerTargetBlocks } from "../lib/blockly-config";
import {
  applyStudioBuiltinStyles,
  applyStudioFlyoutGap,
  BLOCKYEDU_BLOCKLY_THEME,
  installStudioToolbox,
} from "../lib/blockly-theme";
import { t } from "../lib/i18n";
import { useLocaleStore } from "../lib/locale-store";
import { useWorkspaceStore } from "../stores/workspace";
import "blockly/blocks";
import "blockly/javascript";
import "../styles/blockly.scss";
import styles from "./BlocklyEditor.module.scss";

function serializeWorkspaceXml(workspace: Blockly.WorkspaceSvg): string {
  return Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));
}

function shouldIgnoreBlocklyEvent(event: Blockly.Events.Abstract): boolean {
  if (event.isUiEvent) return true;
  return event.type === Blockly.Events.FINISHED_LOADING;
}

function workspaceIsEmpty(workspace: Blockly.WorkspaceSvg): boolean {
  return workspace.getTopBlocks(false).length === 0;
}

export function BlocklyEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const applyingRef = useRef(false);
  const lastWrittenXmlRef = useRef("");
  const [canvasEmpty, setCanvasEmpty] = useState(false);
  const locale = useLocaleStore((s) => s.locale);
  const startComment = t("blockly.startComment");
  const artifactKind = useWorkspaceStore((s) => s.artifactKind);
  const iotPackSlug = useWorkspaceStore((s) => s.iotPackSlug);
  const blockXml = useWorkspaceStore((s) => s.blockXml);
  const setBlockXml = useWorkspaceStore((s) => s.setBlockXml);
  const setCode = useWorkspaceStore((s) => s.setCode);
  const blockXmlRef = useRef(blockXml);
  blockXmlRef.current = blockXml;

  // Remount when kind or locale changes so toolbox and canvas blocks pick up t().
  useEffect(() => {
    if (!containerRef.current) return;
    void iotPackSlug;
    void locale;

    registerTargetBlocks();
    ensureTargetGenerators();
    installStudioToolbox();
    applyStudioBuiltinStyles();

    const workspace = Blockly.inject(containerRef.current, {
      toolbox: buildToolbox(artifactKind),
      renderer: "zelos",
      theme: BLOCKYEDU_BLOCKLY_THEME,
      grid: {
        spacing: 24,
        length: 1,
        colour: "#1f2633",
        snap: true,
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 0.95,
        maxScale: 2.5,
        minScale: 0.35,
        scaleSpeed: 1.1,
      },
      trashcan: true,
      move: {
        scrollbars: true,
        drag: true,
        wheel: true,
      },
      // Served from /blockly/media (copied from node_modules in rsbuild).
      media: "/blockly/media/",
    });

    workspaceRef.current = workspace;
    applyStudioFlyoutGap(workspace);

    const persistFromWorkspace = () => {
      if (applyingRef.current) return;
      const xml = serializeWorkspaceXml(workspace);
      lastWrittenXmlRef.current = xml;
      if (xml !== blockXmlRef.current) {
        setBlockXml(xml);
      }
      const generated = javascriptGenerator.workspaceToCode(workspace);
      const nextCode = generated || t("blockly.startComment");
      if (nextCode !== useWorkspaceStore.getState().code) {
        setCode(nextCode);
      }
      setCanvasEmpty(workspaceIsEmpty(workspace));
    };

    const onChange = (event: Blockly.Events.Abstract) => {
      if (shouldIgnoreBlocklyEvent(event)) return;
      persistFromWorkspace();
    };

    workspace.addChangeListener(onChange);

    const initialXml = blockXmlRef.current;
    if (initialXml) {
      applyingRef.current = true;
      Blockly.Events.disable();
      try {
        Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(initialXml), workspace);
        lastWrittenXmlRef.current = serializeWorkspaceXml(workspace);
      } catch {
        /* ignore bad XML */
      } finally {
        Blockly.Events.enable();
        applyingRef.current = false;
      }
      persistFromWorkspace();
    } else {
      // Sample boot may still be seeding. Persisting now would save an empty lesson.
      setCanvasEmpty(true);
    }

    return () => {
      workspace.dispose();
      workspaceRef.current = null;
    };
  }, [artifactKind, iotPackSlug, setBlockXml, setCode, locale]);

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace || !blockXml) return;
    if (blockXml === lastWrittenXmlRef.current) return;

    applyingRef.current = true;
    Blockly.Events.disable();
    try {
      workspace.clear();
      Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(blockXml), workspace);
      lastWrittenXmlRef.current = serializeWorkspaceXml(workspace);
    } catch {
      /* ignore */
    } finally {
      Blockly.Events.enable();
      applyingRef.current = false;
    }
    setCanvasEmpty(workspaceIsEmpty(workspace));
  }, [blockXml]);

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    const generated = javascriptGenerator.workspaceToCode(workspace);
    if (generated) return;
    if (startComment !== useWorkspaceStore.getState().code) {
      setCode(startComment);
    }
  }, [startComment, setCode]);

  return (
    <div className={`blockly-container blockly-studio ${styles.root}`}>
      <div ref={containerRef} className={styles.canvas} />
      {canvasEmpty ? (
        <p className={styles.hint}>
          <span>{t("blocks.emptyHint")}</span>
        </p>
      ) : null}
    </div>
  );
}
