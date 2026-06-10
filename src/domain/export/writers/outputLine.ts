import type { EditorObject } from '../../types';
import type { WriteContext } from '../context';
import { writeMacroRefs } from './macroRef';

export function writeOutputLine(obj: EditorObject, ctx: WriteContext): void {
  const { w } = ctx;
  const macros = obj.macros ?? [];

  w.u16(ctx.idMap.get(obj.id)!);
  w.u8(13); // Output Line

  w.u16(ctx.resolve(obj.lineAttributeId));
  w.u16(obj.width);
  w.u16(obj.height);
  w.u8(obj.lineDirection ?? 0);

  writeMacroRefs(macros, w, ctx.idMap);
}
