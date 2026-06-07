import type { EditorObject, ObjectKind, ProjectState } from '../domain/types';

const KIND_PREFIX: Record<ObjectKind, string> = {
  'data-mask':        'DM',
  'container':        'CT',
  'soft-key-mask':    'SKM',
  'key':              'KEY',
  'button':           'BTN',
  'output-string':    'STR',
  'output-number':    'NUM',
  'output-rectangle': 'RECT',
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
