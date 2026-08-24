import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import { useEffect, useRef } from "react";
import { buildToolbox, ensureTargetGenerators } from "../lib/blockly-config";
import { BLOCKYEDU_BLOCKLY_THEME } from "../lib/blockly-theme";
import { useWorkspaceStore } from "../stores/workspace";
import "blockly/blocks";
import "blockly/javascript";

function serializeWorkspaceXml(workspace: Blockly.WorkspaceSvg): string {
  return Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));
}

function shouldIgnoreBlocklyEvent(event: Blockly.Events.Abstract): boolean {
  if (event.isUiEvent) return true;
  return event.type === Blockly.Events.FINISHED_LOADING;
}

export function BlocklyEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const applyingRef = useRef(false);
  const lastWrittenXmlRef = useRef("");
  const artifactKind = useWorkspaceStore((s) => s.artifactKind);
  const blockXml = useWorkspaceStore((s) => s.blockXml);
  const setBlockXml = useWorkspaceStore((s) => s.setBlockXml);
  const setCode = useWorkspaceStore((s) => s.setCode);
  const blockXmlRef = useRef(blockXml);
  blockXmlRef.current = blockXml;

  // Remount workspace when kind changes (toolbox + starter XML differ per kind).
  useEffect(() => {
    if (!containerRef.current) return;

    ensureTargetGenerators();

    const workspace = Blockly.inject(containerRef.current, {
      toolbox: buildToolbox(artifactKind),
      renderer: "zelos",
      theme: BLOCKYEDU_BLOCKLY_THEME,
      grid: {
        spacing: 24,
        length: 2,
        colour: "#2a3344",
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

    const persistFromWorkspace = () => {
      if (applyingRef.current) return;
      const xml = serializeWorkspaceXml(workspace);
      lastWrittenXmlRef.current = xml;
      if (xml !== blockXmlRef.current) {
        setBlockXml(xml);
      }
      const generated = javascriptGenerator.workspaceToCode(workspace);
      const nextCode = generated || "// 拖入积木开始编程";
      if (nextCode !== useWorkspaceStore.getState().code) {
        setCode(nextCode);
      }
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
    }

    persistFromWorkspace();

    return () => {
      workspace.dispose();
      workspaceRef.current = null;
    };
  }, [artifactKind, setBlockXml, setCode]);

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
  }, [blockXml]);

  return <div ref={containerRef} className="blockly-container" />;
}
