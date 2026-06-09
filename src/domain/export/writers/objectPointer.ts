import type { EditorObject } from '../../types';
import type { WriteContext } from '../context';

export function writeObjectPointer(obj: EditorObject, ctx: WriteContext): void {
  const { w } = ctx;
  const value = obj.pointerValue ? ctx.resolve(obj.pointerValue) : 0xffff;

  w.u16(ctx.idMap.get(obj.id)!);
  w.u8(27);
  w.u16(value);
}
