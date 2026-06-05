import type { EditorObject, ProjectState } from './types';

export const referenceKinds = ['line-attribute', 'fill-attribute', 'font-attribute', 'string-variable'];

export function getActiveMask(project: ProjectState) {
  return project.objects.find((object) => object.id === project.activeMaskId)!;
}

export function getCanvasChildren(project: ProjectState, maskId: string) {
  const mask = project.objects.find((object) => object.id === maskId);
  const childIds = new Set(mask?.childObjectIds ?? []);
  return project.objects
    .filter((object) => childIds.has(object.id) && object.visible && !object.hidden && !referenceKinds.includes(object.kind))
    .sort((a, b) => a.zIndex - b.zIndex);
}

export function getMaskChildren(project: ProjectState, maskId: string) {
  const mask = project.objects.find((object) => object.id === maskId);
  const childIds = new Set(mask?.childObjectIds ?? []);
  return project.objects.filter((object) => childIds.has(object.id)).sort((a, b) => a.zIndex - b.zIndex);
}

export function getReferenceObjects(project: ProjectState) {
  return project.objects.filter((object) => referenceKinds.includes(object.kind));
}

export function byKind(project: ProjectState, kind: EditorObject['kind']) {
  return project.objects.filter((object) => object.kind === kind);
}
