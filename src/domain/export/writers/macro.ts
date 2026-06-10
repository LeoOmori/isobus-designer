import type { EditorObject, MacroCommand } from '../../types';
import type { WriteContext } from '../context';
import { ByteWriter } from '../byteWriter';

/**
 * VT command IDs for Macro command packets (ISO 11783-6 Annex F).
 * Each command is stored as an 8-byte CAN packet inside the Macro object,
 * padded with 0xFF to fill the packet.
 */
const VT_CMD = {
  HideShowObject:       0xA0,  // [cmd, objId(u16), show(u8)]               → 4 bytes
  ChangeBackgroundColor: 0xA7, // [cmd, objId(u16), colour(u8)]              → 4 bytes
  ChangeNumericValue:   0xA8,  // [cmd, objId(u16), value(u32)]              → 7 bytes
  ChangeActiveMask:     0xAD,  // [cmd, wsId(u16), maskId(u16)]              → 5 bytes
  ChangeAttribute:      0xAF,  // [cmd, objId(u16), attrId(u8), value(u32)]  → 8 bytes (exact)
} as const;

/** Pad a command packet to exactly 8 bytes by appending 0xFF. */
function padCommandTo8(bytes: Uint8Array): Uint8Array {
  if (bytes.length > 8) throw new Error(`Macro command packet exceeds 8 bytes (${bytes.length})`);
  const padded = new Uint8Array(8);
  padded.fill(0xff);
  padded.set(bytes);
  return padded;
}

function encodeHideShowObject(cmd: MacroCommand, ctx: WriteContext): Uint8Array {
  const w = new ByteWriter();
  w.u8(VT_CMD.HideShowObject);
  w.u16(ctx.resolve(cmd.objectEditorId));
  w.u8(cmd.showObject ? 1 : 0);
  return w.result();
}

function encodeChangeNumericValue(cmd: MacroCommand, ctx: WriteContext): Uint8Array {
  const w = new ByteWriter();
  w.u8(VT_CMD.ChangeNumericValue);
  w.u16(ctx.resolve(cmd.objectEditorId));
  w.u32(cmd.numericValue ?? 0);
  return w.result();
}

function encodeChangeBackgroundColor(cmd: MacroCommand, ctx: WriteContext): Uint8Array {
  const w = new ByteWriter();
  w.u8(VT_CMD.ChangeBackgroundColor);
  w.u16(ctx.resolve(cmd.objectEditorId));
  w.u8(cmd.colorIndex ?? 0);
  return w.result();
}

function encodeChangeActiveMask(cmd: MacroCommand, ctx: WriteContext): Uint8Array {
  const w = new ByteWriter();
  w.u8(VT_CMD.ChangeActiveMask);
  // Working Set is always 0x0000 in V1
  w.u16(ctx.idMap.get(ctx.project.workingSet.id) ?? 0x0000);
  w.u16(ctx.resolve(cmd.maskEditorId));
  return w.result();
}

function encodeChangeAttribute(cmd: MacroCommand, ctx: WriteContext): Uint8Array {
  const w = new ByteWriter();
  w.u8(VT_CMD.ChangeAttribute);
  w.u16(ctx.resolve(cmd.objectEditorId));
  w.u8(cmd.attributeId ?? 0);
  w.u32(cmd.attributeValue ?? 0);
  return w.result();
}

/** Encode a friendly MacroCommand to its raw VT packet bytes (before padding). */
function encodeMacroCommand(cmd: MacroCommand, ctx: WriteContext): Uint8Array {
  switch (cmd.kind) {
    case 'hideShowObject':       return encodeHideShowObject(cmd, ctx);
    case 'changeNumericValue':   return encodeChangeNumericValue(cmd, ctx);
    case 'changeBackgroundColor': return encodeChangeBackgroundColor(cmd, ctx);
    case 'changeActiveMask':     return encodeChangeActiveMask(cmd, ctx);
    case 'changeAttribute':      return encodeChangeAttribute(cmd, ctx);
    default:
      throw new Error(`Unsupported macro command kind: ${(cmd as MacroCommand).kind}`);
  }
}

/**
 * Binary layout (ISO 11783-6 object type 28):
 *   Object ID              uint16
 *   Type                   uint8 = 28
 *   Number of bytes follow uint16  (= commandCount × 8)
 *   Commands               variable (each command padded to 8 bytes with 0xFF)
 */
export function writeMacro(obj: EditorObject, ctx: WriteContext): void {
  const { w } = ctx;
  const commands = obj.macroCommands ?? [];

  const commandBytes: number[] = [];
  for (const cmd of commands) {
    const raw = encodeMacroCommand(cmd, ctx);
    const padded = padCommandTo8(raw);
    commandBytes.push(...padded);
  }

  w.u16(ctx.idMap.get(obj.id)!);
  w.u8(28);
  w.u16(commandBytes.length);
  w.raw(new Uint8Array(commandBytes));
}
