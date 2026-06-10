import type { EditorObject } from '../../types';
import type { WriteContext } from '../context';
import { writeMacroCount, writeMacroPairs } from './macroRef';

export function writeContainer(obj: EditorObject, ctx: WriteContext): void {
  const { w } = ctx;
  const children = (obj.childObjectIds ?? [])
    .map((id) => ctx.objectById.get(id))
    .filter((c): c is EditorObject => c !== undefined)
    .sort((a, b) => a.zIndex - b.zIndex);
  const macros = obj.macros ?? [];

  w.u16(ctx.idMap.get(obj.id)!);
  w.u8(3);
  w.u16(obj.width);
  w.u16(obj.height);
  w.u8(obj.hidden ? 1 : 0);
  w.u8(children.length);
  writeMacroCount(macros, w);
  for (const child of children) {
    w.u16(ctx.idMap.get(child.id) ?? 0xffff);
    w.i16(child.x);
    w.i16(child.y);
  }

  writeMacroPairs(macros, w, ctx.idMap);
}
