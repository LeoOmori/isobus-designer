import type { EditorObject } from '../../types';
import type { WriteContext } from '../context';

export function writeNumberVariable(obj: EditorObject, ctx: WriteContext): void {
  const { w } = ctx;
  w.u16(ctx.idMap.get(obj.id)!);
  w.u8(21);
  w.u32(obj.value ?? 0);
}
