import type { EditorObject } from '../../types';
import type { WriteContext } from '../context';

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
    .filter((c): c is EditorObject => c !== undefined);

  const skmId = ctx.resolve(obj.softKeyMaskId);

  w.u16(ctx.idMap.get(obj.id)!);
  w.u8(1);
  w.u8(obj.backgroundColorIndex ?? 1);
  w.u16(skmId);
  w.u8(children.length);
  w.u8(0); // macro count = 0 for V1

  for (const child of children) {
    w.u16(ctx.idMap.get(child.id) ?? 0xffff);
    w.i16(child.x);
    w.i16(child.y);
  }
}
