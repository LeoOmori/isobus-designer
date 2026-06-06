import type { ProjectState } from './types';

export const initialProject: ProjectState = {
  workingSet: {
    id: 'WS_1',
    objectId: '0x0001',
    name: 'Working Set 1',
    version: '1.0.0',
    language: 'en',
    activeDataMaskId: '',
    activeSoftKeyMaskId: '',
    backgroundColor: '#f8fafc',
    selectable: true,
    visible: true,
    designatorObjects: [],
  },
  activeMaskId: '',
  nextNumber: 1,
  objects: [],
};
