import { Trash2 } from 'lucide-react';
import { objectKindName } from '../domain/objectMeta';
import type { EditorObject, ReferenceKind } from '../domain/types';
import { Panel } from '../ui/primitives';
import { objectRegistry } from '../objects/registry';
import { CheckboxField, Field, PropertySection } from './fields';

// ── Main PropertiesPanel ──────────────────────────────────────────────────

export function PropertiesPanel({ selectedObject, objects, onPatch, onDelete, onLayer, onCreateAttributeReference }: {
  selectedObject: EditorObject;
  objects: EditorObject[];
  onPatch: (changes: Partial<EditorObject>) => void;
  onDelete: () => void;
  onLayer: (action: 'front' | 'back' | 'forward' | 'backward') => void;
  onCreateAttributeReference: (kind: ReferenceKind) => void;
}) {
  const kind       = selectedObject.kind;
  const module     = objectRegistry[kind];
  const isNoLayout = !module.meta.hasLayout;

  const ObjectProperties = module.Properties;
  if (!ObjectProperties) throw new Error(`No Properties component registered for kind "${kind}"`);

  return (
    <Panel title="Object Parameter Editor">
      {/* Header */}
      <div className="properties-title">
        <strong>{objectKindName(kind)}: {selectedObject.id}</strong>
        <span>
          <button type="button" onClick={() => onLayer('backward')}>↑</button>
          <button type="button" onClick={() => onLayer('forward')}>↓</button>
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

      <ObjectProperties
        object={selectedObject}
        objects={objects}
        onPatch={onPatch}
        onCreateAttributeReference={onCreateAttributeReference}
      />

    </Panel>
  );
}
