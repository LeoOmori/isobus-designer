import {
  AlignCenter, AlignLeft, AlignRight,
  AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, AlignVerticalJustifyStart,
  EyeOff, Minus, WrapText, ToggleLeft,
} from 'lucide-react';
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
import { CheckboxField, Field, IconCheckboxField, IconToggleField, PropertySection, SelectField, VtColorField } from '../../properties/fields';
import { handleRefSelect, nullableReferenceOptions, referenceOptions } from '../propertyHelpers';

export function InputStringProperties({
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
  const stringVariableOpts = nullableReferenceOptions(objects, 'string-variable', 'NULL — use local text', '+ Create String Variable', '__create_string-variable');
  const textValue = object.text ?? '';
  const outputOptions = object.outputOptions ?? 0;
  const variableReference = object.variableReference ?? null;

  return (
    <>
      <PropertySection title="Input String">
        <Field label="Value" value={textValue} onChange={(text) => onPatch({ text })} />
        <Field
          label="Length (bytes)"
          value={object.length ?? 16}
          type="number"
          onChange={(length) => onPatch({ length: Math.min(255, Math.max(0, Math.round(Number(length) || 16))) })}
        />
        <VtColorField label="Background" value={object.backgroundColorIndex ?? 1} onChange={(backgroundColorIndex) => onPatch({ backgroundColorIndex })} />
        <IconToggleField
          label="Horizontal"
          value={String(object.horizontalJustification ?? 0)}
          options={VT_H_JUSTIFY_OPTIONS.map((opt, i) => ({
            value: String(opt.value),
            label: opt.label,
            icon: i === 1 ? <AlignCenter size={15} /> : i === 2 ? <AlignRight size={15} /> : <AlignLeft size={15} />,
          }))}
          onChange={(value) => onPatch({ horizontalJustification: asHorizontalJustification(Number(value)) })}
        />
        <IconToggleField
          label="Vertical"
          value={String(object.verticalJustification ?? 0)}
          options={VT_V_JUSTIFY_OPTIONS.map((opt, i) => ({
            value: String(opt.value),
            label: opt.label,
            icon: i === 1 ? <AlignVerticalJustifyCenter size={15} /> : i === 2 ? <AlignVerticalJustifyEnd size={15} /> : <AlignVerticalJustifyStart size={15} />,
          }))}
          onChange={(value) => onPatch({ verticalJustification: asVerticalJustification(Number(value)) })}
        />
        <CheckboxField
          label="Enabled"
          checked={object.inputEnabled ?? true}
          onChange={(checked) => onPatch({ inputEnabled: checked })}
        />
      </PropertySection>
      <PropertySection title="Options">
        <div className="option-chip-grid">
          <IconCheckboxField
            label="Transparent"
            icon={<EyeOff size={14} />}
            checked={(outputOptions & OUTPUT_STRING_OPTION_TRANSPARENT) !== 0}
            onChange={(value) => onPatch({ outputOptions: patchBit(outputOptions, OUTPUT_STRING_OPTION_TRANSPARENT, value) })}
          />
          <IconCheckboxField
            label="Auto wrap"
            icon={<WrapText size={14} />}
            checked={(outputOptions & OUTPUT_STRING_OPTION_AUTO_WRAP) !== 0}
            onChange={(value) => onPatch({ outputOptions: patchBit(outputOptions, OUTPUT_STRING_OPTION_AUTO_WRAP, value) & (value ? 0xff : ~OUTPUT_STRING_OPTION_WRAP_ON_HYPHEN) })}
          />
          <IconCheckboxField
            label="Hyphen"
            icon={<Minus size={14} />}
            checked={(outputOptions & OUTPUT_STRING_OPTION_WRAP_ON_HYPHEN) !== 0}
            disabled={(outputOptions & OUTPUT_STRING_OPTION_AUTO_WRAP) === 0}
            onChange={(value) => onPatch({ outputOptions: patchBit(outputOptions, OUTPUT_STRING_OPTION_WRAP_ON_HYPHEN, value) })}
          />
        </div>
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
          options={stringVariableOpts}
          onChange={(value) => handleRefSelect(value, 'string-variable', (id) => ({ variableReference: id === '__null' ? null : id }), onPatch, onCreateAttributeReference)}
        />
      </PropertySection>
    </>
  );
}

function patchBit(current: number, bit: number, enabled: boolean) {
  return enabled ? current | bit : current & ~bit;
}
