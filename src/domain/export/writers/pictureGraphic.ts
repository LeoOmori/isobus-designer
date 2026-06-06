import type { EditorObject } from '../../types';
import type { WriteContext } from '../context';
import { asPictureGraphicFormat } from '../../vtPalette';

export function writePictureGraphic(obj: EditorObject, ctx: WriteContext): void {
  const { w } = ctx;
  const data = obj.rawData ?? [];
  w.u16(ctx.idMap.get(obj.id)!);
  w.u8(20);
  w.u16(obj.targetWidth ?? obj.width);
  w.u16(obj.actualWidth ?? obj.width);
  w.u16(obj.actualHeight ?? obj.height);
  w.u8(asPictureGraphicFormat(obj.graphicFormat));
  w.u8(obj.graphicOptions ?? 0);
  w.u8(obj.transparencyColor ?? 0);
  w.u32(data.length);
  w.raw(data);
  w.u8(0);
}
