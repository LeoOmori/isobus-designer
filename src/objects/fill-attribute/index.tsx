import { Grid3X3 } from 'lucide-react';
import { VT_FILL_TYPE_OPTIONS } from '../../domain/isobus';
import type { EditorObject, ProjectState } from '../../domain/types';
import { writeFillAttributes } from '../../domain/export/writers/fillAttributes';
import { PropertySection, SelectField, VtColorField } from '../../properties/fields';
import { createReferenceBase } from '../createHelpers';
import type { CreateObjectContext, ObjectLookup, ObjectMeta, ObjectModule } from '../ObjectModule';

export const fillAttributeMeta = {
  name: 'Fill Attribute', Icon: Grid3X3, category: 'attribute', isReference: true, hasLayout: false,
} satisfies ObjectMeta;

export function createDefaultFillAttribute({ current }: CreateObjectContext): EditorObject {
  return {
    ...createReferenceBase('fill-attribute', fillAttributeMeta.name, current),
    fillType: 2,
    fillColor: 15,
  };
}

export function validateFillAttribute(obj: EditorObject, _project: ProjectState, _lookup: ObjectLookup): string[] {
  if (obj.fillType === 3 && !obj.fillPattern) {
    return [`Fill Attribute ${obj.id}: fillType=3 (pattern) requires a fillPattern reference`];
  }
  return [];
}

export function FillAttributeProperties({ object, onPatch }: { object: EditorObject; onPatch: (changes: Partial<EditorObject>) => void }) {
  return (
    <PropertySection title="Fill">
      <SelectField label="Fill Type" value={String(object.fillType ?? 2)} options={VT_FILL_TYPE_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }))} onChange={(value) => onPatch({ fillType: Number(value) })} />
      <VtColorField label="Fill Color" value={object.fillColor ?? 15} onChange={(fillColor) => onPatch({ fillColor })} />
    </PropertySection>
  );
}

export const fillAttributeModule = {
  kind: 'fill-attribute',
  meta: fillAttributeMeta,
  exportOrder: 2,
  writer: writeFillAttributes,
  createDefault: createDefaultFillAttribute,
  validate: validateFillAttribute,
  Properties: FillAttributeProperties,
} satisfies ObjectModule<'fill-attribute'>;
