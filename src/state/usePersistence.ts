import { useEffect } from 'react';
import type { ProjectState } from '../domain/types';
import { storageKey } from './useProjectState';

const AUTOSAVE_INTERVAL_MS = 30_000;

/** Periodically write the current project state to localStorage. */
export function usePersistence(project: ProjectState): void {
  useEffect(() => {
    const id = window.setInterval(
      () => window.localStorage.setItem(storageKey, JSON.stringify(project)),
      AUTOSAVE_INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, [project]);
}
