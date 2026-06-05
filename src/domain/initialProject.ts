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
    visible: true,
  },
  activeMaskId: 'DM_1',
  nextNumber: 2,
  objects: [
    { id: 'DM_1', objectId: '0x0201', name: 'Data Mask 1', kind: 'data-mask', x: 0, y: 0, width: 800, height: 600, backgroundColor: '#ffffff', borderColor: '#dfe6f0', visible: true, locked: false, childObjectIds: ['STR_1', 'RECT_1'], softKeyMaskId: '', nextMaskId: '', previousMaskId: '', zIndex: 0 },
    { id: 'LA_1', objectId: '0x0601', name: 'Line Attribute 1', kind: 'line-attribute', x: 0, y: 0, width: 0, height: 0, backgroundColor: 'transparent', borderColor: 'transparent', visible: true, lineColor: 0, lineWidth: 2, lineArt: '0xFFFF', zIndex: 0 },
    { id: 'FA_1', objectId: '0x0701', name: 'Fill Attribute 1', kind: 'fill-attribute', x: 0, y: 0, width: 0, height: 0, backgroundColor: 'transparent', borderColor: 'transparent', visible: true, fillType: 'solid', fillColor: 15, zIndex: 0 },
    { id: 'FONT_1', objectId: '0x0801', name: 'Font Attribute 1', kind: 'font-attribute', x: 0, y: 0, width: 0, height: 0, backgroundColor: 'transparent', borderColor: 'transparent', visible: true, fontColor: 0, proportional: true, fontWidth: 16, fontHeight: 24, fontSize: 24, fontType: 1, fontStyle: 0, zIndex: 0 },
    { id: 'SV_1', objectId: '0x0901', name: 'String Variable 1', kind: 'string-variable', x: 0, y: 0, width: 0, height: 0, backgroundColor: 'transparent', borderColor: 'transparent', visible: true, stringValue: 'Dynamic text', zIndex: 0 },
    { id: 'STR_1', objectId: '0x0401', name: 'Output String: Title', kind: 'output-string', x: 52, y: 48, width: 360, height: 50, backgroundColor: 'transparent', borderColor: 'transparent', text: 'Sprayer Control', fontSize: 30, fontAttributeId: 'FONT_1', stringVariableId: '', horizontalAlign: 'left', verticalAlign: 'center', visible: true, zIndex: 1 },
    { id: 'RECT_1', objectId: '0x0501', name: 'Rectangle 1', kind: 'rectangle', x: 360, y: 138, width: 150, height: 122, backgroundColor: '#ffffff', borderColor: '#dfe6f0', visible: true, hidden: false, lineAttributeId: 'LA_1', fillAttributeId: 'FA_1', zIndex: 2 },
  ],
};
