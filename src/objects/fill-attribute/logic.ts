import { Grid3X3 } from 'lucide-react';
import type { EditorObject, ProjectState } from '../../domain/types';
import { writeFillAttributes } from '../../domain/export/writers/fillAttributes';
import { createReferenceBase } from '../createHelpers';
import type { CreateObjectContext, ObjectLookup, ObjectMeta, ObjectModule } from '../ObjectModule';

export const fillAttributeMeta = {
  name: 'Fill Attribute', Icon: Grid3X3, category: 'attribute', isReference: true, hasLayout: false,
} satisfies ObjectMeta;

export function createDefaultFillAttribute({ current }: CreateObjectContext): EditorObject {
  return {
    ...createReferenceBase('fill-attribute', fillAttributeMeta.name, current),
    fillType: 2,
    fillColor: 15,
  };
}

export function validateFillAttribute(obj: EditorObject, _project: ProjectState, _lookup: ObjectLookup): string[] {
  if (obj.fillType === 3 && !obj.fillPattern) {
    return [`Fill Attribute ${obj.id}: fillType=3 (pattern) requires a fillPattern reference`];
  }
  return [];
}

export const fillAttributeModule = {
  kind: 'fill-attribute',
  meta: fillAttributeMeta,
  exportOrder: 2,
  writer: writeFillAttributes,
  createDefault: createDefaultFillAttribute,
  validate: validateFillAttribute,
} satisfies ObjectModule<'fill-attribute'>;
