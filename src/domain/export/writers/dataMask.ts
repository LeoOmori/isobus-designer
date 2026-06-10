import type { EditorObject } from '../../types';
import type { WriteContext } from '../context';
import { writeMacroCount, writeMacroPairs } from './macroRef';

/**
 * ISO 11783-6 Data Mask Object (Type 1)
 *
 * Layout (Annex B):
 *   u16  objectId
 *   u8   type = 1
 *   u8   backgroundColor     (palette index; obj.backgroundColorIndex ?? 1)
 *   u16  softKeyMaskId       (ctx.resolve(obj.softKeyMaskId) → 0xFFFF if none)
 *   u8   N                   (number of child object refs)
 *   u8   M = 0               (macro count, written BEFORE children)
 *   N × [ u16 childId, i16 x, i16 y ]
 *         (x/y are absolute coordinates within the 480×480 mask)
 */
export function writeDataMask(obj: EditorObject, ctx: WriteContext): void {
  const { w } = ctx;

  const children = (obj.childObjectIds ?? [])
    .map((id) => ctx.objectById.get(id))
    .filter((c): c is EditorObject => c !== undefined)
    .sort((a, b) => a.zIndex - b.zIndex);

  const skmId = ctx.resolve(obj.softKeyMaskId);
  const macros = obj.macros ?? [];

  w.u16(ctx.idMap.get(obj.id)!);
  w.u8(1);
  w.u8(obj.backgroundColorIndex ?? 1);
  w.u16(skmId);
  w.u8(children.length);
  writeMacroCount(macros, w);

  for (const child of children) {
    w.u16(ctx.idMap.get(child.id) ?? 0xffff);
    w.i16(child.x);
    w.i16(child.y);
  }

  writeMacroPairs(macros, w, ctx.idMap);
}
