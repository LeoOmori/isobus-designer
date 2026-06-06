import type { ProjectState } from '../types';

/** The ISO 11783-6 NULL Object ID sentinel value. */
export const NULL_OBJECT_ID = 0xffff;

/**
 * Parse a hex objectId string like "0x0203" to a uint16 number.
 * Throws if the value is not in range 0x0000–0xFFFE.
 */
export function parseHexObjectId(hex: string): number {
  const n = parseInt(hex.replace(/^0x/i, ''), 16);
  if (!Number.isFinite(n) || n < 0 || n > 0xfffe) {
    throw new Error(`Invalid object ID: "${hex}" (must be 0x0000–0xFFFE)`);
  }
  return n;
}

/**
 * Build a map from editor string id (e.g. "DM_1") → uint16 objectId.
 * - Working Set is always mapped to 0x0000 (forced per ISO 11783-6).
 * - All other objects use their parsed objectId field.
 */
export function buildIdMap(project: ProjectState): Map<string, number> {
  const map = new Map<string, number>();

  // Working Set forced to 0x0000
  map.set(project.workingSet.id, 0x0000);

  for (const obj of project.objects) {
    const n = parseHexObjectId(obj.objectId);
    map.set(obj.id, n);
  }

  return map;
}

/**
 * Resolve an editor reference id to its uint16 objectId.
 * Returns NULL_OBJECT_ID (0xFFFF) for null, undefined, or unknown references.
 */
export function resolveRef(
  editorId: string | null | undefined,
  idMap: Map<string, number>,
): number {
  if (!editorId) return NULL_OBJECT_ID;
  return idMap.get(editorId) ?? NULL_OBJECT_ID;
}
