import type { EditorObject } from '../../types';
import type { WriteContext } from '../context';
import { asHorizontalJustification, asVerticalJustification, packJustification } from '../../isobus';
import { writeMacroRefs } from './macroRef';

export function writeOutputString(obj: EditorObject, ctx: WriteContext): void {
  const { w } = ctx;
  const length = obj.length ?? 32;
  const text = obj.text ?? '';
  const encoded = new Uint8Array(length);
  const limit = Math.min(text.length, length);
  for (let i = 0; i < limit; i++) encoded[i] = text.charCodeAt(i) & 0xff;

  const h = asHorizontalJustification(obj.horizontalJustification);
  const v = asVerticalJustification(obj.verticalJustification);

  w.u16(ctx.idMap.get(obj.id)!);
  w.u8(11);
  w.u16(obj.width);
  w.u16(obj.height);
  w.u8(obj.backgroundColorIndex ?? 1);
  w.u16(ctx.resolve(obj.fontAttributeId));
  w.u8(obj.outputOptions ?? 0);
  w.u16(ctx.resolve(obj.variableReference));
  w.u8(packJustification(h, v));
  w.u16(length);
  w.raw(encoded);
  const macros = obj.macros ?? [];
  writeMacroRefs(macros, w, ctx.idMap);
}
