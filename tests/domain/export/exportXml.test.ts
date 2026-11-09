import { describe, expect, it } from 'vitest';
import { initialProject } from '../../../src/domain/initialProject';
import { createEditorObject } from '../../../src/domain/objectFactory';
import type { EditorObject, ObjectKind, ProjectState } from '../../../src/domain/types';
import { exportXml } from '../../../src/domain/export/xml/exportXml';
import { crc32, zipStore } from '../../../src/domain/export/xml/zip';
import { pictureGraphicToBmp } from '../../../src/domain/export/xml/bmp';

/** Builds the pool from isobus_vt_test/pool/working_set_1.xml. */
function buildTestPool() {
  let project: ProjectState = structuredClone(initialProject);
  const add = (kind: ObjectKind, patch: Partial<EditorObject>, parentId = '') => {
    const obj = { ...createEditorObject(kind, project, 0, 0, parentId), ...patch };
    project = { ...project, objects: [...project.objects, obj], nextNumber: project.nextNumber + 1 };
    return obj;
  };
  const font = (name: string, objectId: string, fontColor: number, fontWidth: number, fontHeight: number) =>
    add('font-attribute', { name, objectId, fontColor, fontWidth, fontHeight, fontType: 1, fontStyle: 0 });

  const fontTitle = font('fontTitle', '0x59D8', 0, 16, 24);
  const fontHidden = font('fontHidden', '0x59DA', 1, 16, 24);
  const fontButton = font('font Button', '0x59DC', 0, 16, 16);
  const line = add('line-attribute', { name: 'lineFrame', objectId: '0x5DC0', lineColor: 0, lineWidth: 1, lineArt: '0xFFFF' });

  const mask = add('data-mask', { name: 'mainMask', objectId: '0x03E8', backgroundColorIndex: 1, childObjectIds: [] });
  const rect = add('output-rectangle', { name: 'frame', objectId: '0x36B0', x: 76, y: 66, width: 322, height: 75, lineAttributeId: line.id, fillAttributeId: null, zIndex: 1 }, mask.id);
  const title = add('output-string', { name: 'titleText', objectId: '0x2AF8', x: 145, y: 86, width: 177, height: 34, fontAttributeId: fontTitle.id, text: 'TEST & <ISOBUS>', length: 32, horizontalJustification: 1, verticalJustification: 1, zIndex: 2 }, mask.id);
  const box = add('container', { name: 'hiddenBox', objectId: '0x0BB8', x: 313, y: 207, width: 80, height: 30, hidden: false, childObjectIds: [], zIndex: 3 }, mask.id);
  const hidden = add('output-string', { name: 'hiddenText', objectId: '0x2AF9', x: 0, y: 0, width: 80, height: 30, backgroundColorIndex: 12, fontAttributeId: fontHidden.id, text: 'Hidden', length: 32 }, box.id);
  const button = add('button', { name: 'colourButton', objectId: '0x1770', x: 74, y: 281, width: 92, height: 36, keyCode: 254, childObjectIds: [], zIndex: 4 }, mask.id);
  const label = add('output-string', { name: 'buttonText', objectId: '0x2AFA', x: 5, y: 0, width: 75, height: 27, fontAttributeId: fontButton.id, text: 'button', length: 20 }, button.id);

  const patch = (id: string, p: Partial<EditorObject>) => {
    project = { ...project, objects: project.objects.map((o) => (o.id === id ? { ...o, ...p } : o)) };
  };
  patch(mask.id, { childObjectIds: [rect.id, title.id, box.id, button.id] });
  patch(box.id, { childObjectIds: [hidden.id] });
  patch(button.id, { childObjectIds: [label.id] });
  project = { ...project, activeMaskId: mask.id, workingSet: {
    ...project.workingSet, name: 'WS1', activeDataMaskId: mask.id, backgroundColor: '#ffffff',
    // The title is also the WS designator: written there first, so the mask gets an include_object.
    designatorObjects: [{ objectId: title.id, x: 0, y: 0 }],
  } };
  return { project, button };
}

const decode = (data: Uint8Array) => new TextDecoder().decode(data);

describe('exportXml (vt2iso)', () => {
  it('writes the vt2iso project files for the test pool', () => {
    const { project } = buildTestPool();
    const { files, errors } = exportXml(project);
    expect(errors).toEqual([]);
    expect(files.map((f) => f.path)).toEqual(['WS1.xml', 'WS1.vtp']);

    const xml = decode(files[0].data);
    expect(xml).toContain('<workingset id="0" name="WS1" background_colour="1" selectable="yes" active_mask="mainMask">');
    expect(xml).toContain('<datamask id="1000" name="mainMask" background_colour="1">');
    expect(xml).toContain('<rectangle id="14000" name="frame" pos_x="76" pos_y="66" line_attributes="lineFrame" width="322" height="75" line_suppression="none"/>');
    expect(xml).toContain('name="titleText" pos_x="0" pos_y="0"');
    expect(xml).toContain('horizontal_justification="middle" vertical_justification="middle" length="32" value="TEST &amp; &lt;ISOBUS&gt;"');
    expect(xml).toContain('<button id="6000" name="colourButton" pos_x="74" pos_y="281" width="92" height="36" background_colour="1" border_colour="0" key_code="254" options="none">');
    expect(xml).toContain('<include_object name="titleText" pos_x="145" pos_y="86"/>');
    expect(xml).toContain('<fontattributes id="23000" name="fontTitle" font_colour="0" font_size="24x32" font_type="1" font_style="none"/>');
    expect(xml).toContain('name="font_Button"');
    expect(xml).toContain('<lineattributes id="24000" name="lineFrame" line_colour="0" line_width="1" line_art="1111111111111111"/>');
    // Children nest under their parent; attributes stay at the top level.
    expect(xml.indexOf('name="buttonText"')).toBeGreaterThan(xml.indexOf('name="colourButton"'));
    expect(xml).toMatch(/\n {2}<fontattributes/);

    const vtp = decode(files[1].data);
    expect(vtp).toContain('<Meta ProjectName="WS1"/>');
    expect(vtp).toContain('<iso11783 version="3"/>');
    expect(vtp).toContain('<File FilePath="WS1.xml" RelativePath="1"/>');
  });

  it('rejects key code 0, which vt2iso does not accept', () => {
    const { project, button } = buildTestPool();
    const bad = { ...project, objects: project.objects.map((o) => (o.id === button.id ? { ...o, keyCode: 0 } : o)) };
    expect(exportXml(bad).errors).toEqual([`XML export: ${button.id} key code 0 must be 1–255 for vt2iso`]);
  });
});

describe('zipStore', () => {
  it('computes the standard CRC-32', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });

  it('writes local headers, data and an end-of-directory record', () => {
    const zip = zipStore([{ path: 'a.txt', data: new TextEncoder().encode('hi') }]);
    const view = new DataView(zip.buffer);
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    expect(decode(zip.slice(30, 35))).toBe('a.txt');
    expect(decode(zip.slice(35, 37))).toBe('hi');
    expect(view.getUint32(zip.length - 22, true)).toBe(0x06054b50);
    expect(view.getUint16(zip.length - 12, true)).toBe(1);
  });
});

describe('pictureGraphicToBmp', () => {
  it('writes palette indices bottom-up with the VT palette and 4-byte row padding', () => {
    const bmp = pictureGraphicToBmp({ actualWidth: 2, actualHeight: 2, graphicFormat: 1, rawData: [0xc1, 0x30] } as EditorObject);
    const view = new DataView(bmp.buffer);
    expect(decode(bmp.slice(0, 2))).toBe('BM');
    expect(view.getUint16(28, true)).toBe(8);
    expect(Array.from(bmp.slice(54 + 12 * 4, 54 + 13 * 4))).toEqual([0, 0, 255, 0]); // palette[12] = red (BGR0)
    expect(Array.from(bmp.slice(1078))).toEqual([3, 0, 0, 0, 12, 1, 0, 0]); // bottom row first
  });
});
