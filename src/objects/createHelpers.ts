import type { EditorObject, ObjectKind, ProjectState } from '../domain/types';
import { clamp } from '../domain/isobus';

const KIND_PREFIX: Record<ObjectKind, string> = {
  'data-mask':        'DM',
  'alarm-mask':       'AM',
  'container':        'CT',
  'soft-key-mask':    'SKM',
  'key':              'KEY',
  'button':           'BTN',
  'input-boolean':    'IB',
  'input-string':     'IS',
  'input-number':     'IN',
  'input-list':       'IL',
  'output-string':    'STR',
  'output-number':    'NUM',
  'output-line':      'OL',
  'output-polygon':    'POLY',
  'output-ellipse':   'OE',
  'output-rectangle': 'RECT',
  'output-meter':    'OM',
  'picture-graphic':  'PIC',
  'font-attribute':   'FONT',
  'line-attribute':   'LA',
  'fill-attribute':   'FA',
  'string-variable':  'SV',
  'number-variable':  'NV',
};

export function toObjectId(n: number) {
  return `0x${(0x200 + n).toString(16).padStart(4, '0').toUpperCase()}`;
}

export function createReferenceBase(kind: ObjectKind, name: string, current: ProjectState): EditorObject {
  const n = current.nextNumber;
  return {
    id: `${KIND_PREFIX[kind]}_${n}`,
    objectId: toObjectId(n),
    name: `${name} ${n}`,
    kind,
    visible: true,
    zIndex: current.objects.length + 1,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  };
}

export function activeParent(current: ProjectState, parentId: string) {
  return current.objects.find((object) => object.id === parentId)
    ?? current.objects.find((object) => object.id === current.activeMaskId)
    ?? { id: '', kind: 'data-mask', x: 0, y: 0, width: 480, height: 480 } as Pick<EditorObject, 'id' | 'kind' | 'x' | 'y' | 'width' | 'height'>;
}

export function createCanvasBase(kind: ObjectKind, name: string, current: ProjectState, x: number, y: number, parentId: string, width: number, height: number): EditorObject {
  const n = current.nextNumber;
  const parent = activeParent(current, parentId);
  const isNestedParent = parent.kind === 'button' || parent.kind === 'container' || parent.kind === 'key';

  return {
    id: `${KIND_PREFIX[kind]}_${n}`,
    objectId: toObjectId(n),
    name: `${name} ${n}`,
    kind,
    parentId: parent.id || undefined,
    visible: true,
    zIndex: current.objects.length + 1,
    x: isNestedParent ? x : clamp(x, 0, parent.width - 40),
    y: isNestedParent ? y : clamp(y, 0, parent.height - 30),
    width,
    height,
    backgroundColor: '#ffffff',
    backgroundColorIndex: 1,
    borderColor: '#dfe6f0',
  };
}
