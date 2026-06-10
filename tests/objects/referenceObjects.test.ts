import { describe, expect, it } from 'vitest';
import { ByteWriter } from '../../src/domain/export/byteWriter';
import type { WriteContext } from '../../src/domain/export/context';
import type { EditorObject, ProjectState } from '../../src/domain/types';
import { fillAttributeModule, validateFillAttribute } from '../../src/objects/fill-attribute/logic';
import { fontAttributeModule, validateFontAttributeForExport } from '../../src/objects/font-attribute/logic';
import { lineAttributeModule } from '../../src/objects/line-attribute/logic';
import { numberVariableModule } from '../../src/objects/number-variable/logic';
import { stringVariableModule, validateStringVariableForExport } from '../../src/objects/string-variable/logic';

const current = {
  workingSet: { id: 'WS_1' },
  activeMaskId: 'DM_1',
  nextNumber: 7,
  objects: [{ id: 'DM_1' }, { id: 'STR_1' }],
} as ProjectState;

describe('reference-only object modules', () => {
  it('create reference defaults without canvas layout', () => {
    expect(fontAttributeModule.createDefault?.({ current, x: 0, y: 0, parentId: 'DM_1' })).toMatchObject({
      id: 'FONT_7', objectId: '0x0207', name: 'Font Attribute 7', kind: 'font-attribute', width: 0, height: 0,
      backgroundColor: 'transparent', borderColor: 'transparent', fontColor: 0, fontWidth: 16, fontHeight: 24, fontType: 1, fontStyle: 0,
    });
    expect(lineAttributeModule.createDefault?.({ current, x: 0, y: 0, parentId: 'DM_1' })).toMatchObject({
      id: 'LA_7', kind: 'line-attribute', lineColor: 0, lineWidth: 1, lineArt: '0xFFFF',
    });
    expect(fillAttributeModule.createDefault?.({ current, x: 0, y: 0, parentId: 'DM_1' })).toMatchObject({
      id: 'FA_7', kind: 'fill-attribute', fillType: 2, fillColor: 15,
    });
    expect(stringVariableModule.createDefault?.({ current, x: 0, y: 0, parentId: 'DM_1' })).toMatchObject({
      id: 'SV_7', kind: 'string-variable', stringValue: 'Dynamic text', maxLength: 128,
    });
    expect(numberVariableModule.createDefault?.({ current, x: 0, y: 0, parentId: 'DM_1' })).toMatchObject({
      id: 'NV_7', kind: 'number-variable', value: 0, unit: '',
    });
  });

  it('validates extracted reference-only rules', () => {
    expect(validateFillAttribute(refObject({ id: 'FA_1', kind: 'fill-attribute', fillType: 3 }), current, { objectById: new Map() })).toEqual([
      'Fill Attribute FA_1: fillType=3 (pattern) requires a fillPattern reference',
    ]);
    expect(validateFillAttribute(refObject({ kind: 'fill-attribute', fillType: 2 }), current, { objectById: new Map() })).toEqual([]);

    expect(validateStringVariableForExport(refObject({ id: 'SV_1', kind: 'string-variable', stringValue: 'Olá' }), current, { objectById: new Map() })).toEqual([]);
    expect(validateStringVariableForExport(refObject({ id: 'SV_1', kind: 'string-variable', stringValue: '🚜' }), current, { objectById: new Map() })).toEqual([
      'Export: String Variable SV_1 value contains non-Latin-1 characters (V1 supports ISO 8859-1 only)',
    ]);

    expect(validateFontAttributeForExport(refObject({ id: 'FONT_1', kind: 'font-attribute', fontWidth: 10, fontHeight: 10 }), current, { objectById: new Map() })[0]).toContain('Font Attribute FONT_1 size 10×10 is not a standard V1 cell size');
  });

  it('writes deterministic reference-only bytes', () => {
    expect(writeHex(fontAttributeModule.writer, refObject({ id: 'FONT_1', kind: 'font-attribute', fontColor: 5, fontWidth: 16, fontHeight: 24, fontType: 1, fontStyle: 3 }))).toBe('0102170506010300');
    expect(writeHex(lineAttributeModule.writer, refObject({ id: 'LA_1', kind: 'line-attribute', lineColor: 2, lineWidth: 3, lineArt: '0xF0F0' }))).toBe('0102180203f0f000');
    expect(writeHex(fillAttributeModule.writer, refObject({ id: 'FA_1', kind: 'fill-attribute', fillType: 3, fillColor: 4, fillPattern: 'PIC_1' }))).toBe('0102190304090200');
    expect(writeHex(stringVariableModule.writer, refObject({ id: 'SV_1', kind: 'string-variable', stringValue: 'Å' }))).toBe('0102160100c5');
    expect(writeHex(numberVariableModule.writer, refObject({ id: 'NV_1', kind: 'number-variable', value: 0x12345678 }))).toBe('01021578563412');
  });
});

function refObject(changes: Partial<EditorObject> = {}): EditorObject {
  return {
    id: 'OBJ_1', objectId: '0x0201', name: 'Object 1', kind: 'font-attribute', visible: true,
    zIndex: 1, x: 0, y: 0, width: 0, height: 0, backgroundColor: 'transparent', borderColor: 'transparent',
    ...changes,
  } as EditorObject;
}

function writeHex(writerFn: (object: EditorObject, ctx: WriteContext) => void, object: EditorObject) {
  const writer = new ByteWriter();
  const idMap = new Map<string, number>([[object.id, 0x0201], ['PIC_1', 0x0209]]);
  writerFn(object, {
    w: writer,
    idMap,
    resolve: (id) => idMap.get(id ?? '') ?? 0xffff,
    objectById: new Map(),
    project: current,
    vtVersion: 4,
  });
  return Array.from(writer.result(), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
