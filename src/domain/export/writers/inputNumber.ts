import type { EditorObject } from '../../types';
import type { WriteContext } from '../context';
import { asHorizontalJustification, asVerticalJustification, packJustification } from '../../isobus';
import { writeMacroRefs } from './macroRef';

export function writeInputNumber(obj: EditorObject, ctx: WriteContext): void {
  const { w } = ctx;
  const macros = obj.macros ?? [];

  const h = asHorizontalJustification(obj.horizontalJustification);
  const v = asVerticalJustification(obj.verticalJustification);

  w.u16(ctx.idMap.get(obj.id)!);
  w.u8(9); // Input Number

  w.u16(obj.width);
  w.u16(obj.height);

  w.u8(obj.backgroundColorIndex ?? 1);
  w.u16(ctx.resolve(obj.fontAttributeId));

  w.u8((obj.outputOptions ?? 0) & 0x0f); // transparent | leadingZeros | zeroAsBlank | truncate

  w.u16(ctx.resolve(obj.variableReference)); // Number Variable or 65535

  w.u32(obj.value ?? 0);
  w.u32(obj.minValue ?? 0);
  w.u32(obj.maxValue ?? 0xffffffff);

  w.i32(obj.offset ?? 0);
  w.f32(obj.scale ?? 1.0);

  w.u8(obj.numberOfDecimals ?? 0);
  w.u8(obj.numberFormat ?? 0);

  w.u8(packJustification(h, v));

  // Options 2: bit0 = enabled, bit1 = realTimeEditing
  const enabled = (obj.inputEnabled ?? true) ? 1 : 0;
  const rte = (obj.realTimeEditing ?? false) ? 2 : 0;
  w.u8(enabled | rte);

  writeMacroRefs(macros, w, ctx.idMap);
}
