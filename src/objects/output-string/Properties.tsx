import { AlignCenter, AlignLeft, AlignRight, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, AlignVerticalJustifyStart, EyeOff, Minus, WrapText } from 'lucide-react';
import {
  OUTPUT_STRING_OPTION_AUTO_WRAP,
  OUTPUT_STRING_OPTION_TRANSPARENT,
  OUTPUT_STRING_OPTION_WRAP_ON_HYPHEN,
  VT_H_JUSTIFY_OPTIONS,
  VT_V_JUSTIFY_OPTIONS,
  asHorizontalJustification,
  asVerticalJustification,
} from '../../domain/isobus';
import type { EditorObject, ReferenceKind } from '../../domain/types';
import { Field, IconCheckboxField, IconToggleField, PropertySection, SelectField, VtColorField } from '../../properties/fields';
import { MacroReferencesSection } from '../../properties/MacroReferencesSection';

export function OutputStringProperties({
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
  const variableOpts = variableReferenceOptions(objects);
  const textValue = object.text ?? '';
  const outputOptions = object.outputOptions ?? 0;

  return (
    <>
      <PropertySection title="Text">
        <Field label="Value" value={textValue} onChange={(text) => onPatch({ text })} />
        <Field label="Length (bytes)" value={object.length ?? 32} type="number" onChange={(length) => onPatch({ length: Number(length) })} />
        <div className="field-hint">{utf8ByteLength(textValue)} / {object.length ?? 32} bytes before padding</div>
        <VtColorField label="Background" value={object.backgroundColorIndex ?? 1} onChange={(backgroundColorIndex) => onPatch({ backgroundColorIndex })} />
        <IconToggleField label="Horizontal" value={String(object.horizontalJustification ?? 0)} options={VT_H_JUSTIFY_OPTIONS.map((option, index) => ({ value: String(option.value), label: option.label, icon: index === 1 ? <AlignCenter size={15} /> : index === 2 ? <AlignRight size={15} /> : <AlignLeft size={15} /> }))} onChange={(value) => onPatch({ horizontalJustification: asHorizontalJustification(Number(value)) })} />
        <IconToggleField label="Vertical" value={String(object.verticalJustification ?? 0)} options={VT_V_JUSTIFY_OPTIONS.map((option, index) => ({ value: String(option.value), label: option.label, icon: index === 1 ? <AlignVerticalJustifyCenter size={15} /> : index === 2 ? <AlignVerticalJustifyEnd size={15} /> : <AlignVerticalJustifyStart size={15} /> }))} onChange={(value) => onPatch({ verticalJustification: asVerticalJustification(Number(value)) })} />
      </PropertySection>
      <PropertySection title="Options">
        <div className="option-chip-grid">
          <IconCheckboxField label="Transparent" icon={<EyeOff size={14} />} checked={(outputOptions & OUTPUT_STRING_OPTION_TRANSPARENT) !== 0} onChange={(value) => onPatch({ outputOptions: patchBit(outputOptions, OUTPUT_STRING_OPTION_TRANSPARENT, value) })} />
          <IconCheckboxField label="Auto wrap" icon={<WrapText size={14} />} checked={(outputOptions & OUTPUT_STRING_OPTION_AUTO_WRAP) !== 0} onChange={(value) => onPatch({ outputOptions: patchBit(outputOptions, OUTPUT_STRING_OPTION_AUTO_WRAP, value) & (value ? 0xff : ~OUTPUT_STRING_OPTION_WRAP_ON_HYPHEN) })} />
          <IconCheckboxField label="Hyphen" icon={<Minus size={14} />} checked={(outputOptions & OUTPUT_STRING_OPTION_WRAP_ON_HYPHEN) !== 0} disabled={(outputOptions & OUTPUT_STRING_OPTION_AUTO_WRAP) === 0} onChange={(value) => onPatch({ outputOptions: patchBit(outputOptions, OUTPUT_STRING_OPTION_WRAP_ON_HYPHEN, value) })} />
        </div>
      </PropertySection>
      <PropertySection title="References">
        <SelectField label="Font Attribute" value={object.fontAttributeId ?? ''} options={fontAttrOpts} onChange={(value) => handleRefSelect(value, 'font-attribute', (id) => ({ fontAttributeId: id }), onPatch, onCreateAttributeReference)} />
        <SelectField label="Variable Reference" value={object.variableReference !== undefined ? object.variableReference ?? '__null' : object.stringVariableId || '__null'} options={variableOpts} onChange={(value) => handleRefSelect(value, 'string-variable', (id) => ({ variableReference: id === '__null' ? null : id }), onPatch, onCreateAttributeReference)} />
      </PropertySection>
      <MacroReferencesSection object={object} objects={objects} onPatch={onPatch} />
    </>
  );
}

function referenceOptions(objects: EditorObject[], kind: EditorObject['kind'], createLabel: string, createValue: string) {
  return [
    { value: '', label: 'None' },
    ...objects.filter((object) => object.kind === kind).map((object) => ({ value: object.id, label: `${object.id} — ${object.name}` })),
    { value: createValue, label: createLabel },
  ];
}

function variableReferenceOptions(objects: EditorObject[]) {
  return [
    { value: '__null', label: 'NULL — use local text' },
    ...objects.filter((object) => object.kind === 'string-variable').map((object) => ({ value: object.id, label: `${object.id} — ${object.name}` })),
    { value: '__create_string-variable', label: '+ Create String Variable' },
  ];
}

function handleRefSelect(
  value: string,
  refKind: ReferenceKind,
  patchFn: (id: string) => Partial<EditorObject>,
  onPatch: (changes: Partial<EditorObject>) => void,
  onCreateAttributeReference: (kind: ReferenceKind) => void,
) {
  if (value.startsWith('__create_')) return onCreateAttributeReference(refKind);
  onPatch(patchFn(value));
}

function patchBit(current: number | undefined, bit: number, enabled: boolean) {
  return enabled ? (current ?? 0) | bit : (current ?? 0) & ~bit;
}

function utf8ByteLength(value: string) {
  return new TextEncoder().encode(value).length;
}
