import type { EditorObject, ProjectState } from '../types';
import { ByteWriter } from './byteWriter';
import type { WriteContext } from './context';
import { validateForExport } from './exportValidation';
import { buildIdMap, resolveRef } from './idResolver';
import { smokeValidateObjectPool } from './smokeValidateObjectPool';
import { writeButton } from './writers/button';
import { writeContainer } from './writers/container';
import { writeDataMask } from './writers/dataMask';
import { writeFillAttributes } from './writers/fillAttributes';
import { writeFontAttributes } from './writers/fontAttributes';
import { writeKey } from './writers/key';
import { writeLineAttributes } from './writers/lineAttributes';
import { writeNumberVariable } from './writers/numberVariable';
import { writeOutputNumber } from './writers/outputNumber';
import { writeOutputRectangle } from './writers/outputRectangle';
import { writeOutputString } from './writers/outputString';
import { writePictureGraphic } from './writers/pictureGraphic';
import { writeSoftKeyMask } from './writers/softKeyMask';
import { writeStringVariable } from './writers/stringVariable';
import { writeWorkingSet } from './writers/workingSet';

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
const KIND_ORDER: Record<string, number> = {
  'font-attribute':    0,
  'line-attribute':    1,
  'fill-attribute':    2,
  'number-variable':   3,
  'string-variable':   4,
  'picture-graphic':   5,
  'output-string':     6,
  'output-number':     7,
  'output-rectangle':  8,
  'container':         9,
  'button':           10,
  'key':              11,
  'soft-key-mask':    12,
  'data-mask':        13,
  // Working Set = 14 (written explicitly after loop)
};

function orderObjectsForExport(objects: EditorObject[]): EditorObject[] {
  return [...objects].sort((a, b) => {
    const oa = KIND_ORDER[a.kind] ?? 99;
    const ob = KIND_ORDER[b.kind] ?? 99;
    if (oa !== ob) return oa - ob;
    return a.objectId.localeCompare(b.objectId); // stable within same kind
  });
}

function writeObject(obj: EditorObject, ctx: WriteContext): void {
  switch (obj.kind) {
    case 'font-attribute':    writeFontAttributes(obj, ctx); break;
    case 'line-attribute':    writeLineAttributes(obj, ctx); break;
    case 'fill-attribute':    writeFillAttributes(obj, ctx); break;
    case 'number-variable':   writeNumberVariable(obj, ctx); break;
    case 'string-variable':   writeStringVariable(obj, ctx); break;
    case 'picture-graphic':   writePictureGraphic(obj, ctx); break;
    case 'output-string':     writeOutputString(obj, ctx); break;
    case 'output-number':     writeOutputNumber(obj, ctx); break;
    case 'output-rectangle':  writeOutputRectangle(obj, ctx); break;
    case 'container':         writeContainer(obj, ctx); break;
    case 'button':            writeButton(obj, ctx); break;
    case 'key':               writeKey(obj, ctx); break;
    case 'soft-key-mask':     writeSoftKeyMask(obj, ctx); break;
    case 'data-mask':         writeDataMask(obj, ctx); break;
    // Unknown kinds are silently skipped — validator should have caught them.
  }
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
  };

  // ── 3. Serialize all objects in dependency order ─────────────────────────
  const ordered = orderObjectsForExport(project.objects);
  for (const obj of ordered) {
    writeObject(obj, ctx);
  }

  // ── 4. Working Set last ──────────────────────────────────────────────────
  writeWorkingSet(project.workingSet, ctx);

  const bytes = w.result();
  const smoke = smokeValidateObjectPool(bytes);
  if (!smoke.ok) {
    return { bytes: new Uint8Array(0) as Uint8Array<ArrayBuffer>, errors: smoke.errors };
  }

  return { bytes, errors: [] };
}
