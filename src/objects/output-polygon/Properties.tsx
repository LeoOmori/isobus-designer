import { clamp } from '../../domain/isobus';
import type { EditorObject, ReferenceKind } from '../../domain/types';
import { Field, PropertySection, SelectField } from '../../properties/fields';
import { handleRefSelect, nullableReferenceOptions, referenceOptions } from '../propertyHelpers';
import { MacroReferencesSection } from '../../properties/MacroReferencesSection';

const POLYGON_TYPE_OPTIONS = [
  { value: '0', label: 'Convex' },
  { value: '1', label: 'Non-convex' },
  { value: '2', label: 'Complex (safe default)' },
  { value: '3', label: 'Open (no fill)' },
];

export function OutputPolygonProperties({ object, objects, onPatch, onCreateAttributeReference }: {
  object: EditorObject;
  objects: EditorObject[];
  onPatch: (changes: Partial<EditorObject>) => void;
  onCreateAttributeReference: (kind: ReferenceKind) => void;
}) {
  const lineAttrOpts = referenceOptions(objects, 'line-attribute', '+ Create Line Attribute', '__create_line-attribute');
  const fillAttrOpts = nullableReferenceOptions(objects, 'fill-attribute', 'NULL — no fill', '+ Create Fill Attribute', '__create_fill-attribute');
  const points = object.polygonPoints ?? [];

  // Format points as "x,y" one per line
  const pointsText = points.map((p) => `${p.x},${p.y}`).join('\n');

  function parsePoints(text: string) {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsed: Array<{x: number; y: number}> = [];
    for (const line of lines) {
      const parts = line.split(',').map((s) => s.trim());
      if (parts.length >= 2) {
        const x = clamp(Math.round(Number(parts[0]) || 0), 0, 0xffff);
        const y = clamp(Math.round(Number(parts[1]) || 0), 0, 0xffff);
        parsed.push({ x, y });
      }
    }
    return parsed;
  }

  return (
    <>
      <PropertySection title="Output Polygon">
        <Field
          label="Width"
          value={object.width}
          type="number"
          onChange={(v) => onPatch({ width: clamp(Math.round(Number(v) || 130), 1, 0xffff) })}
        />
        <Field
          label="Height"
          value={object.height}
          type="number"
          onChange={(v) => onPatch({ height: clamp(Math.round(Number(v) || 90), 1, 0xffff) })}
        />
        <SelectField
          label="Polygon Type"
          value={String(object.polygonType ?? 2)}
          options={POLYGON_TYPE_OPTIONS}
          onChange={(v) => onPatch({ polygonType: Number(v) as 0 | 1 | 2 | 3 })}
        />
        <div className="field">
          <label className="field-label">Points (x,y per line)</label>
          <textarea
            className="field-input field-textarea"
            rows={5}
            value={pointsText}
            onChange={(e) => onPatch({ polygonPoints: parsePoints(e.target.value) })}
            style={{ fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
          />
        </div>
      </PropertySection>
      <PropertySection title="References">
        <SelectField
          label="Line Attribute"
          value={object.lineAttributeId ?? ''}
          options={lineAttrOpts}
          onChange={(v) => handleRefSelect(v, 'line-attribute', (id) => ({ lineAttributeId: id }), onPatch, onCreateAttributeReference)}
        />
        <SelectField
          label="Fill Attribute"
          value={object.fillAttributeId ?? '__null'}
          options={fillAttrOpts}
          onChange={(v) => handleRefSelect(v, 'fill-attribute', (id) => ({ fillAttributeId: id === '__null' ? null : id }), onPatch, onCreateAttributeReference)}
        />
      </PropertySection>
      <MacroReferencesSection object={object} objects={objects} onPatch={onPatch} />
    </>
  );
}
