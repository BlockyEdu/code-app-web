import type * as Blockly from "blockly";
import { javascriptGenerator, Order } from "blockly/javascript";
import { ALL_BLOCK_SPECS, registerTargetBlocks, type ValueReader } from "./blocks";

let generatorsReady = false;

/** Register block defs + JS generators once per page load. */
export function ensureTargetGenerators(): void {
  if (generatorsReady) return;
  registerTargetBlocks();

  const readValue: ValueReader = (block, name, fallback) =>
    javascriptGenerator.valueToCode(block, name, Order.NONE) || fallback;

  ALL_BLOCK_SPECS.forEach((spec) => {
    const isValueBlock = Object.hasOwn(spec.json, "output");
    if (isValueBlock) {
      javascriptGenerator.forBlock[spec.type] = (block: Blockly.Block) => [
        spec.generator(block, readValue),
        Order.FUNCTION_CALL,
      ];
      return;
    }
    javascriptGenerator.forBlock[spec.type] = (block: Blockly.Block) =>
      `__step('${block.id}');\n${spec.generator(block, readValue)}`;
  });

  // Stock text_print uses alert(); map to console.log for exercise/console.
  javascriptGenerator.forBlock.text_print = (block: Blockly.Block) => {
    const value = javascriptGenerator.valueToCode(block, "TEXT", Order.NONE) || "''";
    return `console.log(${value});\n`;
  };

  generatorsReady = true;
}
