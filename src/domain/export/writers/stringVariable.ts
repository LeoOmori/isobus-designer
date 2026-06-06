import type { EditorObject } from '../../types';
import type { WriteContext } from '../context';

export function writeStringVariable(obj: EditorObject, ctx: WriteContext): void {
  const { w } = ctx;
  const text = obj.stringValue ?? '';
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i) & 0xff;
  w.u16(ctx.idMap.get(obj.id)!);
  w.u8(22);
  w.u16(bytes.length);
  w.raw(bytes);
}
