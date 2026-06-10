import type { EditorObject, ProjectState } from '../types';
import { objectRegistry } from '../../objects/registry';
import { ByteWriter } from './byteWriter';
import type { WriteContext } from './context';
import { validateForExport } from './exportValidation';
import { buildIdMap, resolveRef } from './idResolver';
import { smokeValidateObjectPool } from './smokeValidateObjectPool';
import { workingSetModule } from '../../objects/working-set/logic';

export type ExportResult = {
  /** Binary .iop pool bytes. Empty if errors are present. */
  bytes: Uint8Array<ArrayBuffer>;
  /** Validation/export error messages. Empty array = success. */
  errors: string[];
};

/**
 * Serialization order for V1 Object Pool.
 *
 * Objects serialized first have no dependencies on later objects.
 * Forward references are technically allowed by the spec but this ordering
 * makes debug inspection straightforward.
 *
 * Working Set is written last (after the loop) since it lives in
 * project.workingSet rather than project.objects[].
 */
function orderObjectsForExport(objects: EditorObject[]): EditorObject[] {
  return [...objects].sort((a, b) => {
    const oa = objectRegistry[a.kind].exportOrder;
    const ob = objectRegistry[b.kind].exportOrder;
    if (oa !== ob) return oa - ob;
    return a.objectId.localeCompare(b.objectId); // stable within same kind
  });
}

function writeObject(obj: EditorObject, ctx: WriteContext): void {
  objectRegistry[obj.kind].writer(obj, ctx);
}

/**
 * Export the project to a binary ISO 11783-6 V1 Object Pool (.iop).
 *
 * Returns { bytes, errors }. If errors is non-empty, bytes is an empty
 * Uint8Array and the export did not proceed.
 */
export function exportObjectPool(project: ProjectState): ExportResult {
  // ── 1. Validate ─────────────────────────────────────────────────────────
  const errors = validateForExport(project);
  if (errors.length > 0) {
    return { bytes: new Uint8Array(0) as Uint8Array<ArrayBuffer>, errors };
  }

  // ── 2. Build ID map (WS → 0x0000, everything else → parsed objectId) ────
  const idMap = buildIdMap(project);
  const objectById = new Map(project.objects.map((o) => [o.id, o]));

  const w = new ByteWriter();
  const ctx: WriteContext = {
    w,
    idMap,
    resolve: (id) => resolveRef(id, idMap),
    objectById,
    project,
    vtVersion: project.workingSet.vtVersion ?? 3,
  };

  // ── 3. Serialize all objects in dependency order ─────────────────────────
  const ordered = orderObjectsForExport(project.objects);
  for (const obj of ordered) {
    writeObject(obj, ctx);
  }

  // ── 4. Working Set last ──────────────────────────────────────────────────
  workingSetModule.writer(project.workingSet, ctx);

  const bytes = w.result();
  const smoke = smokeValidateObjectPool(bytes);
  if (!smoke.ok) {
    return { bytes: new Uint8Array(0) as Uint8Array<ArrayBuffer>, errors: smoke.errors };
  }

  return { bytes, errors: [] };
}
