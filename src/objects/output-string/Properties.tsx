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
import { CheckboxField, Field, PropertySection, SelectField, VtColorField } from '../../properties/fields';

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

  return (
    <>
      <PropertySection title="Text">
        <Field label="Value" value={object.text ?? ''} onChange={(text) => onPatch({ text })} />
        <Field label="Length (bytes)" value={object.length ?? 32} type="number" onChange={(length) => onPatch({ length: Number(length) })} />
        <div className="field-hint">{utf8ByteLength(object.text ?? '')} / {object.length ?? 32} bytes before padding</div>
        <VtColorField label="Background" value={object.backgroundColorIndex ?? 1} onChange={(backgroundColorIndex) => onPatch({ backgroundColorIndex })} />
        <SelectField label="Horizontal" value={String(object.horizontalJustification ?? 0)} options={VT_H_JUSTIFY_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }))} onChange={(value) => onPatch({ horizontalJustification: asHorizontalJustification(Number(value)) })} />
        <SelectField label="Vertical" value={String(object.verticalJustification ?? 0)} options={VT_V_JUSTIFY_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }))} onChange={(value) => onPatch({ verticalJustification: asVerticalJustification(Number(value)) })} />
      </PropertySection>
      <PropertySection title="Options">
        <CheckboxField label="Transparent Background" checked={((object.outputOptions ?? 0) & OUTPUT_STRING_OPTION_TRANSPARENT) !== 0} onChange={(value) => onPatch({ outputOptions: patchBit(object.outputOptions, OUTPUT_STRING_OPTION_TRANSPARENT, value) })} />
        <CheckboxField label="Auto Wrap" checked={((object.outputOptions ?? 0) & OUTPUT_STRING_OPTION_AUTO_WRAP) !== 0} onChange={(value) => onPatch({ outputOptions: patchBit(object.outputOptions, OUTPUT_STRING_OPTION_AUTO_WRAP, value) & (value ? 0xff : ~OUTPUT_STRING_OPTION_WRAP_ON_HYPHEN) })} />
        <CheckboxField label="Wrap on Hyphen" checked={((object.outputOptions ?? 0) & OUTPUT_STRING_OPTION_WRAP_ON_HYPHEN) !== 0} disabled={((object.outputOptions ?? 0) & OUTPUT_STRING_OPTION_AUTO_WRAP) === 0} onChange={(value) => onPatch({ outputOptions: patchBit(object.outputOptions, OUTPUT_STRING_OPTION_WRAP_ON_HYPHEN, value) })} />
      </PropertySection>
      <PropertySection title="References">
        <SelectField label="Font Attribute" value={object.fontAttributeId ?? ''} options={fontAttrOpts} onChange={(value) => handleRefSelect(value, 'font-attribute', (id) => ({ fontAttributeId: id }), onPatch, onCreateAttributeReference)} />
        <SelectField label="Variable Reference" value={object.variableReference !== undefined ? object.variableReference ?? '__null' : object.stringVariableId || '__null'} options={variableOpts} onChange={(value) => handleRefSelect(value, 'string-variable', (id) => ({ variableReference: id === '__null' ? null : id }), onPatch, onCreateAttributeReference)} />
      </PropertySection>
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
