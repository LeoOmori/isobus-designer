import {
  BUTTON_OPTION_DISABLED,
  BUTTON_OPTION_LATCHABLE,
  BUTTON_OPTION_LATCHED,
  BUTTON_OPTION_NO_BORDER,
  BUTTON_OPTION_SUPPRESS_BORDER,
  BUTTON_OPTION_TRANSPARENT_BACKGROUND,
  clamp,
} from '../../domain/isobus';
import { objectKindName } from '../../domain/objectMeta';
import type { EditorObject } from '../../domain/types';
import { CheckboxField, Field, PropertySection, VtColorField } from '../../properties/fields';
import { patchBit } from '../propertyHelpers';
import { MacroReferencesSection } from '../../properties/MacroReferencesSection';

export function ButtonProperties({ object, objects, onPatch }: { object: EditorObject; objects: EditorObject[]; onPatch: (changes: Partial<EditorObject>) => void }) {
  const children = objects.filter((candidate) => (object.childObjectIds ?? []).includes(candidate.id));
  return (
    <>
      <PropertySection title="Button">
        <Field label="Key Code" value={object.keyCode ?? 0} type="number" onChange={(value) => onPatch({ keyCode: clamp(Math.round(Number(value) || 0), 0, 255) })} />
        <VtColorField label="Background" value={object.backgroundColorIndex ?? 1} onChange={(backgroundColorIndex) => onPatch({ backgroundColorIndex })} />
        <VtColorField label="Border Color" value={object.borderColorIndex ?? 0} onChange={(borderColorIndex) => onPatch({ borderColorIndex })} />
      </PropertySection>
      <PropertySection title="Options">
        <CheckboxField label="Latchable" checked={((object.buttonOptions ?? 0) & BUTTON_OPTION_LATCHABLE) !== 0} onChange={(value) => { const next = patchBit(object.buttonOptions, BUTTON_OPTION_LATCHABLE, value); onPatch({ buttonOptions: value ? next : next & ~BUTTON_OPTION_LATCHED }); }} />
        <CheckboxField label="Latched" checked={((object.buttonOptions ?? 0) & BUTTON_OPTION_LATCHED) !== 0} disabled={((object.buttonOptions ?? 0) & BUTTON_OPTION_LATCHABLE) === 0} onChange={(value) => onPatch({ buttonOptions: patchBit(object.buttonOptions, BUTTON_OPTION_LATCHED, value) })} />
        <CheckboxField label="Suppress Border" checked={((object.buttonOptions ?? 0) & BUTTON_OPTION_SUPPRESS_BORDER) !== 0} onChange={(value) => onPatch({ buttonOptions: patchBit(object.buttonOptions, BUTTON_OPTION_SUPPRESS_BORDER, value) })} />
        <CheckboxField label="Transparent Background" checked={((object.buttonOptions ?? 0) & BUTTON_OPTION_TRANSPARENT_BACKGROUND) !== 0} onChange={(value) => onPatch({ buttonOptions: patchBit(object.buttonOptions, BUTTON_OPTION_TRANSPARENT_BACKGROUND, value) })} />
        <CheckboxField label="Disabled" checked={((object.buttonOptions ?? 0) & BUTTON_OPTION_DISABLED) !== 0} onChange={(value) => onPatch({ buttonOptions: patchBit(object.buttonOptions, BUTTON_OPTION_DISABLED, value) })} />
        <CheckboxField label="No Border" checked={((object.buttonOptions ?? 0) & BUTTON_OPTION_NO_BORDER) !== 0} onChange={(value) => onPatch({ buttonOptions: patchBit(object.buttonOptions, BUTTON_OPTION_NO_BORDER, value) })} />
      </PropertySection>
      <PropertySection title="Children">
        {children.length === 0 ? <div className="field-hint">Select an output tool, then click inside this Button to add a child object.</div> : children.map((child) => (
          <div key={child.id} className="field-hint">{child.id} — {objectKindName(child.kind)} at {child.x}, {child.y}</div>
        ))}
      </PropertySection>
      <MacroReferencesSection object={object} objects={objects} onPatch={onPatch} />
    </>
  );
}
