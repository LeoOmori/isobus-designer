import type { EditorObject, ProjectState } from './types';

/** Kinds that are shared attribute / variable objects — not rendered on the canvas. */
export const referenceKinds = [
  'line-attribute',
  'fill-attribute',
  'font-attribute',
  'string-variable',
  'number-variable',
  'soft-key-mask',
  'key',
] as const;

export function getActiveMask(project: ProjectState) {
  return project.objects.find((o) => o.id === project.activeMaskId)!;
}

/** Children of a Data Mask that should be rendered on the canvas. */
export function getCanvasChildren(project: ProjectState, maskId: string) {
  const mask = project.objects.find((o) => o.id === maskId);
  const childIds = new Set(mask?.childObjectIds ?? []);
  return project.objects
    .filter((o) => childIds.has(o.id) && o.visible && !o.hidden && !referenceKinds.includes(o.kind as typeof referenceKinds[number]))
    .sort((a, b) => a.zIndex - b.zIndex);
}

/** All children of a Data Mask including hidden/attribute children (for the tree view). */
export function getMaskChildren(project: ProjectState, maskId: string) {
  const mask = project.objects.find((o) => o.id === maskId);
  const childIds = new Set(mask?.childObjectIds ?? []);
  return project.objects.filter((o) => childIds.has(o.id)).sort((a, b) => a.zIndex - b.zIndex);
}

/** Children of a Soft Key Mask. */
export function getSoftKeyMaskKeys(project: ProjectState, skmId: string) {
  const skm = project.objects.find((o) => o.id === skmId);
  const keyIds = new Set(skm?.keys ?? []);
  return project.objects.filter((o) => keyIds.has(o.id)).sort((a, b) => a.zIndex - b.zIndex);
}

/** All attribute / variable reference objects (not rendered on canvas). */
export function getReferenceObjects(project: ProjectState) {
  return project.objects.filter((o) => referenceKinds.includes(o.kind as typeof referenceKinds[number]));
}

export function byKind(project: ProjectState, kind: EditorObject['kind']) {
  return project.objects.filter((o) => o.kind === kind);
}
