import { describe, expect, it } from 'vitest';
import { ByteWriter } from '../../src/domain/export/byteWriter';
import type { WriteContext } from '../../src/domain/export/context';
import type { EditorObject, ProjectState } from '../../src/domain/types';
import { buttonFrameStyle, buttonModule, validateButton } from '../../src/objects/button/logic';
import { containerFrameStyle, containerModule, validateContainer } from '../../src/objects/container/logic';
import { keyModule, validateKey, validateKeyForExport } from '../../src/objects/key/logic';

const mask = object({ id: 'DM_1', kind: 'data-mask', x: 0, y: 0, width: 480, height: 480 });
const child = object({ id: 'STR_1', kind: 'output-string', parentId: 'CT_1', x: 10, y: 20 });
const current = { workingSet: { id: 'WS_1' }, activeMaskId: 'DM_1', nextNumber: 7, objects: [mask, child] } as ProjectState;

describe('container/button/key object modules', () => {
  it('create defaults matching existing editor behavior', () => {
    expect(containerModule.createDefault?.({ current, x: 999, y: 999, parentId: 'DM_1' })).toMatchObject({
      id: 'CT_7', objectId: '0x0BB8', kind: 'container', parentId: 'DM_1', x: 440, y: 450, width: 200, height: 200,
      locked: false, childObjectIds: [], hidden: false,
    });
    expect(buttonModule.createDefault?.({ current, x: 10, y: 20, parentId: 'DM_1' })).toMatchObject({
      id: 'BTN_7', kind: 'button', parentId: 'DM_1', width: 120, height: 42, childObjectIds: [], keyCode: 0, buttonOptions: 0, borderColorIndex: 0, objectId: '0x1770',
    });
    expect(keyModule.createDefault?.({ current, x: 10, y: 20, parentId: 'DM_1' })).toMatchObject({
      id: 'KEY_7', kind: 'key', x: 0, y: 0, width: 60, height: 60, childObjectIds: [], label: 'Key', actionName: '', keyCode: 1, objectId: '0x1388',
    });
  });

  it('validates container/button/key rules', () => {
    const objectById = new Map<string, EditorObject>([[child.id, child]]);
    expect(validateContainer(object({ id: 'CT_1', kind: 'container', childObjectIds: ['STR_1'], hidden: false, width: 100, height: 100 }), current, { objectById })).toEqual([]);
    expect(validateContainer(object({ id: 'CT_1', kind: 'container', childObjectIds: ['missing'], hidden: false }), current, { objectById })).toEqual([
      'Container CT_1: child "missing" must be Container/Button/Output String/Number/Rectangle or Picture Graphic',
    ]);

    expect(validateButton(object({ id: 'BTN_1', kind: 'button', keyCode: 0, buttonOptions: 2, width: 100, height: 20 }), current, { objectById })).toContain('Button BTN_1: latched requires latchable');
    expect(validateKey(object({ id: 'KEY_1', kind: 'key', keyCode: 0 }), current, { objectById })).toContain('Key KEY_1: keyCode must be 1–255');
    expect(validateKeyForExport(object({ id: 'KEY_1', kind: 'key', keyCode: 0 }))).toEqual(['Export: Key KEY_1 keyCode must be 1–255']);
  });

  it('computes frame styles', () => {
    expect(containerFrameStyle()).toMatchObject({ borderColor: 'transparent', background: 'transparent', boxSizing: 'border-box' });
    expect(buttonFrameStyle(object({ kind: 'button', buttonOptions: 2 | 32, borderColorIndex: 0 }))).toMatchObject({
      borderColor: 'transparent', borderWidth: 0, filter: 'brightness(0.88)', boxShadow: expect.stringContaining('inset'),
    });
  });

  it('writes deterministic container/button/key bytes', () => {
    expect(writeHex(containerModule.writer, object({ id: 'CT_1', kind: 'container', width: 100, height: 20, hidden: true, childObjectIds: ['STR_1'] }))).toBe('0102036400140001010002020a001400');
    expect(writeHex(buttonModule.writer, object({ id: 'BTN_1', kind: 'button', width: 100, height: 20, backgroundColorIndex: 1, borderColorIndex: 2, keyCode: 3, buttonOptions: 4, childObjectIds: ['STR_1'] }))).toBe('0102066400140001020304010002020a001400');
    expect(writeHex(keyModule.writer, object({ id: 'KEY_1', kind: 'key', backgroundColorIndex: 1, keyCode: 2, childObjectIds: ['STR_1'] }))).toBe('0102050102010002020a001400');
  });
});

function object(changes: Partial<EditorObject> = {}): EditorObject {
  return {
    id: 'OBJ_1', objectId: '0x0201', name: 'Object 1', kind: 'container', visible: true,
    zIndex: 1, x: 0, y: 0, width: 100, height: 20, backgroundColor: '#ffffff', backgroundColorIndex: 1, borderColor: '#dfe6f0',
    ...changes,
  } as EditorObject;
}

function writeHex(writerFn: (object: EditorObject, ctx: WriteContext) => void, objectToWrite: EditorObject) {
  const writer = new ByteWriter();
  const objectById = new Map<string, EditorObject>([[child.id, child]]);
  const idMap = new Map<string, number>([[objectToWrite.id, 0x0201], [child.id, 0x0202]]);
  writerFn(objectToWrite, {
    w: writer,
    idMap,
    resolve: (id) => idMap.get(id ?? '') ?? 0xffff,
    objectById,
    project: current,
  });
  return Array.from(writer.result(), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
