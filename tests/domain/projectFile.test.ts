import { describe, expect, it } from 'vitest';
import { initialProject } from '../../src/domain/initialProject';
import { createEditorObject } from '../../src/domain/objectFactory';
import { parseProjectFile, serializeProject } from '../../src/domain/projectFile';

describe('project file', () => {
  it('round-trips a project through save and open', () => {
    const mask = createEditorObject('data-mask', initialProject);
    const project = { ...initialProject, objects: [mask], activeMaskId: mask.id };
    expect(parseProjectFile(serializeProject(project))).toEqual(project);
  });

  it('fills fields missing from older files and migrates objects', () => {
    const legacy = { ...createEditorObject('data-mask', initialProject), backgroundColorIndex: undefined, backgroundColor: '#ff0000' };
    const opened = parseProjectFile(JSON.stringify({ workingSet: { id: 'WS_1', name: 'Old' }, objects: [legacy] }));
    expect(opened.workingSet).toMatchObject({ name: 'Old', vtVersion: 3, designatorObjects: [] });
    expect(opened.nextNumber).toBe(1);
    expect(opened.objects[0].backgroundColorIndex).toBe(12);
  });

  it('rejects files that are not projects', () => {
    expect(() => parseProjectFile('nope')).toThrow('not valid JSON');
    expect(() => parseProjectFile('{"objects": []}')).toThrow('missing workingSet or objects');
    expect(() => parseProjectFile('{"workingSet": {}, "objects": [{"id": "X", "kind": "bogus"}]}')).toThrow('unknown kind "bogus"');
  });
});
