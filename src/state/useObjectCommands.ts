import { useCallback } from 'react';
import { createEditorObject, referencePatch } from '../domain/objectFactory';
import type { EditorObject, ObjectKind, ProjectState, ReferenceKind, WorkingSet } from '../domain/types';
import { acceptsReference } from '../objects/registry';

/** Kinds that live as children of a Data Mask, Container, Button, or Key on the canvas. */
const CANVAS_KINDS = new Set<ObjectKind>([
  'container', 'output-string', 'output-number', 'output-line', 'output-polygon', 'output-ellipse',
  'output-rectangle', 'output-meter', 'output-linear-bar-graph', 'output-arched-bar-graph',
  'button', 'input-boolean', 'input-string', 'input-number', 'input-list', 'picture-graphic', 'object-pointer',
]);

export type ObjectCommands = {
  patchObject: (id: string, changes: Partial<EditorObject>) => void;
  patchObjects: (updates: { id: string; changes: Partial<EditorObject> }[]) => void;
  patchWorkingSet: (changes: Partial<WorkingSet>) => void;
  createObject: (kind: ObjectKind, x?: number, y?: number, parentId?: string, overrides?: Partial<EditorObject>) => void;
  createAttributeReference: (kind: ReferenceKind) => void;
  deleteObject: (id: string) => void;
  cloneObject: (id: string) => void;
};

/**
 * Encapsulates every project mutation: patching, creation, cloning, deletion.
 * All operations go through `commit` so they participate in undo/redo.
 *
 * Each callback is stable across renders (depends only on `commit` and selection
 * helpers), so it can be passed as props without triggering unnecessary
 * re-renders downstream.
 */
export function useObjectCommands({
  commit,
  selectedId,
  selectSingle,
}: {
  commit: (updater: (project: ProjectState) => ProjectState) => void;
  selectedId: string;
  selectSingle: (id: string) => void;
}): ObjectCommands {
  const patchObject = useCallback((id: string, changes: Partial<EditorObject>) => {
    commit((current) => ({
      ...current,
      objects: current.objects.map((o) => o.id === id ? { ...o, ...changes } : o),
    }));
  }, [commit]);

  const patchObjects = useCallback((updates: { id: string; changes: Partial<EditorObject> }[]) => {
    if (!updates.length) return;
    commit((current) => {
      const updateById = new Map(updates.map((update) => [update.id, update.changes]));
      return {
        ...current,
        objects: current.objects.map((object) => {
          const changes = updateById.get(object.id);
          return changes ? { ...object, ...changes } : object;
        }),
      };
    });
  }, [commit]);

  const patchWorkingSet = useCallback((changes: Partial<WorkingSet>) => {
    commit((current) => {
      const activeDataMaskId = changes.activeDataMaskId ?? current.workingSet.activeDataMaskId;
      return {
        ...current,
        activeMaskId: activeDataMaskId || current.activeMaskId,
        workingSet: { ...current.workingSet, ...changes },
      };
    });
    if (changes.activeDataMaskId) selectSingle(changes.activeDataMaskId);
  }, [commit, selectSingle]);

  const createObject = useCallback((kind: ObjectKind, x = 70, y = 70, parentId?: string, overrides?: Partial<EditorObject>) => {
    commit((current) => {
      const isMask      = kind === 'data-mask';
      const isSKM       = kind === 'soft-key-mask';
      const isKey       = kind === 'key';
      const isCanvas    = CANVAS_KINDS.has(kind);

      const targetParentId = isCanvas ? (parentId ?? current.activeMaskId) : current.activeMaskId;
      const activeSKMId    = current.workingSet.activeSoftKeyMaskId;
      const base           = createEditorObject(kind, current, x, y, targetParentId);
      const next           = overrides ? { ...base, ...overrides } : base;

      selectSingle(next.id);

      return {
        ...current,
        activeMaskId: isMask ? next.id : current.activeMaskId,
        workingSet: {
          ...current.workingSet,
          activeDataMaskId:    isMask ? next.id : current.workingSet.activeDataMaskId,
          activeSoftKeyMaskId: isSKM  ? next.id : current.workingSet.activeSoftKeyMaskId,
        },
        nextNumber: current.nextNumber + 1,
        objects: [
          ...current.objects.map((o) => {
            if (isCanvas && o.id === targetParentId) {
              return { ...o, childObjectIds: [...(o.childObjectIds ?? []), next.id] };
            }
            if (isKey && o.id === activeSKMId) {
              return { ...o, keys: [...(o.keys ?? []), next.id] };
            }
            if (isSKM && o.kind === 'data-mask' && o.id === current.activeMaskId && !o.softKeyMaskId) {
              return { ...o, softKeyMaskId: next.id };
            }
            return o;
          }),
          next,
        ],
      };
    });
  }, [commit, selectSingle]);

  const createAttributeReference = useCallback((kind: ReferenceKind) => {
    commit((current) => {
      const attribute = createEditorObject(kind, current);
      return {
        ...current,
        nextNumber: current.nextNumber + 1,
        objects: current.objects.map((o) =>
          o.id === selectedId && acceptsReference(o.kind, kind)
            ? { ...o, ...referencePatch(kind, attribute.id) }
            : o,
        ).concat(attribute),
      };
    });
  }, [commit, selectedId]);

  const deleteObject = useCallback((id: string) => {
    commit((current) => {
      const object = current.objects.find((o) => o.id === id);
      if (!object) return current;
      // Prevent deleting the last Data Mask or Alarm Mask.
      if (object.kind === 'data-mask' && current.objects.filter((o) => o.kind === 'data-mask').length === 1) return current;
      if (object.kind === 'alarm-mask' && current.objects.filter((o) => o.kind === 'alarm-mask').length === 1) return current;

      const deleteIds = collectDescendantIds(id, current);
      const objects = current.objects
        .filter((o) => !deleteIds.has(o.id))
        .map((o) => {
          if (o.childObjectIds) return { ...o, childObjectIds: o.childObjectIds.filter((c) => !deleteIds.has(c)) };
          if (o.kind === 'soft-key-mask') return { ...o, keys: o.keys?.filter((k) => !deleteIds.has(k)) };
          return o;
        });

      const activeMaskId = deleteIds.has(current.activeMaskId)
        ? objects.find((o) => o.kind === 'data-mask')?.id ?? ''
        : current.activeMaskId;

      selectSingle(activeMaskId || current.workingSet.id);
      return {
        ...current,
        activeMaskId,
        workingSet: { ...current.workingSet, activeDataMaskId: activeMaskId },
        objects,
      };
    });
  }, [commit, selectSingle]);

  const cloneObject = useCallback((id: string) => {
    commit((current) => {
      const source = current.objects.find((object) => object.id === id);
      if (!source) return current;

      const base = createEditorObject(
        source.kind, current,
        source.x + 10, source.y + 10,
        source.parentId ?? current.activeMaskId,
      );
      const isContainerKind = source.kind === 'data-mask' || source.kind === 'soft-key-mask';
      const clone: EditorObject = {
        ...source,
        id: base.id,
        objectId: base.objectId,
        name: `${source.name} Copy`,
        x: source.x + (isContainerKind ? 0 : 10),
        y: source.y + (isContainerKind ? 0 : 10),
        zIndex: current.objects.length + 1,
        childObjectIds: source.childObjectIds ? [] : undefined,
        keys: source.keys ? [] : undefined,
      };

      selectSingle(clone.id);

      return {
        ...current,
        nextNumber: current.nextNumber + 1,
        objects: [
          ...current.objects.map((object) => {
            if (source.parentId && object.id === source.parentId) {
              return { ...object, childObjectIds: [...(object.childObjectIds ?? []), clone.id] };
            }
            if (source.kind === 'key' && object.kind === 'soft-key-mask' && (object.keys ?? []).includes(source.id)) {
              const keys = object.keys ?? [];
              const sourceIndex = keys.indexOf(source.id);
              return { ...object, keys: [...keys.slice(0, sourceIndex + 1), clone.id, ...keys.slice(sourceIndex + 1)] };
            }
            return object;
          }),
          clone,
        ],
      };
    });
  }, [commit, selectSingle]);

  return {
    patchObject, patchObjects, patchWorkingSet,
    createObject, createAttributeReference,
    deleteObject, cloneObject,
  };
}

/** Collect the id and every descendant (childObjectIds + keys) reachable from `id`. */
function collectDescendantIds(rootId: string, current: ProjectState): Set<string> {
  const deleteIds = new Set<string>();
  const objectById = new Map(current.objects.map((c) => [c.id, c]));

  function visit(currentId: string): void {
    if (deleteIds.has(currentId)) return;
    deleteIds.add(currentId);
    const currentObject = objectById.get(currentId);
    for (const childId of currentObject?.childObjectIds ?? []) visit(childId);
    for (const keyId of currentObject?.keys ?? []) visit(keyId);
  }

  visit(rootId);
  return deleteIds;
}
