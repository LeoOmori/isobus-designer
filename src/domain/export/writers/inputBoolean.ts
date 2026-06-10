import type { EditorObject } from '../../types';
import type { WriteContext } from '../context';
import { writeMacroRefs } from './macroRef';

export function writeInputBoolean(obj: EditorObject, ctx: WriteContext): void {
  const { w } = ctx;
  const macros = obj.macros ?? [];

  w.u16(ctx.idMap.get(obj.id)!);
  w.u8(7); // Input Boolean

  w.u8(obj.backgroundColorIndex ?? 1);
  w.u16(obj.width);

  // Foreground colour field = Font Attributes object ID
  w.u16(ctx.resolve(obj.fontAttributeId));

  // Variable reference (Number Variable ID or 65535 = NULL)
  w.u16(ctx.resolve(obj.variableReference));

  // Value: 0=false, >0=true
  w.u8((obj.value ?? 0) > 0 ? 1 : 0);

  // Enabled: 0=disabled, 1=enabled (VT v4+)
  w.u8((obj.inputEnabled ?? true) ? 1 : 0);

  // Macros
  writeMacroRefs(macros, w, ctx.idMap);
}
