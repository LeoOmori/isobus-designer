import { useMemo } from 'react';
import type { ObjectKind } from '../../domain/types';
import type { ObjectPropertiesProps } from '../ObjectModule';
import { SelectField, PropertySection, Field } from '../../properties/fields';

function validTargetKinds(parentKind: string | undefined): Set<ObjectKind> {
  switch (parentKind) {
    case 'soft-key-mask': return new Set<ObjectKind>(['key']);
    case 'key':           return new Set<ObjectKind>(['container', 'output-string', 'output-number', 'output-rectangle', 'picture-graphic']);
    case 'button':        return new Set<ObjectKind>(['output-string', 'output-number', 'output-rectangle', 'picture-graphic']);
    default:              return new Set<ObjectKind>(['container', 'button', 'output-string', 'output-number', 'output-rectangle', 'output-line', 'output-ellipse', 'picture-graphic']);
  }
}

export function ObjectPointerProperties({ object, objects, onPatch }: ObjectPropertiesProps) {
  const parent = object.parentId ? objects.find((o) => o.id === object.parentId) : undefined;
  const target = object.pointerValue ? objects.find((o) => o.id === object.pointerValue) : undefined;
  const validKinds = validTargetKinds(parent?.kind);

  const options = useMemo(() => {
    const list: { value: string; label: string }[] = [
      { value: '', label: 'NULL — no reference' },
    ];
    for (const o of objects) {
      if (o.id === object.id) continue;
      if (!validKinds.has(o.kind)) continue;
      list.push({ value: o.id, label: `${o.name} (${o.id})` });
    }
    return list;
  }, [objects, object.id, validKinds]);

  return (
    <PropertySection title="Object Pointer">
      <Field label="Object ID" value={object.objectId} type="text" onChange={() => {}} disabled />
      <Field label="Target" value={target ? `${target.name} (${target.id})` : 'NULL'} type="text" onChange={() => {}} disabled />
      <SelectField
        label="Target Object"
        value={object.pointerValue ?? ''}
        options={options}
        onChange={(v) => {
          const t = v ? objects.find((o) => o.id === v) : undefined;
          onPatch({
            pointerValue: v || null,
            ...(t ? { width: t.width, height: t.height } : { width: 20, height: 20 }),
          });
        }}
      />
    </PropertySection>
  );
}
