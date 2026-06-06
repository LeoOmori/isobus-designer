import type { EditorObject } from '../../types';
import type { WriteContext } from '../context';
import { parseLineArt } from '../encoding';

export function writeLineAttributes(obj: EditorObject, ctx: WriteContext): void {
  const { w } = ctx;
  w.u16(ctx.idMap.get(obj.id)!);
  w.u8(24);
  w.u8(obj.lineColor ?? 0);
  w.u8(obj.lineWidth ?? 1);
  w.u16(parseLineArt(obj.lineArt));
  w.u8(0);
}
