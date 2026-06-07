import { X } from 'lucide-react';
import { objectKindName } from '../../domain/objectMeta';
import type { EditorObject } from '../../domain/types';
import { Field, PropertySection, SelectField, VtColorField } from '../../properties/fields';

export function SoftKeyMaskProperties({ object, objects, onPatch }: { object: EditorObject; objects: EditorObject[]; onPatch: (changes: Partial<EditorObject>) => void }) {
  const keys = (object.keys ?? [])
    .map((id) => objects.find((candidate) => candidate.id === id && candidate.kind === 'key'))
    .filter((candidate): candidate is EditorObject => candidate !== undefined);

  return (
    <PropertySection title="Soft Key Mask">
      <VtColorField label="Background" value={object.backgroundColorIndex ?? 1} onChange={(backgroundColorIndex) => onPatch({ backgroundColorIndex })} />
      <SelectField label="Layout Preview" value={object.layoutPreview ?? 'vertical'} options={[{ value: 'vertical', label: 'Vertical' }, { value: 'horizontal', label: 'Horizontal' }]} onChange={(layoutPreview) => onPatch({ layoutPreview: layoutPreview as 'vertical' | 'horizontal' })} />
      <Field label="Key Count Preview" value={object.softKeyCountPreview ?? 6} type="number" onChange={(value) => onPatch({ softKeyCountPreview: Number(value) })} />
      <div className="field-hint">Keys</div>
      {keys.length === 0 ? <div className="field-hint">No keys assigned.</div> : keys.map((key, index) => {
        const next = [...(object.keys ?? [])];
        const move = (delta: number) => {
          const to = index + delta;
          if (to < 0 || to >= next.length) return;
          [next[index], next[to]] = [next[to], next[index]];
          onPatch({ keys: next });
        };
        return (
          <div key={key.id} className="designator-row">
            <div className="designator-fields">
              <div className="field-hint">{index + 1}. {key.id} — {key.name} ({objectKindName(key.kind)})</div>
            </div>
            <div className="designator-actions">
              <button type="button" className="field-btn" onClick={() => move(-1)} disabled={index === 0}>↑</button>
              <button type="button" className="field-btn" onClick={() => move(1)} disabled={index === keys.length - 1}>↓</button>
              <button type="button" className="designator-remove" onClick={() => onPatch({ keys: (object.keys ?? []).filter((_, itemIndex) => itemIndex !== index) })} title="Remove key">
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </PropertySection>
  );
}
