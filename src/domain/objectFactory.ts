import type { EditorObject, ObjectKind, ProjectState, ReferenceKind } from './types';
import { extractedModules } from '../objects/extractedModules';

export function createEditorObject(
  kind: ObjectKind,
  current: ProjectState,
  x = 70,
  y = 70,
  parentId = current.activeMaskId,
): EditorObject {
  const createDefault = extractedModules[kind].createDefault;
  if (!createDefault) throw new Error(`Object kind "${kind}" has no createDefault module`);
  return createDefault({ current, x, y, parentId });
}

export function referencePatch(kind: ReferenceKind, id: string): Partial<EditorObject> {
  switch (kind) {
    case 'line-attribute':  return { lineAttributeId: id };
    case 'fill-attribute':  return { fillAttributeId: id };
    case 'font-attribute':  return { fontAttributeId: id };
    case 'string-variable': return { variableReference: id };
    case 'number-variable': return { variableReference: id, numberVariableId: undefined };
  }
}
