import { clamp } from '../../domain/isobus';
import type { EditorObject, ReferenceKind } from '../../domain/types';
import { CheckboxField, Field, PropertySection, SelectField, VtColorField } from '../../properties/fields';
import { handleRefSelect, nullableReferenceOptions, referenceOptions } from '../propertyHelpers';
import { MacroReferencesSection } from '../../properties/MacroReferencesSection';

export function InputBooleanProperties({ object, objects, onPatch, onCreateAttributeReference }: {
  object: EditorObject;
  objects: EditorObject[];
  onPatch: (changes: Partial<EditorObject>) => void;
  onCreateAttributeReference: (kind: ReferenceKind) => void;
}) {
  const fontAttrOpts = referenceOptions(objects, 'font-attribute', '+ Create Font Attribute', '__create_font-attribute');
  const numberVariableOpts = nullableReferenceOptions(objects, 'number-variable', 'NULL — use local value', '+ Create Number Variable', '__create_number-variable');
  const variableReference = object.variableReference ?? null;

  return (
    <>
      <PropertySection title="Input Boolean">
        <VtColorField label="Background" value={object.backgroundColorIndex ?? 1} onChange={(backgroundColorIndex) => onPatch({ backgroundColorIndex })} />
        <Field
          label="Size (px)"
          value={object.width}
          type="number"
          onChange={(v) => {
            const s = clamp(Math.round(Number(v) || 40), 1, 0xffff);
            onPatch({ width: s, height: s });
          }}
        />
        <Field
          label="Value"
          value={object.value ?? 0}
          type="number"
          onChange={(v) => onPatch({ value: clamp(Math.round(Number(v) || 0), 0, 255) })}
        />
        <CheckboxField
          label="Enabled"
          checked={object.inputEnabled ?? true}
          onChange={(checked) => onPatch({ inputEnabled: checked })}
        />
      </PropertySection>
      <PropertySection title="References">
        <SelectField
          label="Font Attribute"
          value={object.fontAttributeId ?? ''}
          options={fontAttrOpts}
          onChange={(value) => handleRefSelect(value, 'font-attribute', (id) => ({ fontAttributeId: id }), onPatch, onCreateAttributeReference)}
        />
        <SelectField
          label="Variable Reference"
          value={variableReference ?? '__null'}
          options={numberVariableOpts}
          onChange={(value) => handleRefSelect(value, 'number-variable', (id) => ({ variableReference: id === '__null' ? null : id }), onPatch, onCreateAttributeReference)}
        />
      </PropertySection>
      <MacroReferencesSection object={object} objects={objects} onPatch={onPatch} />
    </>
  );
}
