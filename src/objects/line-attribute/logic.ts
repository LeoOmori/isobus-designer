import { PenLine } from 'lucide-react';
import type { EditorObject } from '../../domain/types';
import { writeLineAttributes } from '../../domain/export/writers/lineAttributes';
import { createReferenceBase } from '../createHelpers';
import type { CreateObjectContext, ObjectMeta, ObjectModule } from '../ObjectModule';

export const lineAttributeMeta = {
  name: 'Line Attribute', Icon: PenLine, category: 'attribute', isReference: true, hasLayout: false,
} satisfies ObjectMeta;

export function createDefaultLineAttribute({ current }: CreateObjectContext): EditorObject {
  return {
    ...createReferenceBase('line-attribute', lineAttributeMeta.name, current),
    lineColor: 0,
    lineWidth: 1,
    lineArt: '0xFFFF',
  };
}

export const lineAttributeModule = {
  kind: 'line-attribute',
  meta: lineAttributeMeta,
  exportOrder: 1,
  writer: writeLineAttributes,
  createDefault: createDefaultLineAttribute,
} satisfies ObjectModule<'line-attribute'>;
