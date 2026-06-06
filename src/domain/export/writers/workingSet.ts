import { nearestVtColorIndex } from '../../isobus';
import type { WorkingSet } from '../../types';
import type { WriteContext } from '../context';

/**
 * ISO 11783-6 Working Set Object (Type 0)
 *
 * Layout:
 *   u16  objectId = 0x0000   (always forced — ISO convention)
 *   u8   type = 0
 *   u8   backgroundColor     (VT palette index derived from workingSet.backgroundColor)
 *   u8   selectable          (1 if ws.selectable, else 0)
 *   u16  activeMask          (objectId of activeDataMaskId; 0xFFFF if none)
 *   u8   N                   (number of designator objects)
 *   u8   M = 0               (macro count — V1 has none)
 *   u8   L                   (number of language codes)
 *   N × [ u16 objectId, i16 x, i16 y ]
 *   L × 2 bytes              (language code ASCII, padded with spaces)
 *
 * Working Set designator objects identify the Working Set in the VT's Soft Key
 * designator area.
 */
export function writeWorkingSet(ws: WorkingSet, ctx: WriteContext): void {
  const { w } = ctx;

  const bgColorIndex = nearestVtColorIndex(ws.backgroundColor ?? '#ffffff');
  const activeMaskId = ctx.resolve(ws.activeDataMaskId);
  const designatorObjects = ws.designatorObjects ?? [];

  const language = typeof ws.language === 'string' ? ws.language.trim() : '';
  const languageCode = language.length > 0 ? language.slice(0, 2).padEnd(2, ' ') : '';
  const hasLanguage = languageCode.length === 2;

  w.u16(0x0000);
  w.u8(0);
  w.u8(bgColorIndex & 0xff);
  w.u8(ws.selectable ? 1 : 0);
  w.u16(activeMaskId);
  w.u8(designatorObjects.length & 0xff);
  w.u8(0);
  w.u8(hasLanguage ? 1 : 0);

  for (const designator of designatorObjects) {
    w.u16(ctx.resolve(designator.objectId));
    w.i16(designator.x);
    w.i16(designator.y);
  }

  if (hasLanguage) {
    w.u8(languageCode.charCodeAt(0) & 0xff);
    w.u8(languageCode.charCodeAt(1) & 0xff);
  }
}
