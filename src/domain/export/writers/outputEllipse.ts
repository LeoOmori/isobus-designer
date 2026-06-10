import type { EditorObject } from '../../types';
import type { WriteContext } from '../context';
import { writeMacroRefs } from './macroRef';

export function writeOutputEllipse(obj: EditorObject, ctx: WriteContext): void {
  const { w } = ctx;
  const macros = obj.macros ?? [];

  w.u16(ctx.idMap.get(obj.id)!);
  w.u8(15); // Output Ellipse

  w.u16(ctx.resolve(obj.lineAttributeId));
  w.u16(obj.width);
  w.u16(obj.height);
  w.u8(obj.ellipseType ?? 0);
  w.u8(obj.startAngle ?? 0);
  w.u8(obj.endAngle ?? 0);
  w.u16(obj.fillAttributeId ? ctx.resolve(obj.fillAttributeId) : 0xffff);

  writeMacroRefs(macros, w, ctx.idMap);
}
