import { describe, expect, it } from 'vitest';
import { ByteWriter } from '../../src/domain/export/byteWriter';
import type { WriteContext } from '../../src/domain/export/context';
import type { EditorObject, ProjectState } from '../../src/domain/types';
import { alarmMaskFrameStyle, alarmMaskModule, validateAlarmMask } from '../../src/objects/alarm-mask/logic';
import { dataMaskFrameStyle, dataMaskModule, validateDataMask } from '../../src/objects/data-mask/logic';
import { SOFT_KEY_SLOT_SIZE, softKeyMaskFrameStyle, softKeyMaskModule, softKeySlotStyle, validateSoftKeyMask, validateSoftKeyMaskForExport } from '../../src/objects/soft-key-mask/logic';

const mask = object({ id: 'DM_1', kind: 'data-mask', x: 10, y: 20, width: 480, height: 480, backgroundColor: '#ffffff', zIndex: 3 });
const skm = object({ id: 'SKM_1', kind: 'soft-key-mask', backgroundColorIndex: 1, keys: ['KEY_1'] });
const key = object({ id: 'KEY_1', kind: 'key', objectId: '0x0203', backgroundColorIndex: 2 });
const am = object({ id: 'AM_7', kind: 'alarm-mask', backgroundColorIndex: 3, childObjectIds: ['STR_1'], priority: 0, acousticSignal: 1, alarmSoftKeyMaskId: '' });
const child = object({ id: 'STR_1', kind: 'output-string', objectId: '0x0204', x: 11, y: 22 });
const current = { workingSet: { id: 'WS_1' }, activeMaskId: 'DM_1', nextNumber: 7, objects: [mask, skm, key, am, child] } as ProjectState;

describe('top-level object modules', () => {
  it('creates data-mask, alarm-mask, and soft-key-mask defaults', () => {
    expect(dataMaskModule.createDefault?.({ current, x: 0, y: 0, parentId: 'DM_1' })).toMatchObject({
      id: 'DM_7', objectId: '0x03E8', kind: 'data-mask', x: 90, y: 100, width: 480, height: 480,
      locked: false, childObjectIds: [], softKeyMaskId: '', nextMaskId: '', previousMaskId: '',
    });
    expect(softKeyMaskModule.createDefault?.({ current, x: 0, y: 0, parentId: 'DM_1' })).toMatchObject({
      id: 'SKM_7', objectId: '0x0FA0', kind: 'soft-key-mask', x: 0, y: 0, width: 0, height: 0,
      locked: false, keys: [], layoutPreview: 'vertical', softKeyCountPreview: 6,
    });
    expect(alarmMaskModule.createDefault?.({ current, x: 0, y: 0, parentId: '' })).toMatchObject({
      id: 'AM_7', objectId: '0x07D0', kind: 'alarm-mask', x: 150, y: 100, width: 480, height: 480,
      locked: false, childObjectIds: [], priority: 1, acousticSignal: 3, alarmSoftKeyMaskId: '',
    });
  });

  it('validates data-mask, alarm-mask, and soft-key-mask rules', () => {
    const objectById = new Map<string, EditorObject>([[skm.id, skm], [key.id, key], [child.id, child]]);
    expect(validateDataMask({ ...mask, softKeyMaskId: 'SKM_1' }, current, { objectById })).toEqual([]);
    expect(validateDataMask({ ...mask, softKeyMaskId: 'missing' }, current, { objectById })).toEqual(['Data Mask DM_1: softKeyMaskId "missing" not found']);

    expect(validateSoftKeyMask(skm, current, { objectById })).toEqual([]);
    expect(validateSoftKeyMask({ ...skm, keys: ['KEY_1', 'KEY_1', 'missing'], backgroundColorIndex: 300 }, current, { objectById })).toEqual([
      'Soft Key Mask SKM_1: backgroundColorIndex must be 0–255',
      'Soft Key Mask SKM_1: duplicate key reference "KEY_1"',
      'Soft Key Mask SKM_1: key "missing" must reference an existing Key object',
    ]);
    expect(validateSoftKeyMaskForExport({ ...skm, keys: Array.from({ length: 256 }, (_, index) => `KEY_${index}`) })).toEqual(['Export: Soft Key Mask SKM_1 has more than 255 key references']);

    expect(validateAlarmMask(am, current, { objectById })).toEqual([]);
    expect(validateAlarmMask({ ...am, priority: 5 as 0 | 1 | 2, acousticSignal: 7 as 0 | 1 | 2 | 3 }, current, { objectById })).toEqual([
      'Alarm Mask AM_7: priority must be 0 (high), 1 (medium), or 2 (low)',
      'Alarm Mask AM_7: acousticSignal must be 0–3',
    ]);
  });

  it('computes top-level styles', () => {
    expect(dataMaskFrameStyle(mask)).toMatchObject({ left: 10, top: 20, width: 480, height: 480, background: '#FFFFFF', zIndex: 3 });
    expect(softKeyMaskFrameStyle(mask, skm)).toMatchObject({ left: 494, top: 20, width: 62, height: 372, background: '#FFFFFF', zIndex: 3 });
    expect(softKeySlotStyle(key)).toMatchObject({ width: SOFT_KEY_SLOT_SIZE, height: SOFT_KEY_SLOT_SIZE, background: '#009900' });
    expect(alarmMaskFrameStyle(am)).toMatchObject({ left: 0, top: 0, width: 0, height: 0, background: '#009999', zIndex: 1 });
  });

  it('writes deterministic data-mask, alarm-mask, and soft-key-mask bytes', () => {
    expect(writeHex(dataMaskModule.writer, { ...mask, softKeyMaskId: 'SKM_1', childObjectIds: ['STR_1'] })).toBe('010201010202010004020b001600');
    expect(writeHex(softKeyMaskModule.writer, skm)).toBe('0202040101000302');
    expect(writeHex(alarmMaskModule.writer, am)).toBe('01020203ffff0001010004020b001600');
  });
});

function object(changes: Partial<EditorObject> = {}): EditorObject {
  return {
    id: 'OBJ_1', objectId: '0x0201', name: 'Object 1', kind: 'data-mask', visible: true,
    zIndex: 1, x: 0, y: 0, width: 0, height: 0, backgroundColor: '#ffffff', backgroundColorIndex: 1, borderColor: '#dfe6f0',
    ...changes,
  } as EditorObject;
}

function writeHex(writerFn: (object: EditorObject, ctx: WriteContext) => void, objectToWrite: EditorObject) {
  const writer = new ByteWriter();
  const objectById = new Map<string, EditorObject>([[skm.id, skm], [key.id, key], [child.id, child]]);
  const idMap = new Map<string, number>([[objectToWrite.id, 0x0201], [skm.id, 0x0202], [key.id, 0x0203], [child.id, 0x0204]]);
  writerFn(objectToWrite, {
    w: writer,
    idMap,
    resolve: (id) => idMap.get(id ?? '') ?? 0xffff,
    objectById,
    project: current,
    vtVersion: 3,
  });
  return Array.from(writer.result(), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
