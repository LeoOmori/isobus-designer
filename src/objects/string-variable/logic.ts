import { ClipboardList } from 'lucide-react';
import type { EditorObject, ProjectState } from '../../domain/types';
import { isLatin1 } from '../../domain/export/encoding';
import { writeStringVariable } from '../../domain/export/writers/stringVariable';
import { createReferenceBase } from '../createHelpers';
import type { CreateObjectContext, ObjectLookup, ObjectMeta, ObjectModule } from '../ObjectModule';

export const stringVariableMeta = {
  name: 'String Variable', Icon: ClipboardList, category: 'variable', isReference: true, hasLayout: false,
} satisfies ObjectMeta;

export function createDefaultStringVariable({ current }: CreateObjectContext): EditorObject {
  return {
    ...createReferenceBase('string-variable', stringVariableMeta.name, current),
    stringValue: 'Dynamic text',
    maxLength: 128,
  };
}

export function validateStringVariableForExport(obj: EditorObject, _project: ProjectState, _lookup: ObjectLookup): string[] {
  const text = obj.stringValue ?? '';
  if (isLatin1(text)) return [];
  return [`Export: String Variable ${obj.id} value contains non-Latin-1 characters (V1 supports ISO 8859-1 only)`];
}

export const stringVariableModule = {
  kind: 'string-variable',
  meta: stringVariableMeta,
  exportOrder: 4,
  writer: writeStringVariable,
  createDefault: createDefaultStringVariable,
  validateExport: validateStringVariableForExport,
} satisfies ObjectModule<'string-variable'>;
