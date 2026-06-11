import { describe, expect, it } from 'vitest';
import { ByteWriter } from '../../src/domain/export/byteWriter';
import type { WriteContext } from '../../src/domain/export/context';
import type { EditorObject, ProjectState } from '../../src/domain/types';
import { outputNumberModule, validateOutputNumber } from '../../src/objects/output-number/logic';
import { outputRectangleModule, outputRectangleStyle, validateOutputRectangle } from '../../src/objects/output-rectangle/logic';
import { pictureGraphicModule, migratePictureGraphic, validatePictureGraphic, validatePictureGraphicForExport } from '../../src/objects/picture-graphic/logic';

const font = refObject({ id: 'FONT_1', objectId: '0x0202', kind: 'font-attribute', fontWidth: 16, fontHeight: 24 });
const line = refObject({ id: 'LA_1', objectId: '0x0203', kind: 'line-attribute', lineColor: 2, lineWidth: 3, lineArt: '0xF0F0' });
const fill = refObject({ id: 'FA_1', objectId: '0x0204', kind: 'fill-attribute', fillType: 2, fillColor: 15 });
const mask = refObject({ id: 'DM_1', kind: 'data-mask', x: 0, y: 0, width: 480, height: 480 });
const current = { workingSet: { id: 'WS_1' }, activeMaskId: 'DM_1', nextNumber: 7, objects: [mask, font, line, fill] } as ProjectState;

describe('simple canvas object modules', () => {
  it('create default output-number, output-rectangle, and picture-graphic objects', () => {
    expect(outputNumberModule.createDefault?.({ current, x: 999, y: 999, parentId: 'DM_1' })).toMatchObject({
      id: 'NUM_7', objectId: '0x2EE0', kind: 'output-number', parentId: 'DM_1', x: 440, y: 450,
      width: 80, height: 30, fontAttributeId: 'FONT_1', variableReference: null, value: 0,
    });
    expect(outputRectangleModule.createDefault?.({ current, x: 10, y: 20, parentId: 'DM_1' })).toMatchObject({
      id: 'RECT_7', kind: 'output-rectangle', parentId: 'DM_1', x: 10, y: 20, width: 130, height: 90,
      lineAttributeId: 'LA_1', fillAttributeId: 'FA_1', lineSuppression: 0,
    });
    expect(pictureGraphicModule.createDefault?.({ current, x: 10, y: 20, parentId: 'DM_1' })).toMatchObject({
      id: 'PIC_7', kind: 'picture-graphic', parentId: 'DM_1', x: 10, y: 20, width: 64, height: 64,
      targetWidth: 64, actualWidth: 64, actualHeight: 64, graphicFormat: 2, graphicOptions: 0, rawData: [],
    });

    const keyCurrent = { ...current, objects: [refObject({ id: 'KEY_1', kind: 'key', x: 0, y: 0, width: 60, height: 60 })] } as ProjectState;
    expect(pictureGraphicModule.createDefault?.({ current: keyCurrent, x: 20, y: 30, parentId: 'KEY_1' })).toMatchObject({
      parentId: 'KEY_1', x: 6, y: 6, width: 48, height: 48, targetWidth: 48, actualWidth: 48, actualHeight: 48,
    });
  });

  it('validates simple-canvas constraints', () => {
    const objectById = new Map<string, EditorObject>([[font.id, font], [line.id, line], [fill.id, fill]]);
    expect(validateOutputNumber(outputNumber(), current, { objectById })).toEqual([]);
    expect(validateOutputNumber(outputNumber({ fontAttributeId: '', value: -1, numberOfDecimals: 9 }), current, { objectById })).toEqual([
      'Output Number NUM_1: fontAttributeId is required',
      'Output Number NUM_1: value must fit uint32',
      'Output Number NUM_1: numberOfDecimals must be 0–7',
    ]);

    expect(validateOutputRectangle(rectangle(), current, { objectById })).toEqual([]);
    expect(validateOutputRectangle(rectangle({ lineAttributeId: 'missing', fillAttributeId: 'missing', lineSuppression: 16 }), current, { objectById })).toEqual([
      'Output Rectangle RECT_1: unknown lineAttributeId "missing"',
      'Output Rectangle RECT_1: unknown fillAttributeId "missing"',
      'Output Rectangle RECT_1: lineSuppression must be a 4-bit value',
    ]);

    expect(validatePictureGraphic(picture({ rawData: [0, 1] }), current, { objectById })).toEqual([
      'Picture Graphic PIC_1: rawData length 2 does not match 4 bytes for 2×2 format 2',
    ]);
    expect(validatePictureGraphicForExport(picture({ rawData: [0, 1, 2, 3] }), current, { objectById })).toEqual([]);
    expect(validatePictureGraphicForExport(picture({ rawData: [] }), current, { objectById })).toEqual([
      'Export: Picture Graphic PIC_1 rawData length 0 does not match expected 4 bytes for 2×2 format 2',
    ]);
  });

  it('migrates picture graphic legacy image data', () => {
    const migrated = migratePictureGraphic(picture({ width: 32, height: 32, actualWidth: undefined, actualHeight: undefined, targetWidth: undefined, rawData: [0x89, 0x50, 0x4e, 0x47] }));
    expect(migrated.targetWidth).toBe(32);
    expect(migrated.actualWidth).toBe(32);
    expect(migrated.actualHeight).toBe(32);
    expect(migrated.graphicFormat).toBe(2);
    expect(migrated.rawData).toEqual([]);
    expect(migrated.sourceImageDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('writes deterministic simple-canvas bytes', () => {
    expect(writeHex(outputNumberModule.writer, outputNumber())).toBe('01020c6400140001020200ffff78563412feffffff0000c03f02000600');
    expect(writeHex(outputRectangleModule.writer, rectangle())).toBe('01020e03026400140005040200');
    expect(writeHex(pictureGraphicModule.writer, picture({ rawData: [1, 2, 3, 4] }))).toBe('010214020002000200020000040000000001020304');
  });

  it('computes output-rectangle styles from referenced attributes', () => {
    expect(outputRectangleStyle(rectangle({ lineSuppression: 0b0101 }), line, fill, [])).toMatchObject({
      borderColor: '#009900',
      borderStyle: 'dashed',
      borderTopWidth: 0,
      borderRightWidth: 3,
      borderBottomWidth: 0,
      borderLeftWidth: 3,
      background: '#000099',
    });
  });
});

function outputNumber(changes: Partial<EditorObject> = {}): EditorObject {
  return refObject({
    id: 'NUM_1', kind: 'output-number', width: 100, height: 20, backgroundColorIndex: 1, fontAttributeId: 'FONT_1', variableReference: null,
    outputOptions: 0, value: 0x12345678, offset: -2, scale: 1.5, numberOfDecimals: 2, numberFormat: 0, horizontalJustification: 2, verticalJustification: 1,
    ...changes,
  });
}

function rectangle(changes: Partial<EditorObject> = {}): EditorObject {
  return refObject({ id: 'RECT_1', kind: 'output-rectangle', width: 100, height: 20, lineAttributeId: 'LA_1', fillAttributeId: 'FA_1', lineSuppression: 5, ...changes });
}

function picture(changes: Partial<EditorObject> = {}): EditorObject {
  return refObject({ id: 'PIC_1', kind: 'picture-graphic', width: 2, height: 2, targetWidth: 2, actualWidth: 2, actualHeight: 2, graphicFormat: 2, graphicOptions: 0, transparencyColor: 0, rawData: [], ...changes });
}

function refObject(changes: Partial<EditorObject> = {}): EditorObject {
  return {
    id: 'OBJ_1', objectId: '0x0201', name: 'Object 1', kind: 'font-attribute', visible: true,
    zIndex: 1, x: 0, y: 0, width: 0, height: 0, backgroundColor: '#ffffff', borderColor: '#dfe6f0',
    ...changes,
  } as EditorObject;
}

function writeHex(writerFn: (object: EditorObject, ctx: WriteContext) => void, object: EditorObject) {
  const writer = new ByteWriter();
  const idMap = new Map<string, number>([[object.id, 0x0201], ['FONT_1', 0x0202], ['LA_1', 0x0203], ['FA_1', 0x0204]]);
  writerFn(object, {
    w: writer,
    idMap,
    resolve: (id) => idMap.get(id ?? '') ?? 0xffff,
    objectById: new Map(),
    project: current,
  });
  return Array.from(writer.result(), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
