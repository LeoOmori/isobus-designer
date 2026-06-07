import { describe, expect, it } from 'vitest';
import { ByteWriter } from '../domain/export/byteWriter';
import type { WriteContext } from '../domain/export/context';
import type { EditorObject, ProjectState, WorkingSet } from '../domain/types';
import { validate, validateExport, workingSetModule } from './working-set/logic';

const dataMask = object({ id: 'DM_1', kind: 'data-mask', objectId: '0x0201' });
const designator = object({ id: 'STR_1', kind: 'output-string', objectId: '0x0202' });

describe('working set module', () => {
  it('validates editor and export rules', () => {
    const project = projectWith({ objects: [dataMask, designator] });
    const lookup = { objectById: new Map(project.objects.map((object) => [object.id, object])) };

    expect(validate(project, lookup)).toEqual([]);
    expect(validateExport(project, lookup)).toEqual([]);

    expect(validate(projectWith({ workingSet: workingSet({ activeDataMaskId: 'STR_1', designatorObjects: [{ objectId: 'missing', x: 0, y: 0 }] }) }), lookup)).toEqual([
      'Working Set: activeDataMaskId "STR_1" not found',
      'Working Set: designator object "missing" not found',
    ]);

    const exportErrors = validateExport(
      projectWith({ workingSet: workingSet({ activeDataMaskId: '', designatorObjects: [{ objectId: '', x: 0, y: 0 }] }), objects: [] }),
      { objectById: new Map() },
    );
    expect(exportErrors).toEqual([
      'Export: Working Set must have an Active Data Mask set',
      'Export: Pool must contain at least one Data Mask',
      'Export: Working Set designator entry has no object selected',
    ]);
  });

  it('writes deterministic working set bytes', () => {
    expect(writeHex(workingSetModule.writer, workingSet())).toBe('0000000001010201000102020a00fbff656e');
  });
});

function object(changes: Partial<EditorObject> = {}): EditorObject {
  return {
    id: 'OBJ_1', objectId: '0x0201', name: 'Object 1', kind: 'data-mask', visible: true,
    zIndex: 1, x: 0, y: 0, width: 100, height: 20, backgroundColor: '#ffffff', backgroundColorIndex: 1, borderColor: '#dfe6f0',
    ...changes,
  } as EditorObject;
}

function workingSet(changes: Partial<WorkingSet> = {}): WorkingSet {
  return {
    id: 'WS_1', objectId: '0x0000', name: 'Working Set', version: '1.0', language: 'en', activeDataMaskId: 'DM_1',
    activeSoftKeyMaskId: '', backgroundColor: '#000000', selectable: true, visible: true,
    designatorObjects: [{ objectId: 'STR_1', x: 10, y: -5 }],
    ...changes,
  };
}

function projectWith(changes: Partial<ProjectState> = {}): ProjectState {
  return {
    workingSet: workingSet(),
    activeMaskId: 'DM_1',
    nextNumber: 3,
    objects: [dataMask, designator],
    ...changes,
  } as ProjectState;
}

function writeHex(writerFn: (workingSet: WorkingSet, ctx: WriteContext) => void, workingSetToWrite: WorkingSet) {
  const writer = new ByteWriter();
  const objects = [dataMask, designator];
  const idMap = new Map<string, number>([['WS_1', 0x0000], ['DM_1', 0x0201], ['STR_1', 0x0202]]);
  writerFn(workingSetToWrite, {
    w: writer,
    idMap,
    resolve: (id) => idMap.get(id ?? '') ?? 0xffff,
    objectById: new Map(objects.map((objectToMap) => [objectToMap.id, objectToMap])),
    project: projectWith({ workingSet: workingSetToWrite, objects }),
  });
  return Array.from(writer.result(), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
