import { List } from 'lucide-react';
import type { EditorObject, ProjectState } from '../../domain/types';
import { writeInputList } from '../../domain/export/writers/inputList';
import { createCanvasBase } from '../createHelpers';
import type { CreateObjectContext, ObjectLookup, ObjectMeta, ObjectModule } from '../ObjectModule';

export const inputListMeta = {
  name: 'Input List',
  Icon: List,
  category: 'input',
  isReference: false,
  hasLayout: true,
} satisfies ObjectMeta;

export function createDefaultInputList({ current, x, y, parentId }: CreateObjectContext): EditorObject {
  return {
    ...createCanvasBase('input-list', inputListMeta.name, current, x, y, parentId, 120, 40),
    variableReference: null,
    value: 255, // 255 = no item chosen
    childObjectIds: [],
    listItems: [],
    inputEnabled: true,
    realTimeEditing: false,
    macros: [],
  };
}

/** Valid object kinds that may appear as list items per spec. */
const VALID_LIST_ITEM_KINDS = new Set([
  'output-string',
  'output-number',
  'picture-graphic',
  'container',
]);

export function validateInputList(obj: EditorObject, _project: ProjectState, { objectById }: ObjectLookup): string[] {
  const errors: string[] = [];

  if (!Number.isInteger(obj.width) || obj.width <= 0 || obj.width > 0xffff) {
    errors.push(`Input List ${obj.id}: width must be 1–65535`);
  }
  if (!Number.isInteger(obj.height) || obj.height <= 0 || obj.height > 0xffff) {
    errors.push(`Input List ${obj.id}: height must be 1–65535`);
  }

  if (obj.variableReference && objectById.get(obj.variableReference)?.kind !== 'number-variable') {
    errors.push(`Input List ${obj.id}: variableReference must point to a Number Variable`);
  }

  const value = obj.value ?? 255;
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    errors.push(`Input List ${obj.id}: value must be 0–255`);
  }

  const listItems = obj.listItems ?? [];
  if (listItems.length > 255) {
    errors.push(`Input List ${obj.id}: list items must not exceed 255`);
  }

  for (const itemId of listItems) {
    if (!itemId) continue; // empty string = NULL placeholder, allowed
    const item = objectById.get(itemId);
    if (!item) {
      errors.push(`Input List ${obj.id}: unknown list item "${itemId}"`);
    } else if (!VALID_LIST_ITEM_KINDS.has(item.kind)) {
      errors.push(`Input List ${obj.id}: list item "${itemId}" is kind "${item.kind}" — must be output-string, output-number, picture-graphic, or container`);
    }
  }

  return errors;
}

export const inputListModule = {
  kind: 'input-list',
  meta: inputListMeta,
  exportOrder: 11,
  writer: writeInputList,
  createDefault: createDefaultInputList,
  validate: validateInputList,
} satisfies ObjectModule<'input-list'>;
