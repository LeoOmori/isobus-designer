import type { EditorObject } from '../../types';
import type { WriteContext } from '../context';

export function writeOutputArchedBarGraph(obj: EditorObject, ctx: WriteContext): void {
  const { w } = ctx;
  
  w.u16(ctx.idMap.get(obj.id)!);
  w.u8(19); // Output Arched Bar Graph
  
  w.u16(obj.width);
  w.u16(obj.height);
  
  w.u8(obj.backgroundColorIndex ?? 2);
  w.u8(obj.targetLineColor ?? 4);
  
  w.u8(obj.archedBarOptions ?? 3);
  
  w.u8(obj.arcStartAngle ?? 45);   // stored as angle/2
  w.u8(obj.arcEndAngle ?? 135);    // stored as angle/2
  
  w.u16(obj.barGraphWidth ?? 12);
  
  w.u16(obj.minValue ?? 0);
  w.u16(obj.maxValue ?? 100);
  
  w.u16(obj.variableReference ? ctx.resolve(obj.variableReference) : 0xffff);
  w.u16(obj.value ?? 0);
  
  w.u16(obj.targetValueVariableReference ? ctx.resolve(obj.targetValueVariableReference) : 0xffff);
  w.u16(obj.targetValue ?? 0);
  
  w.u8(0); // macros count
}