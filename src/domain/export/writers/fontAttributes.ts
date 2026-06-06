import type { EditorObject } from '../../types';
import type { WriteContext } from '../context';
import { fontSizeEnum } from '../encoding';

export function writeFontAttributes(obj: EditorObject, ctx: WriteContext): void {
  const { w } = ctx;
  const sizeEnum = fontSizeEnum(obj.fontWidth ?? 16, obj.fontHeight ?? 24);
  w.u16(ctx.idMap.get(obj.id)!);
  w.u8(23);
  w.u8(obj.fontColor ?? 0);
  w.u8(sizeEnum >= 0 ? sizeEnum : 0);
  w.u8(obj.fontType ?? 0);
  w.u8(obj.fontStyle ?? 0);
  w.u8(0);
}
