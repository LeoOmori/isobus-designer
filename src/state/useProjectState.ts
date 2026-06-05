import { useCallback, useState } from 'react';
import { initialProject } from '../domain/initialProject';
import type { ProjectState } from '../domain/types';

export const storageKey = 'isobus-iop-editor-project';

function loadProject(): ProjectState {
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) as ProjectState : initialProject;
  } catch {
    return initialProject;
  }
}

export function useProjectState() {
  const [project, setProject] = useState<ProjectState>(loadProject);
  const [past, setPast] = useState<ProjectState[]>([]);
  const [future, setFuture] = useState<ProjectState[]>([]);

  const commit = useCallback((updater: (project: ProjectState) => ProjectState) => {
    setProject((current) => {
      const next = updater(current);
      if (next === current) return current;
      setPast((items) => [...items.slice(-49), current]);
      setFuture([]);
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setPast((items) => {
      if (!items.length) return items;
      const previous = items[items.length - 1];
      setProject((current) => {
        setFuture((futureItems) => [current, ...futureItems]);
        return previous;
      });
      return items.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((items) => {
      if (!items.length) return items;
      const [next, ...rest] = items;
      setProject((current) => {
        setPast((pastItems) => [...pastItems, current]);
        return next;
      });
      return rest;
    });
  }, []);

  return { project, setProject, commit, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0 };
}
