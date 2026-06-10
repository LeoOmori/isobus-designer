import type { EditorObject } from '../../types';
import type { WriteContext } from '../context';
import { writeMacroCount, writeMacroPairs } from './macroRef';

/**
 * ISO 11783-6 Alarm Mask Object (Type 2)
 *
 * Layout (Annex B):
 *   u16  objectId
 *   u8   type = 2
 *   u8   backgroundColor     (palette index; obj.backgroundColorIndex ?? 1)
 *   u16  softKeyMaskId       (ctx.resolve(obj.alarmSoftKeyMaskId) → 0xFFFF if none)
 *   u8   priority            (0=high, 1=medium, 2=low)
 *   u8   acousticSignal      (0=highest, 3=silent)
 *   u8   N                   (number of child object refs)
 *   u8   M                   (macro count)
 *   N × [ u16 childId, i16 x, i16 y ]
 *   M × [ u8 eventId, u8 macroId ]
 */
export function writeAlarmMask(obj: EditorObject, ctx: WriteContext): void {
  const { w } = ctx;

  const children = (obj.childObjectIds ?? [])
    .map((id) => ctx.objectById.get(id))
    .filter((c): c is EditorObject => c !== undefined)
    .sort((a, b) => a.zIndex - b.zIndex);

  const macros = obj.macros ?? [];
  const skmId = ctx.resolve(obj.alarmSoftKeyMaskId);

  w.u16(ctx.idMap.get(obj.id)!);
  w.u8(2); // Alarm Mask
  w.u8(obj.backgroundColorIndex ?? 1);
  w.u16(skmId);
  w.u8(obj.priority ?? 1);
  w.u8(obj.acousticSignal ?? 3);
  w.u8(children.length);
  writeMacroCount(macros, w);

  for (const child of children) {
    w.u16(ctx.idMap.get(child.id) ?? 0xffff);
    w.i16(child.x);
    w.i16(child.y);
  }

  writeMacroPairs(macros, w, ctx.idMap);
}
