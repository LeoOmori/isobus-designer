import { clamp } from '../../domain/isobus';
import type { EditorObject, ReferenceKind } from '../../domain/types';
import { Field, IconToggleField, PropertySection, SelectField } from '../../properties/fields';
import { handleRefSelect, referenceOptions } from '../propertyHelpers';
import { MacroReferencesSection } from '../../properties/MacroReferencesSection';

const LINE_DIRECTION_OPTIONS = [
  { value: '0', label: '↘ Top-left to bottom-right', icon: <span className="chip-glyph">↘</span> },
  { value: '1', label: '↗ Bottom-left to top-right', icon: <span className="chip-glyph">↗</span> },
];

export function OutputLineProperties({ object, objects, onPatch, onCreateAttributeReference }: {
  object: EditorObject;
  objects: EditorObject[];
  onPatch: (changes: Partial<EditorObject>) => void;
  onCreateAttributeReference: (kind: ReferenceKind) => void;
}) {
  const lineAttrOpts = referenceOptions(objects, 'line-attribute', '+ Create Line Attribute', '__create_line-attribute');

  return (
    <>
      <PropertySection title="Output Line">
        <Field
          label="Width"
          value={object.width}
          type="number"
          onChange={(v) => onPatch({ width: clamp(Math.round(Number(v) || 100), 1, 0xffff) })}
        />
        <Field
          label="Height"
          value={object.height}
          type="number"
          onChange={(v) => onPatch({ height: clamp(Math.round(Number(v) || 40), 1, 0xffff) })}
        />
        <IconToggleField
          label="Direction"
          value={String(object.lineDirection ?? 0)}
          options={LINE_DIRECTION_OPTIONS}
          onChange={(v) => onPatch({ lineDirection: Number(v) as 0 | 1 })}
        />
      </PropertySection>
      <PropertySection title="References">
        <SelectField
          label="Line Attribute"
          value={object.lineAttributeId ?? ''}
          options={lineAttrOpts}
          onChange={(v) => handleRefSelect(v, 'line-attribute', (id) => ({ lineAttributeId: id }), onPatch, onCreateAttributeReference)}
        />
      </PropertySection>
      <MacroReferencesSection object={object} objects={objects} onPatch={onPatch} />
    </>
  );
}
