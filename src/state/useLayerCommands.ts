import { useCallback } from 'react';
import type { EditorObject, ProjectState } from '../domain/types';

export type LayerAction = 'front' | 'back' | 'forward' | 'backward';

export type LayerCommands = {
  /** Apply a high-level layer action ('front', 'back', 'forward', 'backward') to the selection. */
  layer: (action: LayerAction) => void;
  /** Swap zIndex with the next/previous sibling. */
  moveLayerById: (id: string, direction: 'up' | 'down') => void;
};

/**
 * Z-order management. Siblings are scoped to the parent container — children of
 * a Data Mask share a layer space, but Data Masks themselves order against each
 * other.
 */
export function useLayerCommands({
  commit,
  selectedId,
}: {
  commit: (updater: (project: ProjectState) => ProjectState) => void;
  selectedId: string;
}): LayerCommands {
  const moveLayerById = useCallback((id: string, direction: 'up' | 'down') => {
    commit((current) => {
      const selected = current.objects.find((object) => object.id === id);
      if (!selected) return current;
      const siblings = getLayerSiblings(current, selected).sort((a, b) => a.zIndex - b.zIndex);
      const index = siblings.findIndex((object) => object.id === id);
      const swapWith = direction === 'up' ? siblings[index + 1] : siblings[index - 1];
      if (!swapWith) return current;

      return {
        ...current,
        objects: current.objects.map((object) => {
          if (object.id === selected.id) return { ...object, zIndex: swapWith.zIndex };
          if (object.id === swapWith.id) return { ...object, zIndex: selected.zIndex };
          return object;
        }),
      };
    });
  }, [commit]);

  const layer = useCallback((action: LayerAction) => {
    if (action === 'forward' || action === 'backward') {
      moveLayerById(selectedId, action === 'forward' ? 'up' : 'down');
      return;
    }

    commit((current) => {
      const selected = current.objects.find((o) => o.id === selectedId);
      if (!selected) return current;
      const siblings = getLayerSiblings(current, selected);
      if (!siblings.length) return current;
      const nextZ = action === 'front'
        ? Math.max(...siblings.map((o) => o.zIndex)) + 1
        : Math.min(...siblings.map((o) => o.zIndex)) - 1;
      return {
        ...current,
        objects: current.objects.map((object) =>
          object.id === selected.id ? { ...object, zIndex: nextZ } : object,
        ),
      };
    });
  }, [commit, moveLayerById, selectedId]);

  return { layer, moveLayerById };
}

/** Look up siblings the selected object competes with for z-ordering. */
function getLayerSiblings(current: ProjectState, selected: EditorObject): EditorObject[] {
  if (selected.kind === 'data-mask') {
    return current.objects.filter((object) => object.kind === 'data-mask');
  }
  const parent = selected.parentId
    ? current.objects.find((object) => object.id === selected.parentId)
    : current.objects.find((object) => object.id === current.activeMaskId);
  const siblingIds = parent?.childObjectIds ?? [];
  return current.objects.filter((object) => siblingIds.includes(object.id));
}
