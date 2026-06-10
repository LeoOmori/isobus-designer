import type { EditorObject, ReferenceKind } from '../../domain/types';
import { CheckboxField, Field, PropertySection, SelectField, VtColorField } from '../../properties/fields';
import { handleRefSelect, nullableReferenceOptions } from '../propertyHelpers';
import { MacroReferencesSection } from '../../properties/MacroReferencesSection';

export function OutputArchedBarGraphProperties({ object, objects, onPatch, onCreateAttributeReference }: {
  object: EditorObject;
  objects: EditorObject[];
  onPatch: (changes: Partial<EditorObject>) => void;
  onCreateAttributeReference: (kind: ReferenceKind) => void;
}) {
  const varOpts = nullableReferenceOptions(objects, 'number-variable', 'None — use local value', '+ Create Number Variable', '__create_number-variable');

  const archedBarOptions = object.archedBarOptions ?? 3;

  return (
    <>
      <PropertySection title="Layout">
        <Field label="Width" value={object.width} type="number" onChange={(width) => onPatch({ width: Math.round(Number(width) || 0) })} />
        <Field label="Height" value={object.height} type="number" onChange={(height) => onPatch({ height: Math.round(Number(height) || 0) })} />
        <Field label="Bar Graph Width" value={object.barGraphWidth ?? 12} type="number" onChange={(barGraphWidth) => onPatch({ barGraphWidth: Math.round(Number(barGraphWidth) || 0) })} />
      </PropertySection>
      <PropertySection title="Appearance">
        <VtColorField label="Color" value={object.backgroundColorIndex ?? 2} onChange={(backgroundColorIndex) => onPatch({ backgroundColorIndex })} />
        <VtColorField label="Target Line Color" value={object.targetLineColor ?? 4} onChange={(targetLineColor) => onPatch({ targetLineColor })} />
      </PropertySection>
      <PropertySection title="Arc">
        <Field 
          label="Start Angle (°)" 
          value={(object.arcStartAngle ?? 45) * 2} 
          type="number" 
          onChange={(angle) => onPatch({ arcStartAngle: Math.max(0, Math.min(180, Math.round(Number(angle) / 2 || 0))) })} 
        />
        <Field 
          label="End Angle (°)" 
          value={(object.arcEndAngle ?? 135) * 2} 
          type="number" 
          onChange={(angle) => onPatch({ arcEndAngle: Math.max(0, Math.min(180, Math.round(Number(angle) / 2 || 0))) })} 
        />
        <CheckboxField 
          label="Clockwise" 
          checked={(archedBarOptions & 16) !== 0} 
          onChange={(v) => onPatch({ archedBarOptions: v ? archedBarOptions | 16 : archedBarOptions & ~16 })} 
        />
      </PropertySection>
      <PropertySection title="Options">
        <CheckboxField 
          label="Draw Border" 
          checked={(archedBarOptions & 1) !== 0} 
          onChange={(v) => onPatch({ archedBarOptions: v ? archedBarOptions | 1 : archedBarOptions & ~1 })} 
        />
        <CheckboxField 
          label="Draw Target Line" 
          checked={(archedBarOptions & 2) !== 0} 
          onChange={(v) => onPatch({ archedBarOptions: v ? archedBarOptions | 2 : archedBarOptions & ~2 })} 
        />
        <CheckboxField 
          label="Value As Line" 
          checked={(archedBarOptions & 8) !== 0} 
          onChange={(v) => onPatch({ archedBarOptions: v ? archedBarOptions | 8 : archedBarOptions & ~8 })} 
        />
      </PropertySection>
      <PropertySection title="Scale">
        <Field label="Min Value" value={object.minValue ?? 0} type="number" onChange={(minValue) => onPatch({ minValue: Math.round(Number(minValue) || 0) })} />
        <Field label="Max Value" value={object.maxValue ?? 100} type="number" onChange={(maxValue) => onPatch({ maxValue: Math.round(Number(maxValue) || 0) })} />
      </PropertySection>
      <PropertySection title="Value">
        <SelectField label="Variable Reference" value={object.variableReference ?? '__null'} options={varOpts} onChange={(value) => handleRefSelect(value, 'number-variable', (id) => ({ variableReference: id === '__null' ? null : id }), onPatch, onCreateAttributeReference)} />
        <Field label="Local Value" value={object.value ?? 0} type="number" onChange={(value) => {
          const minVal = object.minValue ?? 0;
          const maxVal = object.maxValue ?? 100;
          const clamped = Math.max(minVal, Math.min(maxVal, Math.round(Number(value) || 0)));
          onPatch({ value: clamped });
        }} />
      </PropertySection>
      <PropertySection title="Target Value">
        <SelectField label="Target Variable Reference" value={object.targetValueVariableReference ?? '__null'} options={varOpts} onChange={(value) => handleRefSelect(value, 'number-variable', (id) => ({ targetValueVariableReference: id === '__null' ? null : id }), onPatch, onCreateAttributeReference)} />
        <Field label="Local Target Value" value={object.targetValue ?? 0} type="number" onChange={(targetValue) => {
          const minVal = object.minValue ?? 0;
          const maxVal = object.maxValue ?? 100;
          const clamped = Math.max(minVal, Math.min(maxVal, Math.round(Number(targetValue) || 0)));
          onPatch({ targetValue: clamped });
        }} />
      </PropertySection>
      <MacroReferencesSection object={object} objects={objects} onPatch={onPatch} />
    </>
  );
}