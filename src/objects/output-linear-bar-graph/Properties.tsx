import type { EditorObject, ReferenceKind } from '../../domain/types';
import { CheckboxField, Field, PropertySection, SelectField, VtColorField } from '../../properties/fields';
import { handleRefSelect, nullableReferenceOptions } from '../propertyHelpers';
import { MacroReferencesSection } from '../../properties/MacroReferencesSection';

export function OutputLinearBarGraphProperties({ object, objects, onPatch, onCreateAttributeReference }: {
  object: EditorObject;
  objects: EditorObject[];
  onPatch: (changes: Partial<EditorObject>) => void;
  onCreateAttributeReference: (kind: ReferenceKind) => void;
}) {
  const varOpts = nullableReferenceOptions(objects, 'number-variable', 'None — use local value', '+ Create Number Variable', '__create_number-variable');

  const linearBarOptions = object.linearBarOptions ?? 1;

  return (
    <>
      <PropertySection title="Layout">
        <Field label="Width" value={object.width} type="number" onChange={(width) => onPatch({ width: Math.round(Number(width) || 0) })} />
        <Field label="Height" value={object.height} type="number" onChange={(height) => onPatch({ height: Math.round(Number(height) || 0) })} />
      </PropertySection>
      <PropertySection title="Appearance">
        <VtColorField label="Color" value={object.backgroundColorIndex ?? 2} onChange={(backgroundColorIndex) => onPatch({ backgroundColorIndex })} />
        <VtColorField label="Target Line Color" value={object.targetLineColor ?? 0} onChange={(targetLineColor) => onPatch({ targetLineColor })} />
      </PropertySection>
      <PropertySection title="Options">
        <CheckboxField 
          label="Draw Border" 
          checked={(linearBarOptions & 1) !== 0} 
          onChange={(v) => onPatch({ linearBarOptions: v ? linearBarOptions | 1 : linearBarOptions & ~1 })} 
        />
        <CheckboxField 
          label="Draw Target Line" 
          checked={(linearBarOptions & 2) !== 0} 
          onChange={(v) => onPatch({ linearBarOptions: v ? linearBarOptions | 2 : linearBarOptions & ~2 })} 
        />
        <CheckboxField 
          label="Draw Ticks" 
          checked={(linearBarOptions & 4) !== 0} 
          onChange={(v) => onPatch({ linearBarOptions: v ? linearBarOptions | 4 : linearBarOptions & ~4 })} 
        />
        <CheckboxField 
          label="Single Line Mode" 
          checked={(linearBarOptions & 8) !== 0} 
          onChange={(v) => onPatch({ linearBarOptions: v ? linearBarOptions | 8 : linearBarOptions & ~8 })} 
        />
        <CheckboxField 
          label="Horizontal" 
          checked={(linearBarOptions & 16) !== 0} 
          onChange={(v) => onPatch({ linearBarOptions: v ? linearBarOptions | 16 : linearBarOptions & ~16 })} 
        />
        <CheckboxField 
          label="Positive Direction" 
          checked={(linearBarOptions & 32) !== 0} 
          onChange={(v) => onPatch({ linearBarOptions: v ? linearBarOptions | 32 : linearBarOptions & ~32 })} 
        />
      </PropertySection>
      <PropertySection title="Scale">
        <Field label="Min Value" value={object.minValue ?? 0} type="number" onChange={(minValue) => onPatch({ minValue: Math.round(Number(minValue) || 0) })} />
        <Field label="Max Value" value={object.maxValue ?? 100} type="number" onChange={(maxValue) => onPatch({ maxValue: Math.round(Number(maxValue) || 0) })} />
        <Field label="Number of Ticks" value={object.numberOfTicks ?? 0} type="number" onChange={(numberOfTicks) => onPatch({ numberOfTicks: Math.round(Number(numberOfTicks) || 0) })} />
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