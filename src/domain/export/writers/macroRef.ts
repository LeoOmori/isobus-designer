import type { MacroReference } from '../../types';
import type { ByteWriter } from '../byteWriter';

/**
 * Resolve a MacroReference to its uint8 ISO object ID for binary export.
 *
 * Priority:
 *   1. macroEditorId → idMap lookup → uint8 (preferred; set by editor UI)
 *   2. macroId        → uint8 directly (legacy / manual entry)
 *
 * Note: ISO 11783-6 V4 limits macro references to IDs 0–255.
 * Any value > 255 is silently truncated to its low byte here.
 */
export function resolveMacroId(
  macro: MacroReference,
  idMap: Map<string, number>,
): number {
  const id = macro.macroEditorId !== undefined
    ? (idMap.get(macro.macroEditorId) ?? 0xFF)
    : macro.macroId;
  return id & 0xFF;
}

/**
 * Write just the macro count byte.
 * Use before writing variable-length data (children, points, etc.)
 * when the macro pair bytes must appear AFTER that data.
 */
export function writeMacroCount(
  macros: MacroReference[],
  w: ByteWriter,
): void {
  w.u8(macros.length);
}

/**
 * Write M×[eventId, macroId] pairs without a preceding count.
 * Use AFTER writing variable-length data when the count was already
 * emitted earlier via writeMacroCount().
 */
export function writeMacroPairs(
  macros: MacroReference[],
  w: ByteWriter,
  idMap: Map<string, number>,
): void {
  for (const macro of macros) {
    w.u8(macro.eventId & 0xFF);
    w.u8(resolveMacroId(macro, idMap));
  }
}

/**
 * Write N macro references followed by M×[eventId, macroId] pairs.
 * This is the standard layout used by most VT objects where macro
 * data appears at the very end with no intervening variable-length fields.
 */
export function writeMacroRefs(
  macros: MacroReference[],
  w: ByteWriter,
  idMap: Map<string, number>,
): void {
  writeMacroCount(macros, w);
  writeMacroPairs(macros, w, idMap);
}
