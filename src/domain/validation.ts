import type { ObjectKind, ProjectState } from './types';
import { extractedModules } from '../objects/extractedModules';

const REFERENCE_ONLY_KINDS = new Set([
  'line-attribute', 'fill-attribute', 'font-attribute',
  'string-variable', 'number-variable',
  'soft-key-mask', 'key',
]);

export function validate(project: ProjectState): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const objectById = new Map(project.objects.map((object) => [object.id, object]));

  for (const obj of project.objects) {
    // Unique IDs
    if (ids.has(obj.id)) errors.push(`Duplicate ID: ${obj.id}`);
    ids.add(obj.id);

    // Canvas objects must have positive dimensions
    if (!REFERENCE_ONLY_KINDS.has(obj.kind) && (obj.width <= 0 || obj.height <= 0)) {
      errors.push(`Invalid size: ${obj.id} (${obj.width}×${obj.height})`);
    }

    if (!REFERENCE_ONLY_KINDS.has(obj.kind) && obj.kind !== 'data-mask') {
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

    errors.push(...(extractedModules[obj.kind]?.validate?.(obj, project, { objectById }) ?? []));

    if (obj.kind === 'soft-key-mask') {
      const keys = obj.keys ?? [];
      if (!Number.isInteger(obj.backgroundColorIndex ?? 1) || (obj.backgroundColorIndex ?? 1) < 0 || (obj.backgroundColorIndex ?? 1) > 255) {
        errors.push(`Soft Key Mask ${obj.id}: backgroundColorIndex must be 0–255`);
      }
      if (keys.length > 0xff) {
        errors.push(`Soft Key Mask ${obj.id}: key count must fit uint8`);
      }
      if ((obj.macros ?? []).length > 0xff) {
        errors.push(`Soft Key Mask ${obj.id}: macro count must fit uint8`);
      }
      const seen = new Set<string>();
      for (const keyId of keys) {
        if (seen.has(keyId)) {
          errors.push(`Soft Key Mask ${obj.id}: duplicate key reference "${keyId}"`);
          continue;
        }
        seen.add(keyId);
        const key = objectById.get(keyId);
        if (!key || key.kind !== 'key') {
          errors.push(`Soft Key Mask ${obj.id}: key "${keyId}" must reference an existing Key object`);
        }
      }
    }

    // Data Mask activeMask reference
    if (obj.kind === 'data-mask' && obj.softKeyMaskId) {
      const skmExists = project.objects.some((o) => o.id === obj.softKeyMaskId && o.kind === 'soft-key-mask');
      if (!skmExists) {
        errors.push(`Data Mask ${obj.id}: softKeyMaskId "${obj.softKeyMaskId}" not found`);
      }
    }
  }

  // Working set activeMask must be valid
  const { activeDataMaskId, designatorObjects } = project.workingSet;
  if (activeDataMaskId && !project.objects.some((o) => o.id === activeDataMaskId && o.kind === 'data-mask')) {
    errors.push(`Working Set: activeDataMaskId "${activeDataMaskId}" not found`);
  }

  // Working set designator objects must reference existing objects
  for (const des of designatorObjects ?? []) {
    if (des.objectId && !project.objects.some((o) => o.id === des.objectId)) {
      errors.push(`Working Set: designator object "${des.objectId}" not found`);
    }
  }

  return errors;
}
