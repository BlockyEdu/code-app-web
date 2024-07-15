import * as Blockly from 'blockly';
import { Order, javascriptGenerator } from 'blockly/javascript';
import { useEffect, useRef } from 'react';
import { TOOLBOX_XML } from '../lib/blockly-config';
import { useWorkspaceStore } from '../stores/workspace';
import 'blockly/blocks';
import 'blockly/javascript';

export function BlocklyEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const { blockXml, setBlockXml, setCode } = useWorkspaceStore();

  useEffect(() => {
    if (!containerRef.current || workspaceRef.current) return;

    javascriptGenerator.forBlock['text_print'] = (block, generator) => {
      const value = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
      return `console.log(${value});\n`;
    };

    const workspace = Blockly.inject(containerRef.current, {
      toolbox: TOOLBOX_XML,
      grid: { spacing: 20, length: 3, colour: '#e0e0e0', snap: true },
      zoom: { controls: true, wheel: true, startScale: 1, maxScale: 3, minScale: 0.3 },
      trashcan: true,
      media: 'https://blockly-demo.appspot.com/static/media/',
    });

    workspaceRef.current = workspace;

    if (blockXml) {
      Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(blockXml), workspace);
    }

    const onChange = () => {
      const xml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));
      setBlockXml(xml);
      const code = javascriptGenerator.workspaceToCode(workspace);
      setCode(code || '// 拖入积木开始编程');
    };

    workspace.addChangeListener(onChange);
    onChange();

    return () => {
      workspace.dispose();
      workspaceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace || !blockXml) return;
    const current = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));
    if (current !== blockXml) {
      workspace.clear();
      Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(blockXml), workspace);
    }
  }, [blockXml]);

  return <div ref={containerRef} className="blockly-container" />;
}
