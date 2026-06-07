import type { ProjectState } from '../types';
import { validate } from '../validation';
import { asPictureGraphicFormat } from '../vtPalette';
import { parseHexObjectId } from './idResolver';
import { extractedModules } from '../../objects/extractedModules';
import { workingSetModule } from '../../objects/working-set/logic';

/**
 * Run all pre-export validations for V1 .iop export.
 * Returns an array of human-readable error messages; empty = ready to export.
 *
 * Runs the full editor validate() first, then adds export-specific checks:
 *  - At least one Data Mask
 *  - Working Set has an active Data Mask
 *  - uint16 objectId uniqueness (WS forced to 0x0000)
 *  - No objectId collision with 0x0000 (reserved for WS)
 *  - All strings are Latin-1 representable
 *  - Font Attributes have a standard V1 cell size
 *  - Output String text fits within its fixed length in Latin-1 bytes
 *  - Picture Graphics have raw data + no RLE
 *  - No macros (V1 unsupported)
 */
export function validateForExport(project: ProjectState): string[] {
  // Run the existing editor validator
  const errors = [...validate(project)];

  const { workingSet, objects } = project;
  const objectById = new Map(objects.map((o) => [o.id, o]));

  // ── Working Set & pool structure ────────────────────────────────────────
  errors.push(...workingSetModule.validateExport(project, { objectById }));

  const keyIcons = objects.filter((o) => o.kind === 'key' && (o.childObjectIds ?? []).some((childId) => objectById.get(childId)?.kind === 'picture-graphic'));
  const keyIconPictureIds = new Set<string>();
  for (const key of keyIcons) {
    for (const childId of key.childObjectIds ?? []) {
      if (objectById.get(childId)?.kind === 'picture-graphic') keyIconPictureIds.add(childId);
    }
  }
  const dmsBySkmId = new Map<string, string[]>();
  for (const dm of objects) {
    if (dm.kind === 'data-mask' && dm.softKeyMaskId) {
      const list = dmsBySkmId.get(dm.softKeyMaskId) ?? [];
      list.push(dm.id);
      dmsBySkmId.set(dm.softKeyMaskId, list);
    }
  }

  for (const key of keyIcons) {
    const skmRefs = objects.filter((o) => o.kind === 'soft-key-mask' && (o.keys ?? []).includes(key.id));
    if (skmRefs.length === 0) {
      errors.push(`Export: Key ${key.id} contains a Picture Graphic child but is not referenced by any Soft Key Mask`);
      continue;
    }

    for (const skm of skmRefs) {
      const dmRefs = dmsBySkmId.get(skm.id) ?? [];
      if (dmRefs.length === 0) {
        errors.push(`Export: Soft Key Mask ${skm.id} references Key ${key.id} but is not referenced by any Data Mask`);
        continue;
      }
      const activeUsesThisSkm = dmRefs.some((dmId) => dmId === workingSet.activeDataMaskId);
      if (!activeUsesThisSkm) {
        errors.push(`Export: Key ${key.id} icon path requires Working Set active Data Mask "${workingSet.activeDataMaskId}" to reference Soft Key Mask ${skm.id}`);
      }
    }
  }

  // ── uint16 objectId uniqueness ──────────────────────────────────────────
  const seenIds = new Map<number, string>();
  seenIds.set(0x0000, workingSet.id); // WS always gets 0x0000

  for (const obj of objects) {
    let n: number;
    try {
      n = parseHexObjectId(obj.objectId);
    } catch {
      errors.push(`Export: ${obj.id} has invalid objectId "${obj.objectId}" (must be hex 0x0001–0xFFFE)`);
      continue;
    }

    if (n === 0x0000) {
      errors.push(`Export: ${obj.id} objectId 0x0000 is reserved for the Working Set`);
      continue;
    }

    const collision = seenIds.get(n);
    if (collision) {
      const hex = `0x${n.toString(16).toUpperCase().padStart(4, '0')}`;
      errors.push(`Export: Duplicate objectId ${hex} shared by "${obj.id}" and "${collision}"`);
    } else {
      seenIds.set(n, obj.id);
    }
  }

  // ── Latin-1 string validation ────────────────────────────────────────────
  for (const obj of objects) {
    errors.push(...(extractedModules[obj.kind]?.validateExport?.(obj, project, { objectById }) ?? []));
  }

  // ── Picture Graphic constraints ──────────────────────────────────────────
  for (const obj of objects) {
    if (obj.kind === 'picture-graphic') {
      const format = asPictureGraphicFormat(obj.graphicFormat);
      const actualWidth = obj.actualWidth ?? 0;
      const actualHeight = obj.actualHeight ?? 0;
      const targetWidth = obj.targetWidth ?? 0;
      if (keyIconPictureIds.has(obj.id)) {
        if ((obj.graphicOptions ?? 0) & 0b010) {
          errors.push(`Export: Picture Graphic ${obj.id} has flashing enabled; key icons must not flash for IOP compatibility`);
        }
        if (format !== 2) {
          errors.push(`Export: Picture Graphic ${obj.id} graphicFormat must be 2 (8-bit color) for key icon compatibility`);
        }
        if (targetWidth !== 48) {
          errors.push(`Export: Picture Graphic ${obj.id} targetWidth must be 48 for key icon compatibility`);
        }
        if (actualWidth !== 48 || actualHeight !== 48) {
          errors.push(`Export: Picture Graphic ${obj.id} actualWidth and actualHeight must both be 48 for key icon compatibility`);
        }
        if (obj.x !== 6 || obj.y !== 6) {
          errors.push(`Export: Picture Graphic ${obj.id} should be positioned at x=6, y=6 for key icon compatibility`);
        }
        if ((obj.rawData ?? []).length !== 2304) {
          errors.push(`Export: Picture Graphic ${obj.id} rawData length must be 2304 bytes for a 48×48 key icon`);
        }
      }
    }
  }

  // ── Macros: unsupported in V1 ────────────────────────────────────────────
  for (const obj of objects) {
    if ((obj.macros ?? []).length > 0) {
      errors.push(`Export: ${obj.id} has macro references (macros are not supported in V1 export)`);
    }
  }

  return errors;
}

/** Convenience: returns true if the project is ready for .iop export. */
export function isExportReady(project: ProjectState): boolean {
  return validateForExport(project).length === 0;
}
