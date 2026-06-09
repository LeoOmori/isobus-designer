import type { EditorObject } from '../../types';
import type { WriteContext } from '../context';

export function writeInputList(obj: EditorObject, ctx: WriteContext): void {
  const { w } = ctx;
  const macros = obj.macros ?? [];
  const listItems = obj.listItems ?? [];

  w.u16(ctx.idMap.get(obj.id)!);
  w.u8(10); // Input List

  w.u16(obj.width);
  w.u16(obj.height);

  // Variable reference: Number Variable ID or 65535 = NULL
  w.u16(ctx.resolve(obj.variableReference));

  // Selected index: 0–254, or 255 = no item chosen
  w.u8(obj.value ?? 255);

  // Number of list items
  w.u8(listItems.length);

  // Options byte: bit0 = enabled, bit1 = realTimeEditing
  const enabled = (obj.inputEnabled ?? true) ? 1 : 0;
  const rte = (obj.realTimeEditing ?? false) ? 2 : 0;
  w.u8(enabled | rte);

  // Macro count
  w.u8(macros.length);

  // List item object IDs (65535 = NULL placeholder for empty string entries)
  for (const itemId of listItems) {
    const resolvedId = itemId ? (ctx.idMap.get(itemId) ?? 0xffff) : 0xffff;
    w.u16(resolvedId);
  }

  // Macro records
  for (const macro of macros) {
    w.u8(macro.eventId);
    w.u8(macro.macroId);
  }
}
