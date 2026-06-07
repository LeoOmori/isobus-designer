import { Archive, Trash2, X } from 'lucide-react';
import {
  BUTTON_OPTION_DISABLED,
  BUTTON_OPTION_LATCHABLE,
  BUTTON_OPTION_LATCHED,
  BUTTON_OPTION_NO_BORDER,
  BUTTON_OPTION_SUPPRESS_BORDER,
  BUTTON_OPTION_TRANSPARENT_BACKGROUND,
  clamp,
} from '../domain/isobus';
import { objectKindName } from '../domain/objectMeta';
import type { EditorObject, ReferenceKind, WorkingSet, WorkingSetDesignator } from '../domain/types';
import { Panel } from '../ui/primitives';
import { OutputStringProperties } from '../objects/output-string/Properties';
import { referencePropertyComponents } from '../objects/referencePropertyRegistry';
import { CheckboxField, Field, PropertySection, SelectField, VtColorField } from './fields';

// ── Helpers ───────────────────────────────────────────────────────────────

function patchBit(current: number | undefined, bit: number, enabled: boolean) {
  return enabled ? (current ?? 0) | bit : (current ?? 0) & ~bit;
}

const REFERENCE_ONLY = new Set<EditorObject['kind']>([
  'line-attribute', 'fill-attribute', 'font-attribute', 'string-variable', 'number-variable',
]);

const NO_LAYOUT = new Set<EditorObject['kind']>([
  'line-attribute', 'fill-attribute', 'font-attribute', 'string-variable', 'number-variable',
  'soft-key-mask', 'key',
]);

// ── Working Set ───────────────────────────────────────────────────────────

export function WorkingSetProperties({ workingSet, masks, objects, onPatch }: {
  workingSet: WorkingSet;
  masks: EditorObject[];
  objects: EditorObject[];
  onPatch: (changes: Partial<WorkingSet>) => void;
}) {
  const maskOptions = [{ value: '', label: 'None' }, ...masks.map((m) => ({ value: m.id, label: `${m.id} — ${m.name}` }))];

  // Objects eligible as designators (practical: any canvas-renderable object)
  const designatorCandidates = objects.filter(
    (o) => o.kind === 'picture-graphic' || o.kind === 'output-string' || o.kind === 'output-number' || o.kind === 'output-rectangle',
  );
  const designatorOptions = [
    { value: '', label: '— Select —' },
    ...designatorCandidates.map((o) => ({ value: o.id, label: `${o.id} — ${o.name}` })),
  ];

  let designatorKeyCounter = (workingSet.designatorObjects ?? []).length;

  function addDesignator() {
    const next = [...(workingSet.designatorObjects ?? [])];
    next.push({ objectId: '', x: 0, y: 0 });
    onPatch({ designatorObjects: next });
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
        <Field label="Object ID"  value={workingSet.objectId}  disabled onChange={() => undefined} />
        <Field label="Name"       value={workingSet.name}       onChange={(name)       => onPatch({ name })} />
        <Field label="Version"    value={workingSet.version}    onChange={(version)    => onPatch({ version })} />
        <Field label="Language"   value={workingSet.language}   onChange={(language)   => onPatch({ language })} />
        <Field label="Description" value={workingSet.description ?? ''} onChange={(description) => onPatch({ description })} />
        <SelectField label="Active Data Mask" value={workingSet.activeDataMaskId} options={maskOptions} onChange={(activeDataMaskId) => onPatch({ activeDataMaskId })} />
        <Field label="Background" value={workingSet.backgroundColor} type="color" onChange={(backgroundColor) => onPatch({ backgroundColor })} />
        <CheckboxField label="Selectable" checked={workingSet.selectable ?? true} onChange={(selectable) => onPatch({ selectable })} />
      </PropertySection>
      <PropertySection title="Designator Objects" defaultOpen={false}>
        {(workingSet.designatorObjects ?? []).length === 0 && (
          <div className="field-hint">No designator objects. Add a Picture Graphic or Output String to identify this Working Set on the VT.</div>
        )}
        {workingSet.designatorObjects?.map((designator, designatorIndex) => {
          const idx = designatorIndex; // opaque alias to avoid lint
          return (
          <div key={`des-${designator.objectId}-${idx}`} className="designator-row">
            <div className="designator-fields">
              <SelectField
                label="Object"
                value={designator.objectId}
                options={designatorOptions}
                onChange={(objectId) => patchDesignator(idx, { objectId })}
              />
              <div className="field-row">
                <Field label="X" value={designator.x} type="number" onChange={(x) => patchDesignator(idx, { x: Number(x) })} />
                <Field label="Y" value={designator.y} type="number" onChange={(y) => patchDesignator(idx, { y: Number(y) })} />
              </div>
            </div>
            <button type="button" className="designator-remove" onClick={() => removeDesignator(idx)} title="Remove designator">
              <X size={14} />
            </button>
          </div>
          );
        })}
        <button type="button" className="field-btn" onClick={addDesignator}>+ Add Designator</button>
      </PropertySection>
    </Panel>
  );
}

// ── Main PropertiesPanel ──────────────────────────────────────────────────

export function PropertiesPanel({ selectedObject, masks, softKeyMasks, objects, onPatch, onDelete, onLayer, onCreateAttributeReference }: {
  selectedObject: EditorObject;
  masks: EditorObject[];
  softKeyMasks: EditorObject[];
  objects: EditorObject[];
  onPatch: (changes: Partial<EditorObject>) => void;
  onDelete: () => void;
  onLayer: (action: 'front' | 'back' | 'forward' | 'backward') => void;
  onCreateAttributeReference: (kind: ReferenceKind) => void;
}) {
  const kind       = selectedObject.kind;
  const isRefOnly  = REFERENCE_ONLY.has(kind);
  const isNoLayout = NO_LAYOUT.has(kind);

  const maskOptions    = [{ value: '', label: 'None' }, ...masks.filter((m) => m.id !== selectedObject.id).map((m) => ({ value: m.id, label: `${m.id} — ${m.name}` }))];
  const skmOptions     = [{ value: '', label: 'None' }, ...softKeyMasks.map((s) => ({ value: s.id, label: `${s.id} — ${s.name}` }))];

  const buttonChildren = kind === 'button'
    ? objects.filter((object) => (selectedObject.childObjectIds ?? []).includes(object.id))
    : [];
  const containerChildren = kind === 'container'
    ? objects.filter((object) => (selectedObject.childObjectIds ?? []).includes(object.id))
    : [];
  const selectedSoftKeyMaskKeys = kind === 'soft-key-mask'
    ? (selectedObject.keys ?? [])
        .map((id) => objects.find((object) => object.id === id && object.kind === 'key'))
        .filter((object): object is EditorObject => object !== undefined)
    : [];
  const keyChildren = kind === 'key'
    ? objects.filter((object) => (selectedObject.childObjectIds ?? []).includes(object.id))
    : [];
  const ReferenceProperties = referencePropertyComponents[kind];

  return (
    <Panel title="Object Parameter Editor">
      {/* Header */}
      <div className="properties-title">
        <strong>{objectKindName(kind)}: {selectedObject.id}</strong>
        <span>
          <button type="button" onClick={() => onLayer('forward')}>↑</button>
          <button type="button" onClick={() => onLayer('backward')}>↓</button>
          <button type="button" onClick={onDelete}><Trash2 size={16} /></button>
        </span>
      </div>

      {/* ── General ──────────────────────────────────────────────────── */}
      <PropertySection title="General">
        <Field label="Object ID" value={selectedObject.objectId} disabled onChange={() => undefined} />
        <Field label="Name"      value={selectedObject.name}     onChange={(name) => onPatch({ name })} />
        <Field label="Notes"     value={selectedObject.notes ?? ''} onChange={(notes) => onPatch({ notes })} />
        {!isNoLayout && kind !== 'picture-graphic' && (
          <div className="field-row">
            <Field label="Width"  value={selectedObject.width}  type="number" onChange={(w) => onPatch({ width: Number(w) })} />
            <Field label="Height" value={selectedObject.height} type="number" onChange={(h) => onPatch({ height: Number(h) })} />
          </div>
        )}
        {kind === 'data-mask' && (
          <Field label="Background" value={selectedObject.backgroundColor} type="color" onChange={(backgroundColor) => onPatch({ backgroundColor })} />
        )}
      </PropertySection>

      {/* ── Layout ──────────────────────────────────────────────────── */}
      {!isNoLayout && (
        <PropertySection title="Layout">
          <div className="field-row">
            <Field label="X" value={selectedObject.x} type="number" onChange={(x) => onPatch({ x: Number(x) })} />
            <Field label="Y" value={selectedObject.y} type="number" onChange={(y) => onPatch({ y: Number(y) })} />
          </div>
          <CheckboxField label="Visible" checked={selectedObject.visible} onChange={(visible) => onPatch({ visible })} />
          {(kind === 'data-mask' || kind === 'soft-key-mask') && (
            <CheckboxField label="Locked" checked={selectedObject.locked ?? false} onChange={(locked) => onPatch({ locked })} />
          )}
        </PropertySection>
      )}

      {/* ── Data Mask ────────────────────────────────────────────────── */}
      {kind === 'data-mask' && (
        <PropertySection title="Navigation">
          <SelectField label="Soft Key Mask"  value={selectedObject.softKeyMaskId ?? ''} options={skmOptions}  onChange={(id) => onPatch({ softKeyMaskId: id })} />
          <SelectField label="Next Mask"      value={selectedObject.nextMaskId ?? ''}     options={maskOptions} onChange={(id) => onPatch({ nextMaskId: id })} />
          <SelectField label="Previous Mask"  value={selectedObject.previousMaskId ?? ''} options={maskOptions} onChange={(id) => onPatch({ previousMaskId: id })} />
        </PropertySection>
      )}

      {/* ── Soft Key Mask ─────────────────────────────────────────────── */}
      {kind === 'soft-key-mask' && (
        <PropertySection title="Soft Key Mask">
          <VtColorField label="Background" value={selectedObject.backgroundColorIndex ?? 1} onChange={(backgroundColorIndex) => onPatch({ backgroundColorIndex })} />
          <SelectField label="Layout Preview" value={selectedObject.layoutPreview ?? 'vertical'} options={[{ value: 'vertical', label: 'Vertical' }, { value: 'horizontal', label: 'Horizontal' }]} onChange={(layoutPreview) => onPatch({ layoutPreview: layoutPreview as 'vertical' | 'horizontal' })} />
          <Field label="Key Count Preview" value={selectedObject.softKeyCountPreview ?? 6} type="number" onChange={(v) => onPatch({ softKeyCountPreview: Number(v) })} />
          <div className="field-hint">Keys</div>
          {selectedSoftKeyMaskKeys.length === 0 ? (
            <div className="field-hint">No keys assigned.</div>
          ) : selectedSoftKeyMaskKeys.map((key, index) => {
            const next = [...(selectedObject.keys ?? [])];
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
                  <button type="button" className="field-btn" onClick={() => move(1)} disabled={index === selectedSoftKeyMaskKeys.length - 1}>↓</button>
                  <button type="button" className="designator-remove" onClick={() => onPatch({ keys: (selectedObject.keys ?? []).filter((_, i) => i !== index) })} title="Remove key">
                    <X size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </PropertySection>
      )}

      {/* ── Key ──────────────────────────────────────────────────────── */}
      {kind === 'key' && (
        <PropertySection title="Key">
          <Field label="Label"      value={selectedObject.label ?? ''}      onChange={(label) => onPatch({ label })} />
          <Field label="Key Code"   value={selectedObject.keyCode ?? 1}     type="number" onChange={(v) => onPatch({ keyCode: clamp(Math.round(Number(v) || 0), 1, 255) })} />
          <VtColorField label="Background" value={selectedObject.backgroundColorIndex ?? 1} onChange={(backgroundColorIndex) => onPatch({ backgroundColorIndex })} />
          <Field label="Action"     value={selectedObject.actionName ?? ''}  onChange={(actionName) => onPatch({ actionName })} />
          <div className="field-hint">Children</div>
          {keyChildren.length === 0 ? (
            <div className="field-hint">No child designator objects.</div>
          ) : keyChildren.map((child) => (
            <div key={child.id} className="field-hint">{child.id} — {objectKindName(child.kind)} at {child.x}, {child.y}</div>
          ))}
        </PropertySection>
      )}

      {/* ── Button ───────────────────────────────────────────────────── */}
      {kind === 'button' && (
        <>
          <PropertySection title="Button">
            <Field label="Key Code" value={selectedObject.keyCode ?? 0} type="number" onChange={(v) => onPatch({ keyCode: clamp(Math.round(Number(v) || 0), 0, 255) })} />
            <VtColorField label="Background" value={selectedObject.backgroundColorIndex ?? 1} onChange={(backgroundColorIndex) => onPatch({ backgroundColorIndex })} />
            <VtColorField label="Border Color" value={selectedObject.borderColorIndex ?? 0} onChange={(borderColorIndex) => onPatch({ borderColorIndex })} />
          </PropertySection>
          <PropertySection title="Options">
            <CheckboxField label="Latchable" checked={((selectedObject.buttonOptions ?? 0) & BUTTON_OPTION_LATCHABLE) !== 0} onChange={(v) => {
              const next = patchBit(selectedObject.buttonOptions, BUTTON_OPTION_LATCHABLE, v);
              onPatch({ buttonOptions: v ? next : next & ~BUTTON_OPTION_LATCHED });
            }} />
            <CheckboxField label="Latched" checked={((selectedObject.buttonOptions ?? 0) & BUTTON_OPTION_LATCHED) !== 0} disabled={((selectedObject.buttonOptions ?? 0) & BUTTON_OPTION_LATCHABLE) === 0} onChange={(v) => onPatch({ buttonOptions: patchBit(selectedObject.buttonOptions, BUTTON_OPTION_LATCHED, v) })} />
            <CheckboxField label="Suppress Border" checked={((selectedObject.buttonOptions ?? 0) & BUTTON_OPTION_SUPPRESS_BORDER) !== 0} onChange={(v) => onPatch({ buttonOptions: patchBit(selectedObject.buttonOptions, BUTTON_OPTION_SUPPRESS_BORDER, v) })} />
            <CheckboxField label="Transparent Background" checked={((selectedObject.buttonOptions ?? 0) & BUTTON_OPTION_TRANSPARENT_BACKGROUND) !== 0} onChange={(v) => onPatch({ buttonOptions: patchBit(selectedObject.buttonOptions, BUTTON_OPTION_TRANSPARENT_BACKGROUND, v) })} />
            <CheckboxField label="Disabled" checked={((selectedObject.buttonOptions ?? 0) & BUTTON_OPTION_DISABLED) !== 0} onChange={(v) => onPatch({ buttonOptions: patchBit(selectedObject.buttonOptions, BUTTON_OPTION_DISABLED, v) })} />
            <CheckboxField label="No Border" checked={((selectedObject.buttonOptions ?? 0) & BUTTON_OPTION_NO_BORDER) !== 0} onChange={(v) => onPatch({ buttonOptions: patchBit(selectedObject.buttonOptions, BUTTON_OPTION_NO_BORDER, v) })} />
          </PropertySection>
          <PropertySection title="Children">
            {buttonChildren.length === 0 ? (
              <div className="field-hint">Select an output tool, then click inside this Button to add a child object.</div>
            ) : buttonChildren.map((child) => (
              <div key={child.id} className="field-hint">{child.id} — {objectKindName(child.kind)} at {child.x}, {child.y}</div>
            ))}
          </PropertySection>
        </>
      )}

      {/* ── Container ────────────────────────────────────────────────── */}
      {kind === 'container' && (
        <>
          <PropertySection title="Container">
            <CheckboxField label="Hidden at Runtime" checked={selectedObject.hidden ?? false} onChange={(hidden) => onPatch({ hidden })} />
            <div className="field-hint">Hidden containers and their children are skipped by the VT.</div>
          </PropertySection>
          <PropertySection title="Children">
            {containerChildren.length === 0 ? (
              <div className="field-hint">Select a canvas tool, then click inside this Container to add a child object.</div>
            ) : containerChildren.map((child) => (
              <div key={child.id} className="field-hint">{child.id} — {objectKindName(child.kind)} at {child.x}, {child.y}</div>
            ))}
          </PropertySection>
        </>
      )}

      {/* ── Output String ─────────────────────────────────────────────── */}
      {kind === 'output-string' && (
        <OutputStringProperties
          object={selectedObject}
          objects={objects}
          onPatch={onPatch}
          onCreateAttributeReference={onCreateAttributeReference}
        />
      )}

      {ReferenceProperties && (
        <ReferenceProperties
          object={selectedObject}
          objects={objects}
          onPatch={onPatch}
          onCreateAttributeReference={onCreateAttributeReference}
        />
      )}

      {/* ── Events & Macros (placeholder) ─────────────────────────────── */}
      <PropertySection title="Events & Macros" defaultOpen={false} />
    </Panel>
  );
}
