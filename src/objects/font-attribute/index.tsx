import { Type } from 'lucide-react';
import { vtFontCells, fontCellValue } from '../../domain/isobus';
import type { EditorObject, ProjectState } from '../../domain/types';
import { fontSizeEnum } from '../../domain/export/encoding';
import { writeFontAttributes } from '../../domain/export/writers/fontAttributes';
import { FontStyleField, PropertySection, SelectField, VtColorField } from '../../properties/fields';
import { createReferenceBase } from '../createHelpers';
import type { CreateObjectContext, ObjectLookup, ObjectMeta, ObjectModule } from '../ObjectModule';

export const fontAttributeMeta = {
  name: 'Font Attribute', Icon: Type, category: 'attribute', isReference: true, hasLayout: false,
} satisfies ObjectMeta;

export function createDefaultFontAttribute({ current }: CreateObjectContext): EditorObject {
  return {
    ...createReferenceBase('font-attribute', fontAttributeMeta.name, current),
    fontColor: 0,
    proportional: true,
    fontWidth: 16,
    fontHeight: 24,
    fontType: 1,
    fontStyle: 0,
    fontSize: 24,
  };
}

export function validateFontAttributeForExport(obj: EditorObject, _project: ProjectState, _lookup: ObjectLookup): string[] {
  const width = obj.fontWidth ?? 16;
  const height = obj.fontHeight ?? 24;
  if (fontSizeEnum(width, height) !== -1) return [];
  const valid = vtFontCells.map((cell) => cell.label).join(', ');
  return [`Export: Font Attribute ${obj.id} size ${width}×${height} is not a standard V1 cell size. Valid sizes: ${valid}`];
}

export function FontAttributeProperties({ object, onPatch }: { object: EditorObject; onPatch: (changes: Partial<EditorObject>) => void }) {
  return (
    <PropertySection title="Font">
      <VtColorField label="Font Color" value={object.fontColor ?? 0} onChange={(fontColor) => onPatch({ fontColor })} />
      <SelectField label="Font Type" value={object.proportional === false ? 'monospace' : 'proportional'} options={[{ value: 'proportional', label: 'Proportional' }, { value: 'monospace', label: 'Monospace' }]} onChange={(value) => onPatch({ proportional: value === 'proportional' })} />
      <SelectField label="Font Size" value={fontCellValue(object)} options={vtFontCells.map((cell) => ({ value: cell.value, label: cell.label }))} onChange={(value) => { const cell = vtFontCells.find((item) => item.value === value) ?? vtFontCells[5]; onPatch({ fontWidth: cell.width, fontHeight: cell.height, fontSize: cell.height }); }} />
      <FontStyleField value={object.fontStyle ?? 0} onChange={(fontStyle) => onPatch({ fontStyle })} />
    </PropertySection>
  );
}

export const fontAttributeModule = {
  kind: 'font-attribute',
  meta: fontAttributeMeta,
  exportOrder: 0,
  writer: writeFontAttributes,
  createDefault: createDefaultFontAttribute,
  validateExport: validateFontAttributeForExport,
  Properties: FontAttributeProperties,
} satisfies ObjectModule<'font-attribute'>;
