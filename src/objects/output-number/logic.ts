import { Hash } from 'lucide-react';
import {
  OUTPUT_NUMBER_OPTION_LEADING_ZEROS,
  OUTPUT_NUMBER_OPTION_TRANSPARENT,
  OUTPUT_NUMBER_OPTION_TRUNCATE,
  OUTPUT_NUMBER_OPTION_ZERO_AS_BLANK,
  asHorizontalJustification,
  asVerticalJustification,
  nearestVtColorIndex,
} from '../../domain/isobus';
import type { EditorObject, ProjectState } from '../../domain/types';
import { writeOutputNumber } from '../../domain/export/writers/outputNumber';
import { createCanvasBase } from '../createHelpers';
import type { CreateObjectContext, ObjectLookup, ObjectMeta, ObjectModule } from '../ObjectModule';

export const outputNumberMeta = {
  name: 'Output Number', Icon: Hash, category: 'output', isReference: false, hasLayout: true,
} satisfies ObjectMeta;

const OUTPUT_NUMBER_OPTION_MASK = OUTPUT_NUMBER_OPTION_TRANSPARENT
  | OUTPUT_NUMBER_OPTION_LEADING_ZEROS
  | OUTPUT_NUMBER_OPTION_ZERO_AS_BLANK
  | OUTPUT_NUMBER_OPTION_TRUNCATE;

export function createDefaultOutputNumber({ current, x, y, parentId }: CreateObjectContext): EditorObject {
  const defaultFont = current.objects.find((object) => object.kind === 'font-attribute');
  return {
    ...createCanvasBase('output-number', outputNumberMeta.name, current, x, y, parentId, 80, 30),
    fontAttributeId: defaultFont?.id ?? '',
    variableReference: null,
    numberVariableId: undefined,
    outputOptions: 0,
    horizontalJustification: 0,
    verticalJustification: 0,
    offset: 0,
    scale: 1,
    numberOfDecimals: 0,
    numberFormat: 0,
    value: 0,
  };
}

export function migrateOutputNumber(object: EditorObject): EditorObject {
  const outputOptions = object.backgroundColor === 'transparent'
    ? (object.outputOptions ?? 0) | OUTPUT_NUMBER_OPTION_TRANSPARENT
    : object.outputOptions ?? 0;
  const variableReference = object.variableReference !== undefined
    ? object.variableReference
    : object.numberVariableId ? object.numberVariableId : null;

  return {
    ...object,
    backgroundColorIndex: object.backgroundColorIndex ?? backgroundColorToIndex(object.backgroundColor),
    variableReference,
    numberVariableId: undefined,
    outputOptions,
    horizontalJustification: object.horizontalJustification ?? horizontalAlignToJustification(object.horizontalAlign),
    verticalJustification: object.verticalJustification ?? verticalAlignToJustification(object.verticalAlign),
    horizontalAlign: undefined,
    verticalAlign: undefined,
  };
}

export function validateOutputNumber(obj: EditorObject, _project: ProjectState, { objectById }: ObjectLookup): string[] {
  const errors: string[] = [];
  const options = obj.outputOptions ?? 0;
  const variableReference = obj.variableReference !== undefined ? obj.variableReference : obj.numberVariableId || null;
  const variable = variableReference ? objectById.get(variableReference) : undefined;
  const decimals = obj.numberOfDecimals ?? 0;
  const format = obj.numberFormat ?? 0;
  const value = obj.value ?? 0;
  const offset = obj.offset ?? 0;
  const scale = obj.scale ?? 1;

  if (!obj.fontAttributeId) errors.push(`Output Number ${obj.id}: fontAttributeId is required`);
  else if (objectById.get(obj.fontAttributeId)?.kind !== 'font-attribute') errors.push(`Output Number ${obj.id}: unknown fontAttributeId "${obj.fontAttributeId}"`);
  if (!Number.isInteger(obj.width) || obj.width <= 0 || obj.width > 0xffff || !Number.isInteger(obj.height) || obj.height <= 0 || obj.height > 0xffff) errors.push(`Output Number ${obj.id}: width/height must fit uint16`);
  if (!Number.isInteger(obj.backgroundColorIndex ?? 0) || (obj.backgroundColorIndex ?? 0) < 0 || (obj.backgroundColorIndex ?? 0) > 255) errors.push(`Output Number ${obj.id}: backgroundColorIndex must be 0–255`);
  if (!Number.isInteger(options) || options < 0 || options > 0xff) errors.push(`Output Number ${obj.id}: outputOptions must be 0–255`);
  else if (options & ~OUTPUT_NUMBER_OPTION_MASK) errors.push(`Output Number ${obj.id}: outputOptions contains unknown bits`);
  if (variableReference && variable?.kind !== 'number-variable') errors.push(`Output Number ${obj.id}: unknown variableReference "${variableReference}"`);
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) errors.push(`Output Number ${obj.id}: value must fit uint32`);
  if (!Number.isInteger(offset) || offset < -0x80000000 || offset > 0x7fffffff) errors.push(`Output Number ${obj.id}: offset must fit int32`);
  if (!Number.isFinite(scale)) errors.push(`Output Number ${obj.id}: scale must be a finite number`);
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 7) errors.push(`Output Number ${obj.id}: numberOfDecimals must be 0–7`);
  if (format !== 0 && format !== 1) errors.push(`Output Number ${obj.id}: numberFormat must be 0 (fixed decimal) or 1 (exponential)`);
  if (![0, 1, 2].includes(obj.horizontalJustification ?? -1)) errors.push(`Output Number ${obj.id}: invalid horizontal justification`);
  if (![0, 1, 2].includes(obj.verticalJustification ?? -1)) errors.push(`Output Number ${obj.id}: invalid vertical justification`);

  return errors;
}

export const outputNumberModule = {
  kind: 'output-number',
  meta: outputNumberMeta,
  exportOrder: 7,
  writer: writeOutputNumber,
  createDefault: createDefaultOutputNumber,
  migrate: migrateOutputNumber,
  validate: validateOutputNumber,
} satisfies ObjectModule<'output-number'>;

function backgroundColorToIndex(color: string | undefined) {
  if (!color || color === 'transparent') return 1;
  return nearestVtColorIndex(color);
}

function horizontalAlignToJustification(value: EditorObject['horizontalAlign']) {
  if (value === 'center') return asHorizontalJustification(1);
  if (value === 'right') return asHorizontalJustification(2);
  return asHorizontalJustification(0);
}

function verticalAlignToJustification(value: EditorObject['verticalAlign']) {
  if (value === 'center') return asVerticalJustification(1);
  if (value === 'bottom') return asVerticalJustification(2);
  return asVerticalJustification(0);
}
