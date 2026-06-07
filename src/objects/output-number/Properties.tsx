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
  formatOutputNumber,
} from '../../domain/isobus';
import type { EditorObject, ReferenceKind } from '../../domain/types';
import { CheckboxField, Field, PropertySection, SelectField, VtColorField } from '../../properties/fields';
import { handleRefSelect, nullableReferenceOptions, patchBit, referenceOptions } from '../propertyHelpers';

export function OutputNumberProperties({ object, objects, onPatch, onCreateAttributeReference }: {
  object: EditorObject;
  objects: EditorObject[];
  onPatch: (changes: Partial<EditorObject>) => void;
  onCreateAttributeReference: (kind: ReferenceKind) => void;
}) {
  const fontAttrOpts = referenceOptions(objects, 'font-attribute', '+ Create Font Attribute', '__create_font-attribute');
  const numberVariableOpts = nullableReferenceOptions(objects, 'number-variable', 'NULL — use local value', '+ Create Number Variable', '__create_number-variable');
  const variableReference = object.variableReference !== undefined ? object.variableReference : object.numberVariableId || null;
  const variable = variableReference ? objects.find((candidate) => candidate.id === variableReference && candidate.kind === 'number-variable') : undefined;
  const font = objects.find((candidate) => candidate.id === object.fontAttributeId && candidate.kind === 'font-attribute');
  const previewWidth = Math.max(1, Math.floor(Math.max(1, object.width - 8) / (font?.fontWidth ?? font?.fontHeight ?? font?.fontSize ?? 16)));
  const preview = formatOutputNumber(variable?.value ?? object.value ?? 0, object.offset ?? 0, object.scale ?? 1, object.numberOfDecimals ?? 0, object.numberFormat ?? 0, object.outputOptions ?? 0, previewWidth);

  return (
    <>
      <PropertySection title="Number">
        <Field label="Value (Raw)" value={object.value ?? 0} type="number" onChange={(value) => onPatch({ value: clamp(Math.round(Number(value) || 0), 0, 0xffffffff) })} />
        <Field label="Offset" value={object.offset ?? 0} type="number" onChange={(value) => onPatch({ offset: Number(value) })} />
        <Field label="Scale" value={object.scale ?? 1} type="number" onChange={(value) => onPatch({ scale: Number(value) })} />
        <Field label="Decimal Places" value={object.numberOfDecimals ?? 0} type="number" onChange={(value) => onPatch({ numberOfDecimals: clamp(Math.round(Number(value) || 0), 0, 7) })} />
        <SelectField label="Format" value={String(object.numberFormat ?? 0)} options={VT_NUMBER_FORMAT_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }))} onChange={(value) => onPatch({ numberFormat: Number(value) })} />
        <VtColorField label="Background" value={object.backgroundColorIndex ?? 1} onChange={(backgroundColorIndex) => onPatch({ backgroundColorIndex })} />
        <SelectField label="Horizontal" value={String(object.horizontalJustification ?? 0)} options={VT_H_JUSTIFY_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }))} onChange={(value) => onPatch({ horizontalJustification: asHorizontalJustification(Number(value)) })} />
        <SelectField label="Vertical" value={String(object.verticalJustification ?? 0)} options={VT_V_JUSTIFY_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }))} onChange={(value) => onPatch({ verticalJustification: asVerticalJustification(Number(value)) })} />
        <div className="field-hint">Preview: {preview || 'blank'}</div>
      </PropertySection>
      <PropertySection title="Options">
        <CheckboxField label="Transparent Background" checked={((object.outputOptions ?? 0) & OUTPUT_NUMBER_OPTION_TRANSPARENT) !== 0} onChange={(value) => onPatch({ outputOptions: patchBit(object.outputOptions, OUTPUT_NUMBER_OPTION_TRANSPARENT, value) })} />
        <CheckboxField label="Leading Zeros" checked={((object.outputOptions ?? 0) & OUTPUT_NUMBER_OPTION_LEADING_ZEROS) !== 0} onChange={(value) => onPatch({ outputOptions: patchBit(object.outputOptions, OUTPUT_NUMBER_OPTION_LEADING_ZEROS, value) })} />
        <CheckboxField label="Zero as Blank" checked={((object.outputOptions ?? 0) & OUTPUT_NUMBER_OPTION_ZERO_AS_BLANK) !== 0} onChange={(value) => onPatch({ outputOptions: patchBit(object.outputOptions, OUTPUT_NUMBER_OPTION_ZERO_AS_BLANK, value) })} />
        <CheckboxField label="Truncate" checked={((object.outputOptions ?? 0) & OUTPUT_NUMBER_OPTION_TRUNCATE) !== 0} onChange={(value) => onPatch({ outputOptions: patchBit(object.outputOptions, OUTPUT_NUMBER_OPTION_TRUNCATE, value) })} />
      </PropertySection>
      <PropertySection title="References">
        <SelectField label="Font Attribute" value={object.fontAttributeId ?? ''} options={fontAttrOpts} onChange={(value) => handleRefSelect(value, 'font-attribute', (id) => ({ fontAttributeId: id }), onPatch, onCreateAttributeReference)} />
        <SelectField label="Variable Reference" value={variableReference ?? '__null'} options={numberVariableOpts} onChange={(value) => handleRefSelect(value, 'number-variable', (id) => ({ variableReference: id === '__null' ? null : id, numberVariableId: undefined }), onPatch, onCreateAttributeReference)} />
      </PropertySection>
    </>
  );
}
