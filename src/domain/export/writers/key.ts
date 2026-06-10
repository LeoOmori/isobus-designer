import type { EditorObject } from '../../types';
import type { WriteContext } from '../context';
import { writeMacroCount, writeMacroPairs } from './macroRef';

/**
 * ISO 11783-6 Key Object (Type 5)
 *
 * Layout (Annex B):
 *   u16  objectId
 *   u8   type = 5
 *   u8   backgroundColor   (palette index; default 1=white)
 *   u8   keyCode           (obj.keyCode ?? 1)
 *   u8   N                 (number of child object refs)
 *   u8   M = 0             (macro count, written BEFORE children)
 *   N × [ u16 childId, i16 x, i16 y ]
 */
export function writeKey(obj: EditorObject, ctx: WriteContext): void {
  const { w } = ctx;

  const children = (obj.childObjectIds ?? [])
    .map((id) => ctx.objectById.get(id))
    .filter((c): c is EditorObject => c !== undefined)
    .sort((a, b) => a.zIndex - b.zIndex);

  w.u16(ctx.idMap.get(obj.id)!);
  w.u8(5);
  w.u8(obj.backgroundColorIndex ?? 1); // spec-backed default is white (1)
  w.u8(obj.keyCode ?? 1);
  const macros = obj.macros ?? [];
  w.u8(children.length);
  writeMacroCount(macros, w);

  for (const child of children) {
    w.u16(ctx.idMap.get(child.id) ?? 0xffff);
    w.i16(child.x);
    w.i16(child.y);
  }

  writeMacroPairs(macros, w, ctx.idMap);
}
