import { Minus } from 'lucide-react';
import type { EditorObject, ProjectState } from '../../domain/types';
import { writeOutputLine } from '../../domain/export/writers/outputLine';
import { createCanvasBase } from '../createHelpers';
import type { CreateObjectContext, ObjectLookup, ObjectMeta, ObjectModule } from '../ObjectModule';

export const outputLineMeta = {
  name: 'Output Line',
  Icon: Minus,
  category: 'output',
  isReference: false,
  hasLayout: true,
} satisfies ObjectMeta;

export function createDefaultOutputLine({ current, x, y, parentId }: CreateObjectContext): EditorObject {
  const defaultLine = current.objects.find((object) => object.kind === 'line-attribute');
  return {
    ...createCanvasBase('output-line', outputLineMeta.name, current, x, y, parentId, 100, 40),
    lineAttributeId: defaultLine?.id ?? '',
    lineDirection: 0,
    macros: [],
  };
}

export function validateOutputLine(obj: EditorObject, _project: ProjectState, { objectById }: ObjectLookup): string[] {
  const errors: string[] = [];
  if (!obj.lineAttributeId) {
    errors.push(`Output Line ${obj.id}: lineAttributeId is required`);
  } else if (objectById.get(obj.lineAttributeId)?.kind !== 'line-attribute') {
    errors.push(`Output Line ${obj.id}: unknown lineAttributeId "${obj.lineAttributeId}"`);
  }
  if (!Number.isInteger(obj.width) || obj.width <= 0 || obj.width > 0xffff) {
    errors.push(`Output Line ${obj.id}: width must be 1–65535`);
  }
  if (!Number.isInteger(obj.height) || obj.height <= 0 || obj.height > 0xffff) {
    errors.push(`Output Line ${obj.id}: height must be 1–65535`);
  }
  const dir = obj.lineDirection ?? 0;
  if (dir !== 0 && dir !== 1) {
    errors.push(`Output Line ${obj.id}: lineDirection must be 0 or 1`);
  }
  return errors;
}

export const outputLineModule = {
  kind: 'output-line',
  meta: outputLineMeta,
  exportOrder: 7,
  writer: writeOutputLine,
  createDefault: createDefaultOutputLine,
  validate: validateOutputLine,
} satisfies ObjectModule<'output-line'>;
