import type { EditorObject } from '../../domain/types';
import { PropertySection, SelectField, VtColorField } from '../../properties/fields';

const PRIORITY_OPTIONS = [
  { value: '0', label: '0 — High' },
  { value: '1', label: '1 — Medium' },
  { value: '2', label: '2 — Low' },
];

const ACOUSTIC_OPTIONS = [
  { value: '0', label: '0 — Highest priority sound' },
  { value: '1', label: '1 — Medium priority sound' },
  { value: '2', label: '2 — Lowest priority sound' },
  { value: '3', label: '3 — Silent' },
];

export function AlarmMaskProperties({ object, objects, onPatch }: {
  object: EditorObject;
  objects: EditorObject[];
  onPatch: (changes: Partial<EditorObject>) => void;
}) {
  const softKeyMasks = objects.filter((candidate) => candidate.kind === 'soft-key-mask');
  const skmOptions = [{ value: '', label: 'None' }, ...softKeyMasks.map((skm) => ({ value: skm.id, label: `${skm.id} — ${skm.name}` }))];

  return (
    <>
      <PropertySection title="Appearance">
        <VtColorField label="Background" value={object.backgroundColorIndex ?? 1} onChange={(backgroundColorIndex) => onPatch({ backgroundColorIndex })} />
      </PropertySection>
      <PropertySection title="Alarm Configuration">
        <SelectField
          label="Priority"
          value={String(object.priority ?? 1)}
          options={PRIORITY_OPTIONS}
          onChange={(v) => onPatch({ priority: Number(v) as 0 | 1 | 2 })}
        />
        <SelectField
          label="Acoustic Signal"
          value={String(object.acousticSignal ?? 3)}
          options={ACOUSTIC_OPTIONS}
          onChange={(v) => onPatch({ acousticSignal: Number(v) as 0 | 1 | 2 | 3 })}
        />
        <SelectField
          label="Soft Key Mask"
          value={object.alarmSoftKeyMaskId ?? ''}
          options={skmOptions}
          onChange={(alarmSoftKeyMaskId) => onPatch({ alarmSoftKeyMaskId })}
        />
      </PropertySection>
    </>
  );
}
