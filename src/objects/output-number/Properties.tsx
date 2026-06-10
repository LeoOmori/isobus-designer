import { AlignCenter, AlignLeft, AlignRight, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, AlignVerticalJustifyStart, EyeOff } from 'lucide-react';
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
import { Field, IconCheckboxField, IconToggleField, PropertySection, SelectField, VtColorField } from '../../properties/fields';
import { handleRefSelect, nullableReferenceOptions, patchBit, referenceOptions } from '../propertyHelpers';
import { MacroReferencesSection } from '../../properties/MacroReferencesSection';

export function OutputNumberProperties({ object, objects, onPatch, onCreateAttributeReference }: {
  object: EditorObject;
  objects: EditorObject[];
  onPatch: (changes: Partial<EditorObject>) => void;
  onCreateAttributeReference: (kind: ReferenceKind) => void;
}) {
  const fontAttrOpts = referenceOptions(objects, 'font-attribute', '+ Create Font Attribute', '__create_font-attribute');
  const numberVariableOpts = nullableReferenceOptions(objects, 'number-variable', 'NULL — use local value', '+ Create Number Variable', '__create_number-variable');
  const variableReference = object.variableReference !== undefined ? object.variableReference : object.numberVariableId || null;
  const outputOptions = object.outputOptions ?? 0;

  return (
    <>
      <PropertySection title="Number">
        <Field label="Value (Raw)" value={object.value ?? 0} type="number" onChange={(value) => onPatch({ value: clamp(Math.round(Number(value) || 0), 0, 0xffffffff) })} />
        <Field label="Offset" value={object.offset ?? 0} type="number" onChange={(value) => onPatch({ offset: Number(value) })} />
        <Field label="Scale" value={object.scale ?? 1} type="number" onChange={(value) => onPatch({ scale: Number(value) })} />
        <Field label="Decimal Places" value={object.numberOfDecimals ?? 0} type="number" onChange={(value) => onPatch({ numberOfDecimals: clamp(Math.round(Number(value) || 0), 0, 7) })} />
        <SelectField label="Format" value={String(object.numberFormat ?? 0)} options={VT_NUMBER_FORMAT_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }))} onChange={(value) => onPatch({ numberFormat: Number(value) })} />
        <VtColorField label="Background" value={object.backgroundColorIndex ?? 1} onChange={(backgroundColorIndex) => onPatch({ backgroundColorIndex })} />
        <IconToggleField label="Horizontal" value={String(object.horizontalJustification ?? 0)} options={VT_H_JUSTIFY_OPTIONS.map((option, index) => ({ value: String(option.value), label: option.label, icon: index === 1 ? <AlignCenter size={15} /> : index === 2 ? <AlignRight size={15} /> : <AlignLeft size={15} /> }))} onChange={(value) => onPatch({ horizontalJustification: asHorizontalJustification(Number(value)) })} />
        <IconToggleField label="Vertical" value={String(object.verticalJustification ?? 0)} options={VT_V_JUSTIFY_OPTIONS.map((option, index) => ({ value: String(option.value), label: option.label, icon: index === 1 ? <AlignVerticalJustifyCenter size={15} /> : index === 2 ? <AlignVerticalJustifyEnd size={15} /> : <AlignVerticalJustifyStart size={15} /> }))} onChange={(value) => onPatch({ verticalJustification: asVerticalJustification(Number(value)) })} />
      </PropertySection>
      <PropertySection title="Options">
        <div className="option-chip-grid">
          <IconCheckboxField label="Transparent" icon={<EyeOff size={14} />} checked={(outputOptions & OUTPUT_NUMBER_OPTION_TRANSPARENT) !== 0} onChange={(value) => onPatch({ outputOptions: patchBit(outputOptions, OUTPUT_NUMBER_OPTION_TRANSPARENT, value) })} />
          <IconCheckboxField label="Leading 0" icon={<span className="chip-glyph">00</span>} checked={(outputOptions & OUTPUT_NUMBER_OPTION_LEADING_ZEROS) !== 0} onChange={(value) => onPatch({ outputOptions: patchBit(outputOptions, OUTPUT_NUMBER_OPTION_LEADING_ZEROS, value) })} />
          <IconCheckboxField label="0 blank" icon={<span className="chip-glyph">∅</span>} checked={(outputOptions & OUTPUT_NUMBER_OPTION_ZERO_AS_BLANK) !== 0} onChange={(value) => onPatch({ outputOptions: patchBit(outputOptions, OUTPUT_NUMBER_OPTION_ZERO_AS_BLANK, value) })} />
          <IconCheckboxField label="Truncate" icon={<span className="chip-glyph">…</span>} checked={(outputOptions & OUTPUT_NUMBER_OPTION_TRUNCATE) !== 0} onChange={(value) => onPatch({ outputOptions: patchBit(outputOptions, OUTPUT_NUMBER_OPTION_TRUNCATE, value) })} />
        </div>
      </PropertySection>
      <PropertySection title="References">
        <SelectField label="Font Attribute" value={object.fontAttributeId ?? ''} options={fontAttrOpts} onChange={(value) => handleRefSelect(value, 'font-attribute', (id) => ({ fontAttributeId: id }), onPatch, onCreateAttributeReference)} />
        <SelectField label="Variable Reference" value={variableReference ?? '__null'} options={numberVariableOpts} onChange={(value) => handleRefSelect(value, 'number-variable', (id) => ({ variableReference: id === '__null' ? null : id, numberVariableId: undefined }), onPatch, onCreateAttributeReference)} />
      </PropertySection>
      <MacroReferencesSection object={object} objects={objects} onPatch={onPatch} />
    </>
  );
}
