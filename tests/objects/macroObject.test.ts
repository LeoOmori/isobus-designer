import { describe, expect, it } from 'vitest';
import { ByteWriter } from '../../src/domain/export/byteWriter';
import type { WriteContext } from '../../src/domain/export/context';
import type { EditorObject, MacroCommand, ProjectState } from '../../src/domain/types';
import { macroModule } from '../../src/objects/macro/logic';

const current = {
  workingSet: { id: 'WS_1' },
  activeMaskId: 'DM_1',
  nextNumber: 7,
  objects: [{ id: 'DM_1' }, { id: 'NV_1' }],
} as ProjectState;

const idMap = new Map<string, number>([
  ['MCR_1', 0x0201],
  ['WS_1',  0x0000],
  ['DM_1',  0x0202],
  ['NV_1',  0x0203],
]);

function makeCtx(obj: EditorObject): WriteContext {
  return {
    w: new ByteWriter(),
    idMap,
    resolve: (id) => idMap.get(id ?? '') ?? 0xffff,
    objectById: new Map(),
    project: { ...current, workingSet: { ...current.workingSet, id: 'WS_1' } } as ProjectState,
    vtVersion: 4,
  };
}

function writeHex(obj: EditorObject): string {
  const ctx = makeCtx(obj);
  macroModule.writer(obj, ctx);
  return Array.from(ctx.w.result(), (b) => b.toString(16).padStart(2, '0')).join('');
}

function macroObj(commands: MacroCommand[]): EditorObject {
  return {
    id: 'MCR_1', objectId: '0x0201', name: 'Macro 1', kind: 'macro', visible: true,
    zIndex: 1, x: 0, y: 0, width: 0, height: 0,
    backgroundColor: 'transparent', borderColor: 'transparent',
    macroCommands: commands,
  } as EditorObject;
}

describe('Macro object module', () => {
  it('createDefault returns correct base shape', () => {
    const obj = macroModule.createDefault?.({ current, x: 0, y: 0, parentId: 'DM_1' });
    expect(obj).toMatchObject({
      id: 'MCR_7', kind: 'macro', macroCommands: [], width: 0, height: 0,
    });
  });

  it('writes empty macro — zero command bytes', () => {
    // 01 02  → Object ID 0x0201 (LE)
    // 1c     → Type 28
    // 00 00  → 0 bytes to follow
    expect(writeHex(macroObj([]))).toBe('01021c0000');
  });

  it('writes hideShowObject command padded to 8 bytes', () => {
    // Command: A0 02 02 01 FF FF FF FF  (hide NV_1 = 0x0203)
    const hex = writeHex(macroObj([
      { id: 'c1', kind: 'hideShowObject', objectEditorId: 'NV_1', showObject: false },
    ]));
    // Header: 01 02 1c 08 00  (+5 bytes)
    // Command: A0 03 02 00 FF FF FF FF
    expect(hex).toBe('01021c0800' + 'a0030200ffffffff');
  });

  it('writes changeNumericValue command (7 bytes raw + 1 pad)', () => {
    // Command: A8 03 02 01 00 00 00 FF  (set NV_1 = 0x0203 → 1)
    const hex = writeHex(macroObj([
      { id: 'c1', kind: 'changeNumericValue', objectEditorId: 'NV_1', numericValue: 1 },
    ]));
    expect(hex).toBe('01021c0800' + 'a80302010000' + '00' + 'ff');
  });

  it('writes changeBackgroundColor command (4 bytes raw + 4 pad)', () => {
    // Command: A7 02 02 05 FF FF FF FF  (DM_1 = 0x0202, colour 5)
    const hex = writeHex(macroObj([
      { id: 'c1', kind: 'changeBackgroundColor', objectEditorId: 'DM_1', colorIndex: 5 },
    ]));
    expect(hex).toBe('01021c0800' + 'a7020205ffffffff');
  });

  it('writes changeActiveMask command (5 bytes raw + 3 pad)', () => {
    // Command: AD 00 00 02 02 FF FF FF  (WS=0x0000, DM_1=0x0202)
    const hex = writeHex(macroObj([
      { id: 'c1', kind: 'changeActiveMask', maskEditorId: 'DM_1' },
    ]));
    expect(hex).toBe('01021c0800' + 'ad00000202ffffff');
  });

  it('writes changeAttribute command (8 bytes exact, no padding)', () => {
    // Command: AF 03 02 07 2A 00 00 00  (NV_1=0x0203, attrId=7, value=42)
    const hex = writeHex(macroObj([
      { id: 'c1', kind: 'changeAttribute', objectEditorId: 'NV_1', attributeId: 7, attributeValue: 42 },
    ]));
    expect(hex).toBe('01021c0800' + 'af0302072a000000');
  });

  it('writes two commands = 16 command bytes', () => {
    const hex = writeHex(macroObj([
      { id: 'c1', kind: 'hideShowObject', objectEditorId: 'NV_1', showObject: true },
      { id: 'c2', kind: 'changeActiveMask', maskEditorId: 'DM_1' },
    ]));
    // Header: 01 02 1c 10 00  (16 bytes to follow)
    expect(hex.startsWith('01021c1000')).toBe(true);
    expect(hex.length).toBe(5 * 2 + 16 * 2); // 5 header + 16 command bytes
  });

  it('validates missing fields', () => {
    const obj = macroObj([
      { id: 'c1', kind: 'hideShowObject' },        // missing objectEditorId
      { id: 'c2', kind: 'changeActiveMask' },       // missing maskEditorId
    ]);
    const errs = macroModule.validate!(obj, current, { objectById: new Map() });
    expect(errs.length).toBe(2);
    expect(errs[0]).toContain('target object is required');
    expect(errs[1]).toContain('target mask is required');
  });
});
