import type { EditorObject } from '../../types';
import type { WriteContext } from '../context';

/**
 * ISO 11783-6 Soft Key Mask Object (Type 4)
 *
 * Layout (Annex B):
 *   u16  objectId
 *   u8   type = 4
 *   u8   backgroundColor   (palette index; default 1=white)
 *   u8   N                 (number of key object refs — NO coordinates for SKM children)
 *   u8   M = 0             (macro count, written BEFORE key refs)
 *   N × [ u16 keyId ]      (Key object IDs; no x/y — VT positions them automatically)
 */
export function writeSoftKeyMask(obj: EditorObject, ctx: WriteContext): void {
  const { w } = ctx;

  // Soft Key Mask stores keys in obj.keys (not childObjectIds)
  const keys = (obj.keys ?? [])
    .map((id) => ctx.objectById.get(id))
    .filter((k): k is EditorObject => k !== undefined);

  w.u16(ctx.idMap.get(obj.id)!);
  w.u8(4);
  w.u8(obj.backgroundColorIndex ?? 1); // SKMs default transparent in editor; use white (1) for spec
  w.u8(keys.length);
  w.u8(0); // macro count = 0 for V1

  for (const key of keys) {
    w.u16(ctx.idMap.get(key.id) ?? 0xffff);
    // NOTE: Soft Key Mask key references have NO coordinates
  }
}
