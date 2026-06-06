import type { EditorObject, ProjectState } from '../types';
import type { ByteWriter } from './byteWriter';

/**
 * Shared context passed to every object writer.
 * Avoids repeating lookups and wires all writers to the same ByteWriter instance.
 */
export type WriteContext = {
  /** Active ByteWriter accumulating all pool bytes. */
  w: ByteWriter;
  /** editor id → uint16 objectId (Working Set always 0x0000). */
  idMap: Map<string, number>;
  /** Resolve an editor reference id → uint16, returning 0xFFFF for null/unknown. */
  resolve: (editorId: string | null | undefined) => number;
  /** Fast lookup: editor id → EditorObject. */
  objectById: Map<string, EditorObject>;
  /** Full project state (for Working Set writer and cross-object lookups). */
  project: ProjectState;
};
