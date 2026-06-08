import {
  AlignCenter, AlignLeft, AlignRight,
  AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, AlignVerticalJustifyStart,
  EyeOff,
} from 'lucide-react';
import {
  OUTPUT_NUMBER_OPTION_LEADING_ZEROS,
  OUTPUT_NUMBER_OPTION_TRANSPARENT,
  OUTPUT_NUMBER_OPTION_TRUNCATE,
  OUTPUT_NUMBER_OPTION_ZERO_AS_BLANK,
  VT_H_JUSTIFY_OPTIONS,
  VT_NUMBER_FORMAT_OPTIONS,
  VT_V_JUSTIFY_OPTIONS,
  asHorizontalJustification,
  asVerticalJustification,
  clamp,
} from '../../domain/isobus';
import type { EditorObject, ReferenceKind } from '../../domain/types';
import { CheckboxField, Field, IconCheckboxField, IconToggleField, PropertySection, SelectField, VtColorField } from '../../properties/fields';
import { handleRefSelect, nullableReferenceOptions, patchBit, referenceOptions } from '../propertyHelpers';

export function InputNumberProperties({
  object,
  objects,
  onPatch,
  onCreateAttributeReference,
}: {
  object: EditorObject;
  objects: EditorObject[];
  onPatch: (changes: Partial<EditorObject>) => void;
  onCreateAttributeReference: (kind: ReferenceKind) => void;
}) {
  const fontAttrOpts = referenceOptions(objects, 'font-attribute', '+ Create Font Attribute', '__create_font-attribute');
  const numberVariableOpts = nullableReferenceOptions(objects, 'number-variable', 'NULL — use local value', '+ Create Number Variable', '__create_number-variable');
  const variableReference = object.variableReference ?? null;
  const outputOptions = object.outputOptions ?? 0;

  return (
    <>
      <PropertySection title="Number">
        <Field
          label="Value (Raw)"
          value={object.value ?? 0}
          type="number"
          onChange={(v) => onPatch({ value: clamp(Math.round(Number(v) || 0), 0, 0xffffffff) })}
        />
        <Field
          label="Min Value"
          value={object.minValue ?? 0}
          type="number"
          onChange={(v) => onPatch({ minValue: clamp(Math.round(Number(v) || 0), 0, 0xffffffff) })}
        />
        <Field
          label="Max Value"
          value={object.maxValue ?? 0xffffffff}
          type="number"
          onChange={(v) => onPatch({ maxValue: clamp(Math.round(Number(v) || 0), 0, 0xffffffff) })}
        />
        <Field label="Offset" value={object.offset ?? 0} type="number" onChange={(v) => onPatch({ offset: Number(v) })} />
        <Field label="Scale" value={object.scale ?? 1} type="number" onChange={(v) => onPatch({ scale: Number(v) })} />
        <Field
          label="Decimal Places"
          value={object.numberOfDecimals ?? 0}
          type="number"
          onChange={(v) => onPatch({ numberOfDecimals: clamp(Math.round(Number(v) || 0), 0, 7) })}
        />
        <SelectField
          label="Format"
          value={String(object.numberFormat ?? 0)}
          options={VT_NUMBER_FORMAT_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
          onChange={(v) => onPatch({ numberFormat: Number(v) })}
        />
        <VtColorField
          label="Background"
          value={object.backgroundColorIndex ?? 1}
          onChange={(backgroundColorIndex) => onPatch({ backgroundColorIndex })}
        />
        <IconToggleField
          label="Horizontal"
          value={String(object.horizontalJustification ?? 0)}
          options={VT_H_JUSTIFY_OPTIONS.map((o, i) => ({
            value: String(o.value), label: o.label,
            icon: i === 1 ? <AlignCenter size={15} /> : i === 2 ? <AlignRight size={15} /> : <AlignLeft size={15} />,
          }))}
          onChange={(v) => onPatch({ horizontalJustification: asHorizontalJustification(Number(v)) })}
        />
        <IconToggleField
          label="Vertical"
          value={String(object.verticalJustification ?? 0)}
          options={VT_V_JUSTIFY_OPTIONS.map((o, i) => ({
            value: String(o.value), label: o.label,
            icon: i === 1 ? <AlignVerticalJustifyCenter size={15} /> : i === 2 ? <AlignVerticalJustifyEnd size={15} /> : <AlignVerticalJustifyStart size={15} />,
          }))}
          onChange={(v) => onPatch({ verticalJustification: asVerticalJustification(Number(v)) })}
        />
      </PropertySection>
      <PropertySection title="Options">
        <div className="option-chip-grid">
          <IconCheckboxField label="Transparent" icon={<EyeOff size={14} />} checked={(outputOptions & OUTPUT_NUMBER_OPTION_TRANSPARENT) !== 0} onChange={(v) => onPatch({ outputOptions: patchBit(outputOptions, OUTPUT_NUMBER_OPTION_TRANSPARENT, v) })} />
          <IconCheckboxField label="Leading 0" icon={<span className="chip-glyph">00</span>} checked={(outputOptions & OUTPUT_NUMBER_OPTION_LEADING_ZEROS) !== 0} onChange={(v) => onPatch({ outputOptions: patchBit(outputOptions, OUTPUT_NUMBER_OPTION_LEADING_ZEROS, v) })} />
          <IconCheckboxField label="0 blank" icon={<span className="chip-glyph">∅</span>} checked={(outputOptions & OUTPUT_NUMBER_OPTION_ZERO_AS_BLANK) !== 0} onChange={(v) => onPatch({ outputOptions: patchBit(outputOptions, OUTPUT_NUMBER_OPTION_ZERO_AS_BLANK, v) })} />
          <IconCheckboxField label="Truncate" icon={<span className="chip-glyph">…</span>} checked={(outputOptions & OUTPUT_NUMBER_OPTION_TRUNCATE) !== 0} onChange={(v) => onPatch({ outputOptions: patchBit(outputOptions, OUTPUT_NUMBER_OPTION_TRUNCATE, v) })} />
        </div>
      </PropertySection>
      <PropertySection title="Input">
        <CheckboxField label="Enabled" checked={object.inputEnabled ?? true} onChange={(checked) => onPatch({ inputEnabled: checked })} />
        <CheckboxField label="Real-time Editing" checked={object.realTimeEditing ?? false} onChange={(checked) => onPatch({ realTimeEditing: checked })} />
      </PropertySection>
      <PropertySection title="References">
        <SelectField
          label="Font Attribute"
          value={object.fontAttributeId ?? ''}
          options={fontAttrOpts}
          onChange={(v) => handleRefSelect(v, 'font-attribute', (id) => ({ fontAttributeId: id }), onPatch, onCreateAttributeReference)}
        />
        <SelectField
          label="Variable Reference"
          value={variableReference ?? '__null'}
          options={numberVariableOpts}
          onChange={(v) => handleRefSelect(v, 'number-variable', (id) => ({ variableReference: id === '__null' ? null : id }), onPatch, onCreateAttributeReference)}
        />
      </PropertySection>
    </>
  );
}
