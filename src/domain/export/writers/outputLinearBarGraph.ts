import type { EditorObject } from '../../types';
import type { WriteContext } from '../context';
import { writeMacroRefs } from './macroRef';

export function writeOutputLinearBarGraph(obj: EditorObject, ctx: WriteContext): void {
  const { w } = ctx;
  
  w.u16(ctx.idMap.get(obj.id)!);
  w.u8(18); // Output Linear Bar Graph
  
  w.u16(obj.width);
  w.u16(obj.height);
  
  w.u8(obj.backgroundColorIndex ?? 2);
  w.u8(obj.targetLineColor ?? 0);
  
  w.u8(obj.linearBarOptions ?? 1);
  
  w.u8(obj.numberOfTicks ?? 0);
  
  w.u16(obj.minValue ?? 0);
  w.u16(obj.maxValue ?? 100);
  
  w.u16(obj.variableReference ? ctx.resolve(obj.variableReference) : 0xffff);
  w.u16(obj.value ?? 0);
  
  w.u16(obj.targetValueVariableReference ? ctx.resolve(obj.targetValueVariableReference) : 0xffff);
  w.u16(obj.targetValue ?? 0);

  const macros = obj.macros ?? [];
  writeMacroRefs(macros, w, ctx.idMap);
}