import { useCallback, useEffect, useState } from 'react';
import type { ProjectState } from '../domain/types';

export type Selection = {
  selectedId: string;
  selectedIds: string[];
  selectSingle: (id: string) => void;
  selectFromCanvas: (id: string, additive?: boolean) => void;
};

/**
 * Track the currently selected object id (single) and the multi-selection set.
 * Auto-prunes stale ids when the underlying project loses an object, falling
 * back to the active Data Mask and then the Working Set.
 */
export function useSelection(project: ProjectState): Selection {
  const fallbackId = project.activeMaskId || project.workingSet.id;
  const [selectedId, setSelectedId] = useState(fallbackId);
  const [selectedIds, setSelectedIds] = useState<string[]>([fallbackId]);

  const selectSingle = useCallback((id: string) => {
    setSelectedId(id);
    setSelectedIds([id]);
  }, []);

  const selectFromCanvas = useCallback((id: string, additive = false) => {
    if (!additive) {
      setSelectedId(id);
      setSelectedIds([id]);
      return;
    }
    setSelectedIds((current) => {
      if (current.includes(id)) {
        const next = current.filter((selected) => selected !== id);
        const fallback = project.activeMaskId || project.workingSet.id;
        setSelectedId(next[0] ?? fallback);
        return next.length ? next : [fallback];
      }
      setSelectedId(id);
      return [...current, id];
    });
  }, [project.activeMaskId, project.workingSet.id]);

  // Auto-fix selection when an object is deleted from the project.
  useEffect(() => {
    const workingSetId = project.workingSet.id;
    const exists = (id: string) => id === workingSetId || project.objects.some((object) => object.id === id);

    if (!exists(selectedId)) {
      const fallback = project.activeMaskId || workingSetId;
      setSelectedId(fallback);
      setSelectedIds([fallback]);
      return;
    }
    setSelectedIds((current) => {
      const next = current.filter(exists);
      return next.length === current.length ? current : next;
    });
  }, [project, selectedId]);

  return { selectedId, selectedIds, selectSingle, selectFromCanvas };
}
