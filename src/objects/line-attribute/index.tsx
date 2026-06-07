import { PenLine } from 'lucide-react';
import type { EditorObject } from '../../domain/types';
import { writeLineAttributes } from '../../domain/export/writers/lineAttributes';
import { Field, PropertySection, SelectField, VtColorField } from '../../properties/fields';
import { createReferenceBase } from '../createHelpers';
import type { CreateObjectContext, ObjectMeta, ObjectModule } from '../ObjectModule';

export const lineAttributeMeta = {
  name: 'Line Attribute', Icon: PenLine, category: 'attribute', isReference: true, hasLayout: false,
} satisfies ObjectMeta;

export function createDefaultLineAttribute({ current }: CreateObjectContext): EditorObject {
  return {
    ...createReferenceBase('line-attribute', lineAttributeMeta.name, current),
    lineColor: 0,
    lineWidth: 1,
    lineArt: '0xFFFF',
  };
}

export function LineAttributeProperties({ object, onPatch }: { object: EditorObject; onPatch: (changes: Partial<EditorObject>) => void }) {
  return (
    <PropertySection title="Line">
      <VtColorField label="Line Color" value={object.lineColor ?? 0} onChange={(lineColor) => onPatch({ lineColor })} />
      <Field label="Line Width" value={object.lineWidth ?? 1} type="number" onChange={(value) => onPatch({ lineWidth: Number(value) })} />
      <SelectField label="Line Art" value={object.lineArt ?? '0xFFFF'} options={[{ value: '0xFFFF', label: 'Solid' }, { value: '0xF0F0', label: 'Dashed' }, { value: '0xAAAA', label: 'Dotted' }]} onChange={(lineArt) => onPatch({ lineArt })} />
    </PropertySection>
  );
}

export const lineAttributeModule = {
  kind: 'line-attribute',
  meta: lineAttributeMeta,
  exportOrder: 1,
  writer: writeLineAttributes,
  createDefault: createDefaultLineAttribute,
  Properties: LineAttributeProperties,
} satisfies ObjectModule<'line-attribute'>;
