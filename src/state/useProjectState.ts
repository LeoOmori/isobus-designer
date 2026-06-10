import { useCallback, useState, type SetStateAction } from 'react';
import { initialProject } from '../domain/initialProject';
import { nearestVtColorIndex } from '../domain/isobus';
import type { EditorObject, ProjectState } from '../domain/types';
import { objectRegistry } from '../objects/registry';

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
  const migrate = objectRegistry[object.kind]?.migrate;
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
  const [history, setHistory] = useState(() => ({
    project: loadProject(),
    past: [] as ProjectState[],
    future: [] as ProjectState[],
  }));

  const setProject = useCallback((action: SetStateAction<ProjectState>) => {
    setHistory((current) => {
      const next = typeof action === 'function'
        ? (action as (project: ProjectState) => ProjectState)(current.project)
        : action;
      return next === current.project ? current : { ...current, project: next };
    });
  }, []);

  const commit = useCallback((updater: (project: ProjectState) => ProjectState) => {
    setHistory((current) => {
      const next = updater(current.project);
      if (next === current.project) return current;
      return {
        project: next,
        past: [...current.past.slice(-49), current.project],
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((current) => {
      if (!current.past.length) return current;
      const previous = current.past[current.past.length - 1];
      return {
        project: previous,
        past: current.past.slice(0, -1),
        future: [current.project, ...current.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((current) => {
      if (!current.future.length) return current;
      const [next, ...future] = current.future;
      return {
        project: next,
        past: [...current.past.slice(-49), current.project],
        future,
      };
    });
  }, []);

  return {
    project: history.project,
    setProject,
    commit,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
