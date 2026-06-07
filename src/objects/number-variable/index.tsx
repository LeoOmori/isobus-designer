import { Hash } from 'lucide-react';
import type { EditorObject } from '../../domain/types';
import { writeNumberVariable } from '../../domain/export/writers/numberVariable';
import { Field, PropertySection } from '../../properties/fields';
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

export function NumberVariableProperties({ object, onPatch }: { object: EditorObject; onPatch: (changes: Partial<EditorObject>) => void }) {
  return (
    <PropertySection title="Number Variable">
      <Field label="Value" value={object.value ?? 0} type="number" onChange={(value) => onPatch({ value: Number(value) })} />
      <Field label="Unit" value={object.unit ?? ''} onChange={(unit) => onPatch({ unit })} />
      <Field label="Min Preview" value={object.minPreview ?? 0} type="number" onChange={(value) => onPatch({ minPreview: Number(value) })} />
      <Field label="Max Preview" value={object.maxPreview ?? 100} type="number" onChange={(value) => onPatch({ maxPreview: Number(value) })} />
    </PropertySection>
  );
}

export const numberVariableModule = {
  kind: 'number-variable',
  meta: numberVariableMeta,
  exportOrder: 3,
  writer: writeNumberVariable,
  createDefault: createDefaultNumberVariable,
  Properties: NumberVariableProperties,
} satisfies ObjectModule<'number-variable'>;
