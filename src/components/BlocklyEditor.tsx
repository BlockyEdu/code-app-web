import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import { useEffect, useRef } from "react";
import { buildToolbox, ensureTargetGenerators } from "../lib/blockly-config";
import { BLOCKYEDU_BLOCKLY_THEME } from "../lib/blockly-theme";
import { useWorkspaceStore } from "../stores/workspace";
import "blockly/blocks";
import "blockly/javascript";

export function BlocklyEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
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
      media: "https://blockly-demo.appspot.com/static/media/",
    });

    workspaceRef.current = workspace;

    const initialXml = blockXmlRef.current;
    if (initialXml) {
      try {
        Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(initialXml), workspace);
      } catch {
        /* ignore bad XML */
      }
    }

    const onChange = () => {
      const xml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));
      setBlockXml(xml);
      const code = javascriptGenerator.workspaceToCode(workspace);
      setCode(code || "// 拖入积木开始编程");
    };

    workspace.addChangeListener(onChange);
    onChange();

    return () => {
      workspace.dispose();
      workspaceRef.current = null;
    };
  }, [artifactKind, setBlockXml, setCode]);

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace || !blockXml) return;
    const current = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));
    if (current !== blockXml) {
      workspace.clear();
      try {
        Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(blockXml), workspace);
      } catch {
        /* ignore */
      }
    }
  }, [blockXml]);

  return <div ref={containerRef} className="blockly-container" />;
}
