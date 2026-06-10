import type { EditorObject } from '../../types';
import type { WriteContext } from '../context';
import { asHorizontalJustification, asVerticalJustification, packJustification } from '../../isobus';
import { writeMacroRefs } from './macroRef';

function encodeLatin1Fixed(value: string, length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  bytes.fill(0x20);
  for (let i = 0; i < Math.min(value.length, length); i++) {
    const code = value.charCodeAt(i);
    bytes[i] = code <= 0xff ? code : 0x3f;
  }
  return bytes;
}

export function writeInputString(obj: EditorObject, ctx: WriteContext): void {
  const { w } = ctx;
  const length = Math.min(obj.length ?? 16, 255);
  const valueBytes = encodeLatin1Fixed(obj.text ?? '', length);
  const macros = obj.macros ?? [];

  const h = asHorizontalJustification(obj.horizontalJustification);
  const v = asVerticalJustification(obj.verticalJustification);

  w.u16(ctx.idMap.get(obj.id)!);
  w.u8(8); // Input String

  w.u16(obj.width);
  w.u16(obj.height);

  w.u8(obj.backgroundColorIndex ?? 1);
  w.u16(ctx.resolve(obj.fontAttributeId));

  w.u16(65535); // Input Attributes: NULL for V1

  w.u8((obj.outputOptions ?? 0) & 0x07); // transparent | auto-wrap | wrap-on-hyphen

  w.u16(ctx.resolve(obj.variableReference)); // String Variable or 65535

  w.u8(packJustification(h, v));

  w.u8(length);
  w.raw(valueBytes);

  w.u8((obj.inputEnabled ?? true) ? 1 : 0); // Enabled (VT v4+)

  writeMacroRefs(macros, w, ctx.idMap);
}
