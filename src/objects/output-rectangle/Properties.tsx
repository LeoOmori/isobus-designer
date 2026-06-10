import {
  RECTANGLE_LINE_SUPPRESSION_BOTTOM,
  RECTANGLE_LINE_SUPPRESSION_LEFT,
  RECTANGLE_LINE_SUPPRESSION_RIGHT,
  RECTANGLE_LINE_SUPPRESSION_TOP,
} from '../../domain/isobus';
import type { EditorObject, ReferenceKind } from '../../domain/types';
import { CheckboxField, PropertySection, SelectField } from '../../properties/fields';
import { handleRefSelect, nullableReferenceOptions, patchBit, referenceOptions } from '../propertyHelpers';
import { MacroReferencesSection } from '../../properties/MacroReferencesSection';

export function OutputRectangleProperties({ object, objects, onPatch, onCreateAttributeReference }: {
  object: EditorObject;
  objects: EditorObject[];
  onPatch: (changes: Partial<EditorObject>) => void;
  onCreateAttributeReference: (kind: ReferenceKind) => void;
}) {
  const lineAttrOpts = referenceOptions(objects, 'line-attribute', '+ Create Line Attribute', '__create_line-attribute');
  const fillAttrOpts = nullableReferenceOptions(objects, 'fill-attribute', 'NULL — no fill', '+ Create Fill Attribute', '__create_fill-attribute');

  return (
    <>
      <PropertySection title="Appearance">
        <SelectField label="Line Attribute" value={object.lineAttributeId ?? ''} options={lineAttrOpts} onChange={(value) => handleRefSelect(value, 'line-attribute', (id) => ({ lineAttributeId: id }), onPatch, onCreateAttributeReference)} />
        <SelectField label="Fill Attribute" value={object.fillAttributeId ?? '__null'} options={fillAttrOpts} onChange={(value) => handleRefSelect(value, 'fill-attribute', (id) => ({ fillAttributeId: id === '__null' ? null : id }), onPatch, onCreateAttributeReference)} />
      </PropertySection>
      <PropertySection title="Line Suppression">
        <CheckboxField label="Top" checked={((object.lineSuppression ?? 0) & RECTANGLE_LINE_SUPPRESSION_TOP) !== 0} onChange={(value) => onPatch({ lineSuppression: patchBit(object.lineSuppression, RECTANGLE_LINE_SUPPRESSION_TOP, value) })} />
        <CheckboxField label="Right" checked={((object.lineSuppression ?? 0) & RECTANGLE_LINE_SUPPRESSION_RIGHT) !== 0} onChange={(value) => onPatch({ lineSuppression: patchBit(object.lineSuppression, RECTANGLE_LINE_SUPPRESSION_RIGHT, value) })} />
        <CheckboxField label="Bottom" checked={((object.lineSuppression ?? 0) & RECTANGLE_LINE_SUPPRESSION_BOTTOM) !== 0} onChange={(value) => onPatch({ lineSuppression: patchBit(object.lineSuppression, RECTANGLE_LINE_SUPPRESSION_BOTTOM, value) })} />
        <CheckboxField label="Left" checked={((object.lineSuppression ?? 0) & RECTANGLE_LINE_SUPPRESSION_LEFT) !== 0} onChange={(value) => onPatch({ lineSuppression: patchBit(object.lineSuppression, RECTANGLE_LINE_SUPPRESSION_LEFT, value) })} />
        <CheckboxField label="Suppress all" checked={(object.lineSuppression ?? 0) === 0b1111} onChange={(value) => onPatch({ lineSuppression: value ? 0b1111 : 0 })} />
      </PropertySection>
      <MacroReferencesSection object={object} objects={objects} onPatch={onPatch} />
    </>
  );
}
