import { clamp } from '../../domain/isobus';
import type { EditorObject, ReferenceKind } from '../../domain/types';
import { Field, PropertySection, SelectField } from '../../properties/fields';
import { handleRefSelect, nullableReferenceOptions, referenceOptions } from '../propertyHelpers';

const ELLIPSE_TYPE_OPTIONS = [
  { value: '0', label: 'Closed Ellipse' },
  { value: '1', label: 'Open Arc' },
  { value: '2', label: 'Closed Segment' },
  { value: '3', label: 'Closed Section (Pie)' },
];

export function OutputEllipseProperties({ object, objects, onPatch, onCreateAttributeReference }: {
  object: EditorObject;
  objects: EditorObject[];
  onPatch: (changes: Partial<EditorObject>) => void;
  onCreateAttributeReference: (kind: ReferenceKind) => void;
}) {
  const lineAttrOpts = referenceOptions(objects, 'line-attribute', '+ Create Line Attribute', '__create_line-attribute');
  const fillAttrOpts = nullableReferenceOptions(objects, 'fill-attribute', 'NULL — no fill', '+ Create Fill Attribute', '__create_fill-attribute');
  const ellipseType = object.ellipseType ?? 0;

  return (
    <>
      <PropertySection title="Output Ellipse">
        <Field
          label="Width"
          value={object.width}
          type="number"
          onChange={(v) => onPatch({ width: clamp(Math.round(Number(v) || 100), 1, 0xffff) })}
        />
        <Field
          label="Height"
          value={object.height}
          type="number"
          onChange={(v) => onPatch({ height: clamp(Math.round(Number(v) || 80), 1, 0xffff) })}
        />
        <SelectField
          label="Ellipse Type"
          value={String(ellipseType)}
          options={ELLIPSE_TYPE_OPTIONS}
          onChange={(v) => onPatch({ ellipseType: Number(v) as 0 | 1 | 2 | 3 })}
        />
      </PropertySection>
      {ellipseType > 0 && (
        <PropertySection title="Angles">
          <Field
            label={`Start Angle (${(object.startAngle ?? 0) * 2}°)`}
            value={object.startAngle ?? 0}
            type="number"
            onChange={(v) => onPatch({ startAngle: clamp(Math.round(Number(v) || 0), 0, 180) })}
          />
          <Field
            label={`End Angle (${(object.endAngle ?? 0) * 2}°)`}
            value={object.endAngle ?? 0}
            type="number"
            onChange={(v) => onPatch({ endAngle: clamp(Math.round(Number(v) || 0), 0, 180) })}
          />
        </PropertySection>
      )}
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
    </>
  );
}
