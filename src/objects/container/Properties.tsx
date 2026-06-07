import type { EditorObject } from '../../domain/types';
import { objectKindName } from '../../domain/objectMeta';
import { CheckboxField, PropertySection } from '../../properties/fields';

export function ContainerProperties({ object, objects, onPatch }: { object: EditorObject; objects: EditorObject[]; onPatch: (changes: Partial<EditorObject>) => void }) {
  const children = objects.filter((candidate) => (object.childObjectIds ?? []).includes(candidate.id));
  return (
    <>
      <PropertySection title="Container">
        <CheckboxField label="Hidden at Runtime" checked={object.hidden ?? false} onChange={(hidden) => onPatch({ hidden })} />
        <div className="field-hint">Hidden containers and their children are skipped by the VT.</div>
      </PropertySection>
      <PropertySection title="Children">
        {children.length === 0 ? <div className="field-hint">Select a canvas tool, then click inside this Container to add a child object.</div> : children.map((child) => (
          <div key={child.id} className="field-hint">{child.id} — {objectKindName(child.kind)} at {child.x}, {child.y}</div>
        ))}
      </PropertySection>
    </>
  );
}
