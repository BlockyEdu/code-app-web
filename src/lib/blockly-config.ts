/**
 * Blockly helpers for the create workspace.
 * TOOLBOX_XML kept as exercise XML fallback; prefer `buildToolbox(kind)`.
 */
export { DEFAULT_JS } from "./blockly-defaults";
export {
  buildToolbox,
  DEFAULT_KIND_CODE,
  DEFAULT_KIND_XML,
  ensureTargetGenerators,
  registerTargetBlocks,
} from "./targets";

/** Legacy XML toolbox — exercise fallback if JSON toolbox fails. */
export const TOOLBOX_XML = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <category name="逻辑" colour="210">
    <block type="controls_if"></block>
    <block type="logic_compare"></block>
    <block type="logic_operation"></block>
    <block type="logic_boolean"></block>
  </category>
  <category name="循环" colour="120">
    <block type="controls_repeat_ext">
      <value name="TIMES"><shadow type="math_number"><field name="NUM">10</field></shadow></value>
    </block>
    <block type="controls_whileUntil"></block>
    <block type="controls_for">
      <value name="FROM"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
      <value name="TO"><shadow type="math_number"><field name="NUM">10</field></shadow></value>
      <value name="BY"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
    </block>
  </category>
  <category name="数学" colour="230">
    <block type="math_number"><field name="NUM">0</field></block>
    <block type="math_arithmetic"></block>
  </category>
  <category name="文本" colour="160">
    <block type="text"></block>
    <block type="text_print"></block>
    <block type="text_join"></block>
  </category>
  <category name="变量" colour="330" custom="VARIABLE"></category>
</xml>
`;
