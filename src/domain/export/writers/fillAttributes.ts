import type { EditorObject } from '../../types';
import type { WriteContext } from '../context';

export function writeFillAttributes(obj: EditorObject, ctx: WriteContext): void {
  const { w } = ctx;
  w.u16(ctx.idMap.get(obj.id)!);
  w.u8(25);
  w.u8(obj.fillType ?? 0);
  w.u8(obj.fillColor ?? 0);
  w.u16(ctx.resolve(obj.fillPattern));
  w.u8(0);
}
