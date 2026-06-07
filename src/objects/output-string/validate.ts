import {
  OUTPUT_STRING_OPTION_AUTO_WRAP,
  OUTPUT_STRING_OPTION_WRAP_ON_HYPHEN,
} from '../../domain/isobus';
import type { EditorObject, ProjectState } from '../../domain/types';
import type { ObjectLookup } from '../ObjectModule';

export function validateOutputString(obj: EditorObject, _project: ProjectState, { objectById }: ObjectLookup): string[] {
  const errors: string[] = [];

  if (!obj.fontAttributeId) {
    errors.push(`Output String ${obj.id}: fontAttributeId is required`);
  } else if (objectById.get(obj.fontAttributeId)?.kind !== 'font-attribute') {
    errors.push(`Output String ${obj.id}: unknown fontAttributeId "${obj.fontAttributeId}"`);
  }

  const length = obj.length ?? 0;
  const textByteLength = utf8ByteLength(obj.text ?? '');
  const options = obj.outputOptions ?? 0;
  const variableReference = obj.variableReference !== undefined ? obj.variableReference : obj.stringVariableId || null;
  const variable = variableReference ? objectById.get(variableReference) : undefined;

  if (!Number.isInteger(length) || length <= 0 || length > 0xffff) {
    errors.push(`Output String ${obj.id}: length must be 1–65535 bytes`);
  } else if (textByteLength > length) {
    errors.push(`Output String ${obj.id}: text is ${textByteLength} bytes but fixed length is ${length}`);
  }

  if (options & ~0b111) {
    errors.push(`Output String ${obj.id}: outputOptions contains unknown bits`);
  }
  if ((options & OUTPUT_STRING_OPTION_WRAP_ON_HYPHEN) && !(options & OUTPUT_STRING_OPTION_AUTO_WRAP)) {
    errors.push(`Output String ${obj.id}: wrap-on-hyphen requires auto-wrap`);
  }
  if (![0, 1, 2].includes(obj.horizontalJustification ?? -1)) {
    errors.push(`Output String ${obj.id}: invalid horizontal justification`);
  }
  if (![0, 1, 2].includes(obj.verticalJustification ?? -1)) {
    errors.push(`Output String ${obj.id}: invalid vertical justification`);
  }
  if (!Number.isInteger(obj.backgroundColorIndex ?? 0) || (obj.backgroundColorIndex ?? 0) < 0 || (obj.backgroundColorIndex ?? 0) > 255) {
    errors.push(`Output String ${obj.id}: backgroundColorIndex must be 0–255`);
  }
  if (variableReference && variable?.kind !== 'string-variable') {
    errors.push(`Output String ${obj.id}: unknown variableReference "${variableReference}"`);
  } else if (variable?.kind === 'string-variable') {
    const variableBytes = utf8ByteLength(variable.stringValue ?? '');
    if (length > 0 && variableBytes > length) {
      errors.push(`Output String ${obj.id}: referenced String Variable is ${variableBytes} bytes but fixed length is ${length}`);
    }
    if ((variable.maxLength ?? 0) > length) {
      errors.push(`Output String ${obj.id}: referenced String Variable maxLength ${variable.maxLength} exceeds fixed length ${length}`);
    }
  }

  return errors;
}

function utf8ByteLength(value: string) {
  return new TextEncoder().encode(value).length;
}
