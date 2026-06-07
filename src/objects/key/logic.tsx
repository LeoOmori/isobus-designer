import { KeyRound } from 'lucide-react';
import type { ReactNode } from 'react';
import type { EditorObject, ProjectState } from '../../domain/types';
import { writeKey } from '../../domain/export/writers/key';
import { toObjectId } from '../createHelpers';
import type { CreateObjectContext, ObjectLookup, ObjectMeta, ObjectModule } from '../ObjectModule';

export const KEY_CHILD_KINDS = new Set<EditorObject['kind']>(['output-string', 'output-number', 'output-rectangle', 'picture-graphic', 'container']);

export const keyMeta = {
  name: 'Key', Icon: KeyRound, category: 'input', isReference: false, hasLayout: false,
} satisfies ObjectMeta;

export function createDefaultKey({ current }: CreateObjectContext): EditorObject {
  const n = current.nextNumber;
  return {
    id: `KEY_${n}`,
    objectId: toObjectId(n),
    name: `Key ${n}`,
    kind: 'key',
    visible: true,
    zIndex: current.objects.length + 1,
    x: 0,
    y: 0,
    width: 60,
    height: 60,
    backgroundColor: 'transparent',
    backgroundColorIndex: 1,
    borderColor: '#dfe6f0',
    childObjectIds: [],
    label: 'Key',
    actionName: '',
    keyCode: 1,
  };
}

export function validateKey(obj: EditorObject, _project: ProjectState, { objectById }: ObjectLookup): string[] {
  const errors: string[] = [];
  const children = obj.childObjectIds ?? [];
  if (!Number.isInteger(obj.backgroundColorIndex ?? 1) || (obj.backgroundColorIndex ?? 1) < 0 || (obj.backgroundColorIndex ?? 1) > 255) errors.push(`Key ${obj.id}: backgroundColorIndex must be 0–255`);
  if (!Number.isInteger(obj.keyCode ?? 1) || (obj.keyCode ?? 1) < 1 || (obj.keyCode ?? 1) > 255) errors.push(`Key ${obj.id}: keyCode must be 1–255`);
  if (children.length > 0xff) errors.push(`Key ${obj.id}: child count must fit uint8`);
  if ((obj.macros ?? []).length > 0xff) errors.push(`Key ${obj.id}: macro count must fit uint8`);
  for (const childId of children) {
    const child = objectById.get(childId);
    if (!child || !KEY_CHILD_KINDS.has(child.kind)) {
      errors.push(`Key ${obj.id}: child "${childId}" must be Output String/Number/Rectangle, Picture Graphic, or Container`);
      continue;
    }
    if (child.parentId !== obj.id) errors.push(`Key ${obj.id}: child "${childId}" parentId must reference the Key`);
    if (!Number.isInteger(child.x) || child.x < -0x8000 || child.x > 0x7fff || !Number.isInteger(child.y) || child.y < -0x8000 || child.y > 0x7fff) errors.push(`Key ${obj.id}: child "${childId}" coordinates must fit int16`);
  }
  return errors;
}

export function validateKeyForExport(obj: EditorObject): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(obj.keyCode ?? 1) || (obj.keyCode ?? 1) < 1 || (obj.keyCode ?? 1) > 0xff) errors.push(`Export: Key ${obj.id} keyCode must be 1–255`);
  if ((obj.childObjectIds ?? []).length > 0xff) errors.push(`Export: Key ${obj.id} has more than 255 child objects`);
  return errors;
}

export function KeyContent({ children, clipDisabled }: { children: ReactNode; clipDisabled?: boolean }) {
  return <div className="key-child-clip" style={{ position: 'absolute', inset: 0, overflow: clipDisabled ? 'visible' : 'hidden' }}>{children}</div>;
}

export const keyModule = {
  kind: 'key',
  meta: keyMeta,
  exportOrder: 11,
  writer: writeKey,
  createDefault: createDefaultKey,
  validate: validateKey,
  validateExport: validateKeyForExport,
} satisfies ObjectModule<'key'>;
