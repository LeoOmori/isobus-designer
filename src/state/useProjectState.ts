import { useCallback, useState } from 'react';
import { initialProject } from '../domain/initialProject';
import { nearestVtColorIndex } from '../domain/isobus';
import type { EditorObject, ProjectState } from '../domain/types';
import { extractedModules } from '../objects/extractedModules';

export const storageKey = 'isobus-iop-editor-project';

function loadProject(): ProjectState {
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? migrateProject(JSON.parse(stored) as ProjectState) : initialProject;
  } catch {
    return initialProject;
  }
}

function migrateProject(project: ProjectState): ProjectState {
  return {
    ...project,
    objects: project.objects.map(migrateObject),
  };
}

function migrateObject(object: EditorObject): EditorObject {
  const backgroundColorIndex = object.backgroundColorIndex ?? backgroundColorToIndex(object.backgroundColor);
  const migrate = extractedModules[object.kind]?.migrate;
  if (migrate) return migrate({ ...object, backgroundColorIndex });

  return {
    ...object,
    backgroundColorIndex,
  };
}

function backgroundColorToIndex(color: string | undefined) {
  if (!color || color === 'transparent') return 1;
  return nearestVtColorIndex(color);
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
