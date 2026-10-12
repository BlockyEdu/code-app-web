/**
 * Blockly helpers for the create workspace.
 * TOOLBOX_XML kept as exercise XML fallback; prefer `buildToolbox(kind)`.
 */
import { STUDIO_CATEGORY } from "./blockly-theme";
import { t } from "./i18n";

export { DEFAULT_JS } from "./blockly-defaults";
export {
  buildToolbox,
  DEFAULT_KIND_CODE,
  DEFAULT_KIND_XML,
  ensureTargetGenerators,
  registerTargetBlocks,
} from "./targets";

/** Legacy XML toolbox — exercise fallback if JSON toolbox fails. */
export const TOOLBOX_XML = () => `
<xml xmlns="https://developers.google.com/blockly/xml">
  <category name="${t("toolbox.logic")}" categorystyle="${STUDIO_CATEGORY.logic}">
    <block type="controls_if"></block>
    <block type="logic_compare"></block>
    <block type="logic_operation"></block>
    <block type="logic_boolean"></block>
  </category>
  <category name="${t("toolbox.loops")}" categorystyle="${STUDIO_CATEGORY.loops}">
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
  <category name="${t("toolbox.math")}" categorystyle="${STUDIO_CATEGORY.math}">
    <block type="math_number"><field name="NUM">0</field></block>
    <block type="math_arithmetic"></block>
  </category>
  <category name="${t("toolbox.text")}" categorystyle="${STUDIO_CATEGORY.text}">
    <block type="text"></block>
    <block type="text_print"></block>
    <block type="text_join"></block>
  </category>
  <category name="${t("toolbox.variables")}" categorystyle="${STUDIO_CATEGORY.variables}" custom="VARIABLE"></category>
</xml>
`;
