import { Crosshair } from 'lucide-react';
import type { EditorObject, ObjectKind, ProjectState } from '../../domain/types';
import { writeObjectPointer } from '../../domain/export/writers/objectPointer';
import { createCanvasBase } from '../createHelpers';
import type { CreateObjectContext, ObjectLookup, ObjectMeta, ObjectModule } from '../ObjectModule';

const ALLOWED_TARGET_KINDS = new Set<ObjectKind>([
  'container', 'button', 'output-string', 'output-number', 'output-rectangle',
  'output-line', 'output-ellipse', 'picture-graphic', 'key',
]);

const DATA_MASK_VALID_TARGETS = new Set<ObjectKind>([
  'container', 'button', 'output-string', 'output-number', 'output-rectangle',
  'output-line', 'output-ellipse', 'picture-graphic',
]);

const KEY_VALID_TARGETS = new Set<ObjectKind>([
  'container', 'output-string', 'output-number', 'output-rectangle', 'picture-graphic',
]);

const BUTTON_VALID_TARGETS = new Set<ObjectKind>([
  'output-string', 'output-number', 'output-rectangle', 'picture-graphic',
]);

export const objectPointerMeta = {
  name: 'Object Pointer', Icon: Crosshair, category: 'output', isReference: false, hasLayout: true,
} satisfies ObjectMeta;

export function createDefaultObjectPointer({ current, x, y, parentId }: CreateObjectContext): EditorObject {
  return {
    ...createCanvasBase('object-pointer', objectPointerMeta.name, current, x, y, parentId, 20, 20),
    pointerValue: null,
  };
}

function validTargetsForParent(parentKind: ObjectKind | undefined): Set<ObjectKind> {
  switch (parentKind) {
    case 'soft-key-mask': return new Set<ObjectKind>(['key']);
    case 'key':           return KEY_VALID_TARGETS;
    case 'button':        return BUTTON_VALID_TARGETS;
    default:              return DATA_MASK_VALID_TARGETS;
  }
}

export function validateObjectPointer(obj: EditorObject, project: ProjectState, lookup: ObjectLookup): string[] {
  const errors: string[] = [];

  if (obj.pointerValue === null || obj.pointerValue === undefined) return errors;

  const target = lookup.objectById.get(obj.pointerValue);
  if (!target) {
    errors.push(`Object Pointer ${obj.id}: referenced object ${obj.pointerValue} not found`);
    return errors;
  }

  if (obj.pointerValue === obj.id) {
    errors.push(`Object Pointer ${obj.id}: cannot point to itself`);
  }

  if (!ALLOWED_TARGET_KINDS.has(target.kind)) {
    errors.push(`Object Pointer ${obj.id}: cannot point to ${target.kind} — allowed: Container, Button, Output String/Number/Rectangle/Line/Ellipse, Picture Graphic, Key`);
    return errors;
  }

  const parent = obj.parentId ? lookup.objectById.get(obj.parentId) : undefined;
  const valid = validTargetsForParent(parent?.kind);
  if (!valid.has(target.kind)) {
    const ctx = parent ? ` inside a ${parent.kind}` : '';
    errors.push(`Object Pointer ${obj.id}: ${target.kind} is not a valid target${ctx} — allowed: ${[...valid].map((k) => k.replace('-', ' ')).join(', ')}`);
  }

  return errors;
}

export const objectPointerModule = {
  kind: 'object-pointer',
  meta: objectPointerMeta,
  exportOrder: 5,
  writer: writeObjectPointer,
  createDefault: createDefaultObjectPointer,
  validate: validateObjectPointer,
} satisfies ObjectModule<'object-pointer'>;
