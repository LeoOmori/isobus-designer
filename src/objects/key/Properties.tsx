import { X } from 'lucide-react';
import { clamp } from '../../domain/isobus';
import { objectKindName } from '../../domain/objectMeta';
import type { EditorObject } from '../../domain/types';
import { Field, PropertySection, VtColorField } from '../../properties/fields';

export function KeyProperties({ object, objects, onPatch }: { object: EditorObject; objects: EditorObject[]; onPatch: (changes: Partial<EditorObject>) => void }) {
  const children = objects.filter((candidate) => (object.childObjectIds ?? []).includes(candidate.id));
  return (
    <PropertySection title="Key">
      <Field label="Label" value={object.label ?? ''} onChange={(label) => onPatch({ label })} />
      <Field label="Key Code" value={object.keyCode ?? 1} type="number" onChange={(value) => onPatch({ keyCode: clamp(Math.round(Number(value) || 0), 1, 255) })} />
      <VtColorField label="Background" value={object.backgroundColorIndex ?? 1} onChange={(backgroundColorIndex) => onPatch({ backgroundColorIndex })} />
      <Field label="Action" value={object.actionName ?? ''} onChange={(actionName) => onPatch({ actionName })} />
      <div className="field-hint">Children</div>
      {children.length === 0 ? <div className="field-hint">No child designator objects.</div> : children.map((child) => (
        <div key={child.id} className="field-hint">{child.id} — {objectKindName(child.kind)} at {child.x}, {child.y}</div>
      ))}
    </PropertySection>
  );
}
