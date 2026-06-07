import type { EditorObject, ProjectState, WorkingSet } from '../../domain/types';
import type { WriteContext } from '../../domain/export/context';
import { writeWorkingSet } from '../../domain/export/writers/workingSet';

export type WorkingSetLookup = {
  objectById: Map<string, EditorObject>;
};

export const workingSetModule = {
  writer: writeWorkingSet,
  validate,
  validateExport,
};

export function write(workingSet: WorkingSet, context: WriteContext): void {
  writeWorkingSet(workingSet, context);
}

export function validate(project: ProjectState, _lookup?: WorkingSetLookup): string[] {
  const errors: string[] = [];
  const { activeDataMaskId, designatorObjects } = project.workingSet;

  if (activeDataMaskId && !project.objects.some((object) => object.id === activeDataMaskId && object.kind === 'data-mask')) {
    errors.push(`Working Set: activeDataMaskId "${activeDataMaskId}" not found`);
  }

  for (const designator of designatorObjects ?? []) {
    if (designator.objectId && !project.objects.some((object) => object.id === designator.objectId)) {
      errors.push(`Working Set: designator object "${designator.objectId}" not found`);
    }
  }

  return errors;
}

export function validateExport(project: ProjectState, { objectById }: WorkingSetLookup): string[] {
  const errors: string[] = [];
  const { workingSet, objects } = project;

  if (!workingSet.activeDataMaskId) {
    errors.push('Export: Working Set must have an Active Data Mask set');
  } else {
    const activeMask = objectById.get(workingSet.activeDataMaskId);
    if (!activeMask) {
      errors.push(`Export: Working Set active Data Mask "${workingSet.activeDataMaskId}" not found in object pool`);
    } else if (activeMask.kind !== 'data-mask') {
      errors.push(`Export: Working Set activeDataMaskId "${workingSet.activeDataMaskId}" must reference a Data Mask`);
    }
  }

  if (!objects.some((object) => object.kind === 'data-mask')) {
    errors.push('Export: Pool must contain at least one Data Mask');
  }

  for (const designator of workingSet.designatorObjects ?? []) {
    if (!designator.objectId) {
      errors.push('Export: Working Set designator entry has no object selected');
      continue;
    }
    const object = objects.find((candidate) => candidate.id === designator.objectId);
    if (!object) {
      errors.push(`Export: Working Set designator "${designator.objectId}" not found in the object pool`);
    }
  }

  return errors;
}
