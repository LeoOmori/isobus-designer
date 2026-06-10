import { Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { VT_MACRO_EVENTS } from '../domain/isobus';
import type { EditorObject, MacroReference } from '../domain/types';
import { PropertySection, SelectField } from './fields';

const EVENT_OPTIONS = [
  { value: '', label: '— select event —' },
  ...VT_MACRO_EVENTS.map(({ value, label }) => ({
    value: String(value),
    label: `${value} — ${label}`,
  })),
];

function newRef(): MacroReference {
  return { eventId: 24, macroId: 0, macroEditorId: undefined };
}

export function MacroReferencesSection({
  object,
  objects,
  onPatch,
}: {
  object: EditorObject;
  objects: EditorObject[];
  onPatch: (changes: Partial<EditorObject>) => void;
}) {
  const refs = object.macros ?? [];

  const macroOptions = useMemo(() => [
    { value: '', label: '— select macro —' },
    ...objects
      .filter((o) => o.kind === 'macro')
      .map((o) => ({ value: o.id, label: `${o.id} — ${o.name}` })),
  ], [objects]);

  function patch(next: MacroReference[]) {
    onPatch({ macros: next });
  }

  function add() {
    patch([...refs, newRef()]);
  }

  function remove(i: number) {
    patch(refs.filter((_, idx) => idx !== i));
  }

  function set(i: number, changes: Partial<MacroReference>) {
    patch(refs.map((r, idx) => idx === i ? { ...r, ...changes } : r));
  }

  return (
    <PropertySection title="Macro Events" defaultOpen={refs.length > 0}>
      {refs.map((ref, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 6, padding: '4px 6px', border: '1px solid #e5e7eb', borderRadius: 4 }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#6b7280', minWidth: 18 }}>{i + 1}</span>
            <button
              type="button"
              title="Remove"
              style={{ marginLeft: 'auto', padding: '2px 4px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
              onClick={() => remove(i)}
            >
              <Trash2 size={13} />
            </button>
          </div>
          <SelectField
            label="Event"
            value={String(ref.eventId)}
            options={EVENT_OPTIONS}
            onChange={(v) => set(i, { eventId: Number(v) || ref.eventId })}
          />
          <SelectField
            label="Macro"
            value={ref.macroEditorId ?? ''}
            options={macroOptions}
            onChange={(v) => set(i, { macroEditorId: v || undefined, macroId: 0 })}
          />
        </div>
      ))}

      {refs.length === 0 && (
        <div className="field-hint" style={{ fontSize: 11, color: '#9ca3af', padding: '4px 0' }}>
          No macro events. Add one to trigger a Macro when an event fires.
        </div>
      )}

      <button
        type="button"
        style={{
          display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
          padding: '4px 8px', cursor: 'pointer', background: 'none',
          border: '1px dashed #9ca3af', borderRadius: 4, color: '#6b7280',
          width: '100%', justifyContent: 'center', marginTop: 4,
        }}
        onClick={add}
      >
        <Plus size={13} /> Add Macro Event
      </button>
    </PropertySection>
  );
}
