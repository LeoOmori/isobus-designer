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
  return project.objects.find((o) => o.id === project.activeMaskId && o.kind === 'data-mask')
    ?? project.objects.find((o) => o.kind === 'data-mask');
}

export function getObjectChildren(project: ProjectState, parentId: string) {
  const parent = project.objects.find((o) => o.id === parentId);
  const childIds = new Set(parent?.childObjectIds ?? []);
  return project.objects.filter((o) => childIds.has(o.id)).sort((a, b) => a.zIndex - b.zIndex);
}

/** Children of a Data Mask that should be rendered on the canvas. */
export function getCanvasChildren(project: ProjectState, maskId: string) {
  return getObjectChildren(project, maskId)
    .filter((o) => o.visible && !referenceKinds.includes(o.kind as typeof referenceKinds[number]))
    .sort((a, b) => a.zIndex - b.zIndex);
}

/** All children of a Data Mask including attribute children (for the tree view). */
export function getMaskChildren(project: ProjectState, maskId: string) {
  return getObjectChildren(project, maskId);
}

/** Children of a Soft Key Mask. */
export function getSoftKeyMaskKeys(project: ProjectState, skmId: string) {
  const skm = project.objects.find((o) => o.id === skmId);
  return (skm?.keys ?? [])
    .map((id) => project.objects.find((o) => o.id === id))
    .filter((o): o is EditorObject => o !== undefined);
}

/** All attribute / variable reference objects (not rendered on canvas). */
export function getReferenceObjects(project: ProjectState) {
  return project.objects.filter((o) => referenceKinds.includes(o.kind as typeof referenceKinds[number]));
}

export function byKind(project: ProjectState, kind: EditorObject['kind']) {
  return project.objects.filter((o) => o.kind === kind);
}
