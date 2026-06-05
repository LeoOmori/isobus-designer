import type { ProjectState } from './types';

export const initialProject: ProjectState = {
  workingSet: {
    id: 'WS_1',
    objectId: '0x0001',
    name: 'Working Set 1',
    version: '1.0.0',
    language: 'en',
    activeDataMaskId: 'DM_1',
    activeSoftKeyMaskId: '',
    backgroundColor: '#f8fafc',
    selectable: true,
    visible: true,
  },
  activeMaskId: 'DM_1',
  nextNumber: 9,
  objects: [
    // ── Data Mask ─────────────────────────────────────────────────────────
    {
      id: 'DM_1', objectId: '0x0201', name: 'Data Mask 1', kind: 'data-mask',
      x: 0, y: 0, width: 480, height: 480,
      backgroundColor: '#ffffff', borderColor: '#dfe6f0',
      visible: true, locked: false, zIndex: 0,
      childObjectIds: ['STR_1', 'RECT_1', 'NUM_1'],
      softKeyMaskId: '', nextMaskId: '', previousMaskId: '',
    },

    // ── Attributes ────────────────────────────────────────────────────────
    {
      id: 'LA_1', objectId: '0x0202', name: 'Line Attribute 1', kind: 'line-attribute',
      x: 0, y: 0, width: 0, height: 0,
      backgroundColor: 'transparent', borderColor: 'transparent',
      visible: true, zIndex: 0,
      lineColor: 0, lineWidth: 2, lineArt: '0xFFFF',
    },
    {
      id: 'FA_1', objectId: '0x0203', name: 'Fill Attribute 1', kind: 'fill-attribute',
      x: 0, y: 0, width: 0, height: 0,
      backgroundColor: 'transparent', borderColor: 'transparent',
      visible: true, zIndex: 0,
      fillType: 2, fillColor: 15,
    },
    {
      id: 'FONT_1', objectId: '0x0204', name: 'Font Attribute 1', kind: 'font-attribute',
      x: 0, y: 0, width: 0, height: 0,
      backgroundColor: 'transparent', borderColor: 'transparent',
      visible: true, zIndex: 0,
      fontColor: 0, proportional: true, fontWidth: 16, fontHeight: 24, fontSize: 24, fontType: 1, fontStyle: 0,
    },
    {
      id: 'SV_1', objectId: '0x0205', name: 'String Variable 1', kind: 'string-variable',
      x: 0, y: 0, width: 0, height: 0,
      backgroundColor: 'transparent', borderColor: 'transparent',
      visible: true, zIndex: 0,
      stringValue: 'Dynamic text', maxLength: 128,
    },
    {
      id: 'NV_1', objectId: '0x0206', name: 'Number Variable 1', kind: 'number-variable',
      x: 0, y: 0, width: 0, height: 0,
      backgroundColor: 'transparent', borderColor: 'transparent',
      visible: true, zIndex: 0,
      value: 0, unit: 'rpm',
    },

    // ── Canvas objects ────────────────────────────────────────────────────
    {
      id: 'STR_1', objectId: '0x0207', name: 'Output String: Title', kind: 'output-string',
      x: 52, y: 48, width: 360, height: 50,
      backgroundColor: 'transparent', borderColor: 'transparent',
      visible: true, zIndex: 1,
      text: 'Sprayer Control', fontSize: 30,
      fontAttributeId: 'FONT_1', stringVariableId: '',
      horizontalAlign: 'left', verticalAlign: 'center',
      outputOptions: 0,
    },
    {
      id: 'RECT_1', objectId: '0x0208', name: 'Output Rectangle 1', kind: 'output-rectangle',
      x: 280, y: 120, width: 160, height: 120,
      backgroundColor: '#ffffff', borderColor: '#dfe6f0',
      visible: true, hidden: false, zIndex: 2,
      lineAttributeId: 'LA_1', fillAttributeId: 'FA_1', lineSuppression: 0,
    },
    {
      id: 'NUM_1', objectId: '0x0209', name: 'Output Number 1', kind: 'output-number',
      x: 52, y: 120, width: 200, height: 42,
      backgroundColor: 'transparent', borderColor: 'transparent',
      visible: true, zIndex: 3,
      fontAttributeId: 'FONT_1', numberVariableId: 'NV_1',
      offset: 0, scale: 1, numberOfDecimals: 0, numberFormat: 0,
      value: 0, outputOptions: 0,
    },
  ],
};
