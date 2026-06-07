import { Hash } from 'lucide-react';
import type { EditorObject } from '../../domain/types';
import { writeNumberVariable } from '../../domain/export/writers/numberVariable';
import { createReferenceBase } from '../createHelpers';
import type { CreateObjectContext, ObjectMeta, ObjectModule } from '../ObjectModule';

export const numberVariableMeta = {
  name: 'Number Variable', Icon: Hash, category: 'variable', isReference: true, hasLayout: false,
} satisfies ObjectMeta;

export function createDefaultNumberVariable({ current }: CreateObjectContext): EditorObject {
  return {
    ...createReferenceBase('number-variable', numberVariableMeta.name, current),
    value: 0,
    unit: '',
  };
}

export const numberVariableModule = {
  kind: 'number-variable',
  meta: numberVariableMeta,
  exportOrder: 3,
  writer: writeNumberVariable,
  createDefault: createDefaultNumberVariable,
} satisfies ObjectModule<'number-variable'>;
