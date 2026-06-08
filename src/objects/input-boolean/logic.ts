import { ToggleLeft } from 'lucide-react';
import type { EditorObject, ProjectState } from '../../domain/types';
import { writeInputBoolean } from '../../domain/export/writers/inputBoolean';
import { createCanvasBase } from '../createHelpers';
import type { CreateObjectContext, ObjectLookup, ObjectMeta, ObjectModule } from '../ObjectModule';

export const inputBooleanMeta = {
  name: 'Input Boolean',
  Icon: ToggleLeft,
  category: 'input',
  isReference: false,
  hasLayout: true,
} satisfies ObjectMeta;

export function createDefaultInputBoolean({ current, x, y, parentId }: CreateObjectContext): EditorObject {
  const defaultFont = current.objects.find((object) => object.kind === 'font-attribute');
  return {
    ...createCanvasBase('input-boolean', inputBooleanMeta.name, current, x, y, parentId, 40, 40),
    fontAttributeId: defaultFont?.id ?? '',
    variableReference: null,
    value: 0,
    inputEnabled: true,
    macros: [],
  };
}

export function validateInputBoolean(obj: EditorObject, _project: ProjectState, { objectById }: ObjectLookup): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(obj.width) || obj.width <= 0 || obj.width > 0xffff) {
    errors.push(`Input Boolean ${obj.id}: width must be 1–65535`);
  }
  const bgIndex = obj.backgroundColorIndex ?? 1;
  if (!Number.isInteger(bgIndex) || bgIndex < 0 || bgIndex > 255) {
    errors.push(`Input Boolean ${obj.id}: backgroundColorIndex must be 0–255`);
  }
  if (obj.fontAttributeId && objectById.get(obj.fontAttributeId)?.kind !== 'font-attribute') {
    errors.push(`Input Boolean ${obj.id}: unknown fontAttributeId "${obj.fontAttributeId}"`);
  }
  if (obj.variableReference && objectById.get(obj.variableReference)?.kind !== 'number-variable') {
    errors.push(`Input Boolean ${obj.id}: unknown variableReference "${obj.variableReference}"`);
  }
  const value = obj.value ?? 0;
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    errors.push(`Input Boolean ${obj.id}: value must be 0–255 (uint8)`);
  }
  return errors;
}

export const inputBooleanModule = {
  kind: 'input-boolean',
  meta: inputBooleanMeta,
  exportOrder: 9,
  writer: writeInputBoolean,
  createDefault: createDefaultInputBoolean,
  validate: validateInputBoolean,
} satisfies ObjectModule<'input-boolean'>;
