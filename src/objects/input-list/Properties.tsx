import { Plus, Trash2 } from 'lucide-react';
import { clamp } from '../../domain/isobus';
import type { EditorObject, ReferenceKind } from '../../domain/types';
import { CheckboxField, Field, PropertySection, SelectField, VtColorField } from '../../properties/fields';
import { handleRefSelect, nullableReferenceOptions } from '../propertyHelpers';

const VALID_LIST_ITEM_KINDS = ['output-string', 'output-number', 'picture-graphic', 'container'];

export function InputListProperties({ object, objects, onPatch, onCreateAttributeReference }: {
  object: EditorObject;
  objects: EditorObject[];
  onPatch: (changes: Partial<EditorObject>) => void;
  onCreateAttributeReference: (kind: ReferenceKind) => void;
}) {
  const numberVariableOpts = nullableReferenceOptions(
    objects, 'number-variable', 'NULL — use local value', '+ Create Number Variable', '__create_number-variable',
  );
  const variableReference = object.variableReference ?? null;
  const listItems = object.listItems ?? [];

  const listItemCandidates = objects.filter((o) => VALID_LIST_ITEM_KINDS.includes(o.kind));
  const listItemOptions = [
    { value: '', label: 'NULL (placeholder)' },
    ...listItemCandidates.map((o) => ({ value: o.id, label: `${o.id} — ${o.name}` })),
  ];

  function addListItem() {
    onPatch({ listItems: [...listItems, ''] });
  }

  function removeListItem(index: number) {
    const next = listItems.filter((_, i) => i !== index);
    onPatch({ listItems: next });
  }

  function setListItem(index: number, id: string) {
    const next = listItems.map((item, i) => (i === index ? id : item));
    onPatch({ listItems: next });
  }

  return (
    <>
      <PropertySection title="Input List">
        <VtColorField
          label="Background"
          value={object.backgroundColorIndex ?? 1}
          onChange={(backgroundColorIndex) => onPatch({ backgroundColorIndex })}
        />
        <Field
          label="Width"
          value={object.width}
          type="number"
          onChange={(v) => onPatch({ width: clamp(Math.round(Number(v) || 120), 1, 0xffff) })}
        />
        <Field
          label="Height"
          value={object.height}
          type="number"
          onChange={(v) => onPatch({ height: clamp(Math.round(Number(v) || 40), 1, 0xffff) })}
        />
        <Field
          label="Value (Index)"
          value={object.value ?? 255}
          type="number"
          onChange={(v) => {
            const num = Math.round(Number(v));
            onPatch({ value: Number.isNaN(num) ? 0 : clamp(num, 0, 255) });
          }}
        />
        <CheckboxField
          label="Enabled"
          checked={object.inputEnabled ?? true}
          onChange={(checked) => onPatch({ inputEnabled: checked })}
        />
        <CheckboxField
          label="Real-time Editing"
          checked={object.realTimeEditing ?? false}
          onChange={(checked) => onPatch({ realTimeEditing: checked })}
        />
      </PropertySection>

      <PropertySection title="List Items">
        {listItems.map((itemId, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={`item-${index}`} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#6b7280', minWidth: 18 }}>{index}</span>
            <SelectField
              label=""
              value={itemId}
              options={listItemOptions}
              onChange={(id) => setListItem(index, id)}
            />
            <button
              type="button"
              title="Remove item"
              style={{ flexShrink: 0, padding: '2px 4px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
              onClick={() => removeListItem(index)}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        <button
          type="button"
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '4px 8px', cursor: 'pointer', background: 'none', border: '1px dashed #9ca3af', borderRadius: 4, color: '#6b7280', width: '100%', justifyContent: 'center' }}
          onClick={addListItem}
        >
          <Plus size={13} /> Add Item
        </button>
      </PropertySection>

      <PropertySection title="References">
        <SelectField
          label="Variable Reference"
          value={variableReference ?? '__null'}
          options={numberVariableOpts}
          onChange={(v) => handleRefSelect(v, 'number-variable', (id) => ({ variableReference: id === '__null' ? null : id }), onPatch, onCreateAttributeReference)}
        />
      </PropertySection>
    </>
  );
}
