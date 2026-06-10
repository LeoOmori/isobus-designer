import type { EditorObject } from '../../types';
import type { WriteContext } from '../context';
import { asHorizontalJustification, asVerticalJustification, packJustification } from '../../isobus';
import { writeMacroRefs } from './macroRef';

export function writeOutputNumber(obj: EditorObject, ctx: WriteContext): void {
  const { w } = ctx;
  const h = asHorizontalJustification(obj.horizontalJustification);
  const v = asVerticalJustification(obj.verticalJustification);

  w.u16(ctx.idMap.get(obj.id)!);
  w.u8(12);
  w.u16(obj.width);
  w.u16(obj.height);
  w.u8(obj.backgroundColorIndex ?? 1);
  w.u16(ctx.resolve(obj.fontAttributeId));
  w.u8(obj.outputOptions ?? 0);
  w.u16(ctx.resolve(obj.variableReference));
  w.u32(obj.value ?? 0);
  w.i32(obj.offset ?? 0);
  w.f32(obj.scale ?? 1.0);
  w.u8(obj.numberOfDecimals ?? 0);
  w.u8(obj.numberFormat ?? 0);
  w.u8(packJustification(h, v));
  const macros = obj.macros ?? [];
  writeMacroRefs(macros, w, ctx.idMap);
}
