import { nearestVtColorIndex } from '../../isobus';
import type { WorkingSet } from '../../types';
import type { WriteContext } from '../context';

/**
 * ISO 11783-6 Working Set Object (Type 0)
 *
 * Layout (Annex B):
 *   u16  objectId = 0x0000   (always forced — ISO convention)
 *   u8   type = 0
 *   u8   backgroundColor     (VT palette index derived from workingSet.backgroundColor)
 *   u8   selectable          (1 if ws.selectable, else 0)
 *   u16  activeMask          (objectId of activeDataMaskId; 0xFFFF if none)
 *   u8   N                   (number of object references — Data Masks + Soft Key Masks)
 *   u8   M = 0               (macro count, written BEFORE object refs)
 *   N × [ u16 objectId ]     (referenced object IDs — NO coordinates)
 *   u8   L                   (number of language codes)
 *   L × 2 bytes              (2-char ASCII language code, e.g. "en" → 0x65, 0x6E)
 *
 * The Working Set references all Data Masks and Soft Key Masks in the pool so
 * the VT knows which masks belong to this pool.
 */
export function writeWorkingSet(ws: WorkingSet, ctx: WriteContext): void {
  const { w, project } = ctx;

  // Collect top-level pool objects the WS owns: Data Masks + Soft Key Masks
  const topLevel = project.objects.filter(
    (o) => o.kind === 'data-mask' || o.kind === 'soft-key-mask',
  );

  // Background color: derive VT palette index from CSS hex
  const bgColorIndex = nearestVtColorIndex(ws.backgroundColor ?? '#ffffff');

  // Active mask reference
  const activeMaskId = ctx.resolve(ws.activeDataMaskId);

  // Language code (first 2 chars of ws.language, ASCII)
  const lang = (ws.language ?? 'en').slice(0, 2).padEnd(2, ' ');
  const numLanguages = lang.trim().length > 0 ? 1 : 0;

  // Working Set is always written with objectId 0x0000 (forced per spec)
  w.u16(0x0000);
  w.u8(0);
  w.u8(bgColorIndex & 0xff);
  w.u8(ws.selectable ? 1 : 0);
  w.u16(activeMaskId);
  w.u8(topLevel.length);
  w.u8(0); // macro count = 0 for V1

  for (const obj of topLevel) {
    w.u16(ctx.idMap.get(obj.id) ?? 0xffff);
  }

  w.u8(numLanguages);
  if (numLanguages > 0) {
    w.u8(lang.charCodeAt(0) & 0xff);
    w.u8(lang.charCodeAt(1) & 0xff);
  }
}
