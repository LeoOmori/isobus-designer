import type { EditorObject } from '../../types';
import type { WriteContext } from '../context';

export function writeOutputMeter(obj: EditorObject, ctx: WriteContext): void {
  const { w } = ctx;
  w.u16(ctx.idMap.get(obj.id)!);
  w.u8(17); // Output Meter
  w.u16(obj.width);
  w.u8(obj.needleColor ?? 0);
  w.u8(obj.borderColorIndex ?? 0);
  w.u8(obj.arcAndTickColor ?? 0);
  w.u8(obj.meterOptions ?? 0);
  w.u8(obj.numberOfTicks ?? 5);
  w.u8(obj.startAngle ?? 110);
  w.u8(obj.endAngle ?? 35);
  w.u16(obj.minValue ?? 0);
  w.u16(obj.maxValue ?? 0);
  w.u16(obj.variableReference ? ctx.resolve(obj.variableReference) : 0xffff);
  w.u16(obj.value ?? 0);
  w.u8(0); // macros count
}
