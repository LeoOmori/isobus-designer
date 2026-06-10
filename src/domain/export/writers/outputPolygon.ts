import type { EditorObject } from '../../types';
import type { WriteContext } from '../context';
import { writeMacroCount, writeMacroPairs } from './macroRef';

export function writeOutputPolygon(obj: EditorObject, ctx: WriteContext): void {
  const { w } = ctx;
  const macros = obj.macros ?? [];
  const points = obj.polygonPoints ?? [];

  w.u16(ctx.idMap.get(obj.id)!);
  w.u8(16); // Output Polygon

  w.u16(obj.width);
  w.u16(obj.height);

  w.u16(ctx.resolve(obj.lineAttributeId));
  w.u16(ctx.resolve(obj.fillAttributeId)); // resolves null to 65535 via ctx.resolve

  w.u8(obj.polygonType ?? 2);

  w.u8(Math.min(points.length, 255));
  writeMacroCount(macros, w);

  const maxPoints = Math.min(points.length, 255);
  for (let i = 0; i < maxPoints; i++) {
    w.u16(points[i].x);
    w.u16(points[i].y);
  }

  writeMacroPairs(macros, w, ctx.idMap);
}
