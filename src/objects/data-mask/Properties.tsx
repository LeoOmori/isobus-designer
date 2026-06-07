import type { EditorObject } from '../../domain/types';
import { PropertySection, SelectField } from '../../properties/fields';

export function DataMaskProperties({ object, objects, onPatch }: {
  object: EditorObject;
  objects: EditorObject[];
  onPatch: (changes: Partial<EditorObject>) => void;
}) {
  const masks = objects.filter((candidate) => candidate.kind === 'data-mask');
  const softKeyMasks = objects.filter((candidate) => candidate.kind === 'soft-key-mask');
  const maskOptions = [{ value: '', label: 'None' }, ...masks.filter((mask) => mask.id !== object.id).map((mask) => ({ value: mask.id, label: `${mask.id} — ${mask.name}` }))];
  const skmOptions = [{ value: '', label: 'None' }, ...softKeyMasks.map((skm) => ({ value: skm.id, label: `${skm.id} — ${skm.name}` }))];
  return (
    <PropertySection title="Navigation">
      <SelectField label="Soft Key Mask" value={object.softKeyMaskId ?? ''} options={skmOptions} onChange={(softKeyMaskId) => onPatch({ softKeyMaskId })} />
      <SelectField label="Next Mask" value={object.nextMaskId ?? ''} options={maskOptions} onChange={(nextMaskId) => onPatch({ nextMaskId })} />
      <SelectField label="Previous Mask" value={object.previousMaskId ?? ''} options={maskOptions} onChange={(previousMaskId) => onPatch({ previousMaskId })} />
    </PropertySection>
  );
}
