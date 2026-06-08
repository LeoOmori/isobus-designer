import { Archive, X } from 'lucide-react';
import type { EditorObject, WorkingSet, WorkingSetDesignator } from '../../domain/types';
import { CheckboxField, Field, PropertySection, SelectField } from '../../properties/fields';
import { Panel } from '../../ui/primitives';

export function WorkingSetProperties({ workingSet, masks, objects, onPatch }: {
  workingSet: WorkingSet;
  masks: EditorObject[];
  objects: EditorObject[];
  onPatch: (changes: Partial<WorkingSet>) => void;
}) {
  const maskOptions = [{ value: '', label: 'None' }, ...masks.map((mask) => ({ value: mask.id, label: `${mask.id} — ${mask.name}` }))];
  const designatorCandidates = objects.filter(
    (object) => object.kind === 'picture-graphic' || object.kind === 'output-string' || object.kind === 'output-number' || object.kind === 'output-rectangle',
  );
  const designatorOptions = [
    { value: '', label: '— Select —' },
    ...designatorCandidates.map((object) => ({ value: object.id, label: `${object.id} — ${object.name}` })),
  ];
  const designatorKeyCounts = new Map<string, number>();
  const designatorRows = (workingSet.designatorObjects ?? []).map((designator, index) => {
    const fingerprint = `${designator.objectId}-${designator.x}-${designator.y}`;
    const occurrence = designatorKeyCounts.get(fingerprint) ?? 0;
    designatorKeyCounts.set(fingerprint, occurrence + 1);
    return { designator, index, key: `des-${fingerprint}-${occurrence}` };
  });

  function addDesignator() {
    onPatch({ designatorObjects: [...(workingSet.designatorObjects ?? []), { objectId: '', x: 0, y: 0 }] });
  }

  function patchDesignator(index: number, change: Partial<WorkingSetDesignator>) {
    const next = [...(workingSet.designatorObjects ?? [])];
    next[index] = { ...next[index], ...change };
    onPatch({ designatorObjects: next });
  }

  function removeDesignator(index: number) {
    const next = [...(workingSet.designatorObjects ?? [])];
    next.splice(index, 1);
    onPatch({ designatorObjects: next });
  }

  return (
    <Panel title="Object Parameter Editor">
      <div className="properties-title">
        <strong>Working Set: {workingSet.id}</strong>
        <span><Archive size={16} /></span>
      </div>
      <PropertySection title="General">
        <Field label="Object ID" value={workingSet.objectId} disabled onChange={() => undefined} />
        <Field label="Name" value={workingSet.name} onChange={(name) => onPatch({ name })} />
        <Field label="Version" value={workingSet.version} onChange={(version) => onPatch({ version })} />
        <Field label="Language" value={workingSet.language} onChange={(language) => onPatch({ language })} />
        <Field label="Description" value={workingSet.description ?? ''} onChange={(description) => onPatch({ description })} />
        <SelectField label="Active Data Mask" value={workingSet.activeDataMaskId} options={maskOptions} onChange={(activeDataMaskId) => onPatch({ activeDataMaskId })} />
        <CheckboxField label="Selectable" checked={workingSet.selectable ?? true} onChange={(selectable) => onPatch({ selectable })} />
      </PropertySection>
      <PropertySection title="Designator Objects" defaultOpen={false}>
        {(workingSet.designatorObjects ?? []).length === 0 && (
          <div className="field-hint">No designator objects. Add a Picture Graphic or Output String to identify this Working Set on the VT.</div>
        )}
        {designatorRows.map(({ designator, index, key }) => (
          <div key={key} className="designator-row">
            <div className="designator-fields">
              <SelectField label="Object" value={designator.objectId} options={designatorOptions} onChange={(objectId) => patchDesignator(index, { objectId })} />
              <div className="field-row">
                <Field label="X" value={designator.x} type="number" onChange={(x) => patchDesignator(index, { x: Number(x) })} />
                <Field label="Y" value={designator.y} type="number" onChange={(y) => patchDesignator(index, { y: Number(y) })} />
              </div>
            </div>
            <button type="button" className="designator-remove" onClick={() => removeDesignator(index)} title="Remove designator">
              <X size={14} />
            </button>
          </div>
        ))}
        <button type="button" className="field-btn" onClick={addDesignator}>+ Add Designator</button>
      </PropertySection>
    </Panel>
  );
}
