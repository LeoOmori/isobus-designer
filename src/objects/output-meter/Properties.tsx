import type { EditorObject, ReferenceKind } from '../../domain/types';
import { CheckboxField, Field, PropertySection, SelectField, VtColorField } from '../../properties/fields';
import { handleRefSelect, nullableReferenceOptions } from '../propertyHelpers';
import { MacroReferencesSection } from '../../properties/MacroReferencesSection';

export function OutputMeterProperties({ object, objects, onPatch, onCreateAttributeReference }: {
  object: EditorObject;
  objects: EditorObject[];
  onPatch: (changes: Partial<EditorObject>) => void;
  onCreateAttributeReference: (kind: ReferenceKind) => void;
}) {
  const varOpts = nullableReferenceOptions(objects, 'number-variable', 'None — use local value', '+ Create Number Variable', '__create_number-variable');

  return (
    <>
      <PropertySection title="Appearance">
        <VtColorField label="Needle Color" value={object.needleColor ?? 0} onChange={(needleColor) => onPatch({ needleColor })} />
        <VtColorField label="Border Color" value={object.borderColorIndex ?? 0} onChange={(borderColorIndex) => onPatch({ borderColorIndex })} />
        <VtColorField label="Arc & Tick Color" value={object.arcAndTickColor ?? 0} onChange={(arcAndTickColor) => onPatch({ arcAndTickColor })} />
        <Field label="Width" value={object.width} type="number" onChange={(width) => { const w = Math.round(Number(width) || 0); onPatch({ width: w, height: w }); }} />
      </PropertySection>
      <PropertySection title="Scale">
        <Field label="Min Value" value={object.minValue ?? 0} type="number" onChange={(minValue) => onPatch({ minValue: Math.round(Number(minValue) || 0) })} />
        <Field label="Max Value" value={object.maxValue ?? 0} type="number" onChange={(maxValue) => onPatch({ maxValue: Math.round(Number(maxValue) || 0) })} />
        <Field label="Number of Ticks" value={object.numberOfTicks ?? 5} type="number" onChange={(numberOfTicks) => onPatch({ numberOfTicks: Math.round(Number(numberOfTicks) || 0) })} />
      </PropertySection>
      <PropertySection title="Arc">
        <CheckboxField label="Draw Arc" checked={((object.meterOptions ?? 0) & 1) !== 0} onChange={(v) => onPatch({ meterOptions: v ? (object.meterOptions ?? 0) | 1 : (object.meterOptions ?? 0) & ~1 })} />
        <CheckboxField label="Draw Border" checked={((object.meterOptions ?? 0) & 2) !== 0} onChange={(v) => onPatch({ meterOptions: v ? (object.meterOptions ?? 0) | 2 : (object.meterOptions ?? 0) & ~2 })} />
        <CheckboxField label="Draw Ticks" checked={((object.meterOptions ?? 0) & 4) !== 0} onChange={(v) => onPatch({ meterOptions: v ? (object.meterOptions ?? 0) | 4 : (object.meterOptions ?? 0) & ~4 })} />
        <CheckboxField label="Clockwise" checked={((object.meterOptions ?? 0) & 8) !== 0} onChange={(v) => onPatch({ meterOptions: v ? (object.meterOptions ?? 0) | 8 : (object.meterOptions ?? 0) & ~8 })} />
      </PropertySection>
      <PropertySection title="Angles">
        <Field label="Start Angle (×2)" value={object.startAngle ?? 110} type="number" onChange={(startAngle) => onPatch({ startAngle: Math.round(Number(startAngle) || 0) })} />
        <Field label="End Angle (×2)" value={object.endAngle ?? 35} type="number" onChange={(endAngle) => onPatch({ endAngle: Math.round(Number(endAngle) || 0) })} />
      </PropertySection>
      <PropertySection title="Value">
        <SelectField label="Variable Reference" value={object.variableReference ?? '__null'} options={varOpts} onChange={(value) => handleRefSelect(value, 'number-variable', (id) => ({ variableReference: id === '__null' ? null : id }), onPatch, onCreateAttributeReference)} />
        <Field label="Local Value" value={object.value ?? 0} type="number" onChange={(value) => {
          const minVal = object.minValue ?? 0;
          const maxVal = object.maxValue ?? 0;
          const clamped = Math.max(minVal, Math.min(maxVal, Math.round(Number(value) || 0)));
          onPatch({ value: clamped });
        }} />
      </PropertySection>
      <MacroReferencesSection object={object} objects={objects} onPatch={onPatch} />
    </>
  );
}
