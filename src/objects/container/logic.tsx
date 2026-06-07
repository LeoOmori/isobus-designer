import { Grid3X3 } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import type { EditorObject, ProjectState } from '../../domain/types';
import { writeContainer } from '../../domain/export/writers/container';
import { createCanvasBase } from '../createHelpers';
import type { CreateObjectContext, ObjectLookup, ObjectMeta, ObjectModule } from '../ObjectModule';

export const CONTAINER_CHILD_KINDS = new Set<EditorObject['kind']>([
  'container', 'output-string', 'output-number', 'output-rectangle', 'picture-graphic', 'button',
]);

export const containerMeta = {
  name: 'Container', Icon: Grid3X3, category: 'group', isReference: false, hasLayout: true,
} satisfies ObjectMeta;

export function createDefaultContainer({ current, x, y, parentId }: CreateObjectContext): EditorObject {
  return {
    ...createCanvasBase('container', containerMeta.name, current, x, y, parentId, 200, 200),
    locked: false,
    childObjectIds: [],
    hidden: false,
  };
}

export function validateContainer(obj: EditorObject, _project: ProjectState, { objectById }: ObjectLookup): string[] {
  const errors: string[] = [];
  if (typeof (obj.hidden ?? false) !== 'boolean') errors.push(`Container ${obj.id}: hidden must be boolean`);
  if (!Number.isInteger(obj.width) || obj.width <= 0 || obj.width > 0xffff || !Number.isInteger(obj.height) || obj.height <= 0 || obj.height > 0xffff) errors.push(`Container ${obj.id}: width/height must fit uint16`);
  if ((obj.childObjectIds ?? []).length > 0xff) errors.push(`Container ${obj.id}: child count must fit uint8`);
  if ((obj.macros ?? []).length > 0xff) errors.push(`Container ${obj.id}: macro count must fit uint8`);
  if (containsDescendant(obj.id, obj.id, objectById, new Set())) errors.push(`Container ${obj.id}: contains itself through childObjectIds`);

  for (const childId of obj.childObjectIds ?? []) {
    const child = objectById.get(childId);
    if (!child || !CONTAINER_CHILD_KINDS.has(child.kind)) {
      errors.push(`Container ${obj.id}: child "${childId}" must be Container/Button/Output String/Number/Rectangle or Picture Graphic`);
      continue;
    }
    if (child.parentId !== obj.id) errors.push(`Container ${obj.id}: child "${childId}" parentId must reference the Container`);
    if (!Number.isInteger(child.x) || child.x < -0x8000 || child.x > 0x7fff || !Number.isInteger(child.y) || child.y < -0x8000 || child.y > 0x7fff) errors.push(`Container ${obj.id}: child "${childId}" coordinates must fit int16`);
  }

  return errors;
}

export function containerFrameStyle(): CSSProperties {
  return { borderColor: 'transparent', borderWidth: 0, borderStyle: 'solid', background: 'transparent', boxSizing: 'border-box' };
}

export function ContainerContent({ object, children }: { object: EditorObject; children: ReactNode }) {
  return (
    <>
      <div className="container-label">{object.name}</div>
      <div className="container-clip" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {children}
      </div>
    </>
  );
}

export const containerModule = {
  kind: 'container',
  meta: containerMeta,
  exportOrder: 9,
  writer: writeContainer,
  createDefault: createDefaultContainer,
  validate: validateContainer,
} satisfies ObjectModule<'container'>;

function containsDescendant(rootId: string, currentId: string, objectById: Map<string, { childObjectIds?: string[] }>, visited: Set<string>) {
  if (visited.has(currentId)) return false;
  visited.add(currentId);
  const current = objectById.get(currentId);
  for (const childId of current?.childObjectIds ?? []) {
    if (childId === rootId) return true;
    if (containsDescendant(rootId, childId, objectById, visited)) return true;
  }
  return false;
}
