import { initialProject } from './initialProject';
import { nearestVtColorIndex } from './isobus';
import type { EditorObject, ProjectState } from './types';
import { objectRegistry } from '../objects/registry';

/** Project file = the same JSON the editor autosaves to localStorage. */
export function serializeProject(project: ProjectState): string {
  return JSON.stringify(project, null, 2);
}

/**
 * Parse a project file picked by the user. Throws a readable Error on anything
 * that is not an editor project, so a bad file never replaces the open project.
 */
export function parseProjectFile(text: string): ProjectState {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('File is not valid JSON');
  }
  const project = data as Partial<ProjectState> | null;
  if (!project || typeof project !== 'object' || !project.workingSet || typeof project.workingSet !== 'object' || !Array.isArray(project.objects)) {
    throw new Error('File is not an ISOBUS Designer project (missing workingSet or objects)');
  }
  for (const [index, obj] of project.objects.entries()) {
    if (!obj || typeof obj.id !== 'string' || !(obj.kind in objectRegistry)) {
      throw new Error(`Object ${index} has a missing id or unknown kind "${obj?.kind}"`);
    }
  }
  return migrateProject({
    ...initialProject,
    ...project,
    workingSet: { ...initialProject.workingSet, ...project.workingSet },
  } as ProjectState);
}

export function migrateProject(project: ProjectState): ProjectState {
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
