import { Hash } from 'lucide-react';
import type { EditorObject, ProjectState } from '../../domain/types';
import { writeInputNumber } from '../../domain/export/writers/inputNumber';
import { createCanvasBase } from '../createHelpers';
import type { CreateObjectContext, ObjectLookup, ObjectMeta, ObjectModule } from '../ObjectModule';
import { asHorizontalJustification, asVerticalJustification } from '../../domain/isobus';

export const inputNumberMeta = {
  name: 'Input Number',
  Icon: Hash,
  category: 'input',
  isReference: false,
  hasLayout: true,
} satisfies ObjectMeta;

export function createDefaultInputNumber({ current, x, y, parentId }: CreateObjectContext): EditorObject {
  const defaultFont = current.objects.find((o) => o.kind === 'font-attribute');
  return {
    ...createCanvasBase('input-number', inputNumberMeta.name, current, x, y, parentId, 80, 30),
    fontAttributeId: defaultFont?.id ?? '',
    variableReference: null,
    outputOptions: 0,
    horizontalJustification: asHorizontalJustification(0),
    verticalJustification: asVerticalJustification(0),
    value: 0,
    minValue: 0,
    maxValue: 0xffffffff,
    offset: 0,
    scale: 1,
    numberOfDecimals: 0,
    numberFormat: 0,
    inputEnabled: true,
    realTimeEditing: false,
    macros: [],
  };
}

export function validateInputNumber(obj: EditorObject, _project: ProjectState, { objectById }: ObjectLookup): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(obj.width) || obj.width <= 0 || obj.width > 0xffff) {
    errors.push(`Input Number ${obj.id}: width must be 1–65535`);
  }
  if (!Number.isInteger(obj.height) || obj.height <= 0 || obj.height > 0xffff) {
    errors.push(`Input Number ${obj.id}: height must be 1–65535`);
  }
  const bgIndex = obj.backgroundColorIndex ?? 1;
  if (!Number.isInteger(bgIndex) || bgIndex < 0 || bgIndex > 255) {
    errors.push(`Input Number ${obj.id}: backgroundColorIndex must be 0–255`);
  }
  if (obj.fontAttributeId && objectById.get(obj.fontAttributeId)?.kind !== 'font-attribute') {
    errors.push(`Input Number ${obj.id}: unknown fontAttributeId "${obj.fontAttributeId}"`);
  }
  if (obj.variableReference && objectById.get(obj.variableReference)?.kind !== 'number-variable') {
    errors.push(`Input Number ${obj.id}: variableReference must point to a Number Variable`);
  }
  const value = obj.value ?? 0;
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
    errors.push(`Input Number ${obj.id}: value must fit uint32 (0–4294967295)`);
  }
  const minValue = obj.minValue ?? 0;
  if (!Number.isInteger(minValue) || minValue < 0 || minValue > 0xffffffff) {
    errors.push(`Input Number ${obj.id}: minValue must fit uint32`);
  }
  const maxValue = obj.maxValue ?? 0xffffffff;
  if (!Number.isInteger(maxValue) || maxValue < 0 || maxValue > 0xffffffff) {
    errors.push(`Input Number ${obj.id}: maxValue must fit uint32`);
  }
  const offset = obj.offset ?? 0;
  if (!Number.isInteger(offset) || offset < -0x80000000 || offset > 0x7fffffff) {
    errors.push(`Input Number ${obj.id}: offset must fit int32`);
  }
  if (!Number.isFinite(obj.scale ?? 1)) {
    errors.push(`Input Number ${obj.id}: scale must be finite`);
  }
  const decimals = obj.numberOfDecimals ?? 0;
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 7) {
    errors.push(`Input Number ${obj.id}: numberOfDecimals must be 0–7`);
  }
  return errors;
}

export const inputNumberModule = {
  kind: 'input-number',
  meta: inputNumberMeta,
  exportOrder: 10,
  writer: writeInputNumber,
  createDefault: createDefaultInputNumber,
  validate: validateInputNumber,
} satisfies ObjectModule<'input-number'>;
