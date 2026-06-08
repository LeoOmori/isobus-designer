import { TextCursorInput } from 'lucide-react';
import type { EditorObject, ProjectState } from '../../domain/types';
import { writeInputString } from '../../domain/export/writers/inputString';
import { createCanvasBase } from '../createHelpers';
import type { CreateObjectContext, ObjectLookup, ObjectMeta, ObjectModule } from '../ObjectModule';
import { asHorizontalJustification, asVerticalJustification } from '../../domain/isobus';

export const inputStringMeta = {
  name: 'Input String',
  Icon: TextCursorInput,
  category: 'input',
  isReference: false,
  hasLayout: true,
} satisfies ObjectMeta;

export function createDefaultInputString({ current, x, y, parentId }: CreateObjectContext): EditorObject {
  const defaultFont = current.objects.find((o) => o.kind === 'font-attribute');
  return {
    ...createCanvasBase('input-string', inputStringMeta.name, current, x, y, parentId, 80, 30),
    text: '',
    length: 16,
    fontAttributeId: defaultFont?.id ?? '',
    variableReference: null,
    outputOptions: 0,
    horizontalJustification: asHorizontalJustification(0),
    verticalJustification: asVerticalJustification(1),
    inputEnabled: true,
    macros: [],
  };
}

export function validateInputString(obj: EditorObject, _project: ProjectState, { objectById }: ObjectLookup): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(obj.width) || obj.width <= 0 || obj.width > 0xffff) {
    errors.push(`Input String ${obj.id}: width must be 1–65535`);
  }
  if (!Number.isInteger(obj.height) || obj.height <= 0 || obj.height > 0xffff) {
    errors.push(`Input String ${obj.id}: height must be 1–65535`);
  }
  const bgIndex = obj.backgroundColorIndex ?? 1;
  if (!Number.isInteger(bgIndex) || bgIndex < 0 || bgIndex > 255) {
    errors.push(`Input String ${obj.id}: backgroundColorIndex must be 0–255`);
  }
  const length = obj.length ?? 16;
  if (!Number.isInteger(length) || length < 0 || length > 255) {
    errors.push(`Input String ${obj.id}: length must be 0–255`);
  }
  if (obj.fontAttributeId && objectById.get(obj.fontAttributeId)?.kind !== 'font-attribute') {
    errors.push(`Input String ${obj.id}: unknown fontAttributeId "${obj.fontAttributeId}"`);
  }
  if (obj.variableReference && objectById.get(obj.variableReference)?.kind !== 'string-variable') {
    errors.push(`Input String ${obj.id}: variableReference must point to a String Variable`);
  }
  return errors;
}

export const inputStringModule = {
  kind: 'input-string',
  meta: inputStringMeta,
  exportOrder: 8,
  writer: writeInputString,
  createDefault: createDefaultInputString,
  validate: validateInputString,
} satisfies ObjectModule<'input-string'>;
