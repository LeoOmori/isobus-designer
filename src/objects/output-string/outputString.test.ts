import { describe, expect, it } from 'vitest';
import { ByteWriter } from '../../domain/export/byteWriter';
import type { WriteContext } from '../../domain/export/context';
import type { EditorObject, ProjectState } from '../../domain/types';
import { exportObjectPool } from '../../domain/export/exportObjectPool';
import { createDefaultOutputString, migrateOutputString } from './defaults';
import { outputStringModule } from './module';
import { validateOutputString } from './validate';
import { validateOutputStringForExport } from './validateExport';

const font = {
  id: 'FONT_1', objectId: '0x0201', name: 'Font 1', kind: 'font-attribute', visible: true,
  zIndex: 1, x: 0, y: 0, width: 0, height: 0, backgroundColor: 'transparent', borderColor: 'transparent',
  fontColor: 0, fontWidth: 16, fontHeight: 24, fontType: 1, fontStyle: 0,
} satisfies EditorObject;

const outputString = {
  id: 'STR_2', objectId: '0x0202', name: 'Output String 2', kind: 'output-string', visible: true,
  parentId: 'DM_1', zIndex: 2, x: 10, y: 20, width: 100, height: 20,
  backgroundColor: '#ffffff', backgroundColorIndex: 1, borderColor: '#dfe6f0',
  text: 'Hi', length: 4, fontAttributeId: 'FONT_1', variableReference: null,
  outputOptions: 0, horizontalJustification: 0, verticalJustification: 0,
} satisfies EditorObject;

describe('output-string object module', () => {
  it('creates default objects with parent and font references', () => {
    const current = {
      workingSet: { id: 'WS_1' },
      activeMaskId: 'DM_1',
      nextNumber: 7,
      objects: [
        { id: 'DM_1', kind: 'data-mask', x: 0, y: 0, width: 480, height: 480 } as EditorObject,
        font,
      ],
    } as ProjectState;

    const created = createDefaultOutputString({ current, x: 999, y: 999, parentId: 'DM_1' });

    expect(created).toMatchObject({
      id: 'STR_7',
      objectId: '0x0207',
      kind: 'output-string',
      parentId: 'DM_1',
      x: 440,
      y: 450,
      width: 220,
      height: 42,
      fontAttributeId: 'FONT_1',
      variableReference: null,
    });
  });

  it('migrates legacy output string fields', () => {
    const migrated = migrateOutputString({
      ...outputString,
      backgroundColor: 'transparent',
      outputOptions: 0,
      length: undefined,
      text: 'abc',
      stringVariableId: 'SV_1',
      variableReference: undefined,
      horizontalJustification: undefined,
      verticalJustification: undefined,
      horizontalAlign: 'right',
      verticalAlign: 'bottom',
    });

    expect(migrated.length).toBe(32);
    expect(migrated.variableReference).toBe('SV_1');
    expect(migrated.stringVariableId).toBeUndefined();
    expect(migrated.outputOptions).toBe(1);
    expect(migrated.horizontalJustification).toBe(2);
    expect(migrated.verticalJustification).toBe(2);
  });

  it('validates editor constraints', () => {
    const objectById = new Map<string, EditorObject>([[font.id, font]]);
    expect(validateOutputString(outputString, {} as ProjectState, { objectById })).toEqual([]);

    expect(validateOutputString({
      ...outputString,
      fontAttributeId: 'missing',
      length: 1,
      text: 'toolong',
      outputOptions: 0b1000,
      horizontalJustification: 9 as never,
      verticalJustification: 9 as never,
    }, {} as ProjectState, { objectById })).toEqual([
      'Output String STR_2: unknown fontAttributeId "missing"',
      'Output String STR_2: text is 7 bytes but fixed length is 1',
      'Output String STR_2: outputOptions contains unknown bits',
      'Output String STR_2: invalid horizontal justification',
      'Output String STR_2: invalid vertical justification',
    ]);
  });

  it('validates export latin-1 and fixed-length constraints', () => {
    expect(validateOutputStringForExport(outputString, {} as ProjectState, { objectById: new Map() })).toEqual([]);
    expect(validateOutputStringForExport({ ...outputString, text: 'Olá 🚜' }, {} as ProjectState, { objectById: new Map() })).toEqual([
      'Export: Output String STR_2 text contains non-Latin-1 characters (V1 supports ISO 8859-1 only)',
    ]);
    expect(validateOutputStringForExport({ ...outputString, text: 'abc', length: 2 }, {} as ProjectState, { objectById: new Map() })).toEqual([
      'Export: Output String STR_2 text (3 chars) exceeds fixed length 2',
    ]);
  });

  it('writes deterministic output string bytes', () => {
    const writer = new ByteWriter();
    const idMap = new Map<string, number>([['STR_2', 0x0202], ['FONT_1', 0x0201]]);
    const ctx = {
      w: writer,
      idMap,
      resolve: (id) => idMap.get(id ?? '') ?? 0xffff,
      objectById: new Map<string, EditorObject>(),
      project: {} as ProjectState,
    } satisfies WriteContext;

    outputStringModule.writer(outputString, ctx);

    expect(hex(writer.result())).toBe('02020b6400140001010200ffff0004004869000000');
  });

  it('exports a minimal project to stable iop bytes', () => {
    const project = minimalProject();
    const result = exportObjectPool(project);

    expect(result.errors).toEqual([]);
    expect(hex(result.bytes)).toBe(
      '0102170006010000' +
      '02020b6400140001010200ffff0004004869000000' +
      '00020101ffff010002020a001400' +
      '00000001010002000001656e',
    );
  });
});

function minimalProject(): ProjectState {
  const mask = {
    id: 'DM_1', objectId: '0x0200', name: 'Data Mask 1', kind: 'data-mask', visible: true,
    zIndex: 0, x: 0, y: 0, width: 480, height: 480, backgroundColor: '#ffffff', backgroundColorIndex: 1,
    borderColor: '#dfe6f0', childObjectIds: ['STR_2'], softKeyMaskId: '', nextMaskId: '', previousMaskId: '',
  } satisfies EditorObject;

  return {
    workingSet: {
      id: 'WS_1', objectId: '0x0001', name: 'Working Set 1', version: '1.0.0', language: 'en',
      activeDataMaskId: 'DM_1', activeSoftKeyMaskId: '', backgroundColor: '#ffffff', selectable: true,
      visible: true, designatorObjects: [],
    },
    activeMaskId: 'DM_1',
    nextNumber: 3,
    objects: [mask, font, outputString],
  };
}

function hex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
