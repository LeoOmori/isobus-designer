import type { EditorObject, ReferenceKind } from '../domain/types';

export function referenceOptions(objects: EditorObject[], kind: EditorObject['kind'], createLabel: string, createValue: string) {
  return [
    { value: '', label: 'None' },
    ...objects.filter((object) => object.kind === kind).map((object) => ({ value: object.id, label: `${object.id} — ${object.name}` })),
    { value: createValue, label: createLabel },
  ];
}

export function nullableReferenceOptions(objects: EditorObject[], kind: EditorObject['kind'], nullLabel: string, createLabel: string, createValue: string) {
  return [
    { value: '__null', label: nullLabel },
    ...objects.filter((object) => object.kind === kind).map((object) => ({ value: object.id, label: `${object.id} — ${object.name}` })),
    { value: createValue, label: createLabel },
  ];
}

export function handleRefSelect(
  value: string,
  refKind: ReferenceKind,
  patchFn: (id: string) => Partial<EditorObject>,
  onPatch: (changes: Partial<EditorObject>) => void,
  onCreateAttributeReference: (kind: ReferenceKind) => void,
) {
  if (value.startsWith('__create_')) return onCreateAttributeReference(refKind);
  onPatch(patchFn(value));
}

export function patchBit(current: number | undefined, bit: number, enabled: boolean) {
  return enabled ? (current ?? 0) | bit : (current ?? 0) & ~bit;
}
