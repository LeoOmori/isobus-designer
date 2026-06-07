import type { ProjectState } from './types';
import { extractedModules } from '../objects/extractedModules';
import { workingSetModule } from '../objects/working-set/logic';
import { metaRegistry } from '../objects/metaRegistry';

export function validate(project: ProjectState): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const objectById = new Map(project.objects.map((object) => [object.id, object]));

  for (const obj of project.objects) {
    // Unique IDs
    if (ids.has(obj.id)) errors.push(`Duplicate ID: ${obj.id}`);
    ids.add(obj.id);

    // Canvas objects must have positive dimensions
    if (metaRegistry[obj.kind].hasLayout && (obj.width <= 0 || obj.height <= 0)) {
      errors.push(`Invalid size: ${obj.id} (${obj.width}×${obj.height})`);
    }

    if (metaRegistry[obj.kind].hasLayout && obj.kind !== 'data-mask') {
      const childContainerIds = project.objects
        .filter((parent) => (parent.childObjectIds ?? []).includes(obj.id))
        .map((parent) => parent.id);
      const parent = obj.parentId ? objectById.get(obj.parentId) : undefined;

      if (obj.parentId && !parent) {
        errors.push(`${obj.id}: parentId "${obj.parentId}" not found`);
      }
      if (obj.parentId && parent?.childObjectIds !== undefined && !childContainerIds.includes(obj.parentId)) {
        errors.push(`${obj.id}: parentId "${obj.parentId}" must include this object in childObjectIds`);
      }
      if (childContainerIds.length > 1) {
        errors.push(`${obj.id}: object is listed as a child by multiple containers (${childContainerIds.join(', ')})`);
      }
      if (childContainerIds.length === 1 && obj.parentId && childContainerIds[0] !== obj.parentId) {
        errors.push(`${obj.id}: parentId "${obj.parentId}" does not match childObjectIds owner "${childContainerIds[0]}"`);
      }
      if (childContainerIds.length === 1 && !obj.parentId) {
        errors.push(`${obj.id}: child object must set parentId "${childContainerIds[0]}"`);
      }
    }

    errors.push(...(extractedModules[obj.kind].validate?.(obj, project, { objectById }) ?? []));

  }

  errors.push(...workingSetModule.validate(project, { objectById }));

  return errors;
}
