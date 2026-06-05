import type { ProjectState } from './types';

const referenceOnlyKinds = ['line-attribute', 'fill-attribute', 'font-attribute', 'string-variable'];

export function validate(project: ProjectState) {
  const ids = new Set<string>();
  const errors: string[] = [];
  for (const object of project.objects) {
    if (ids.has(object.id)) errors.push(`Duplicate ID: ${object.id}`);
    ids.add(object.id);
    if (!referenceOnlyKinds.includes(object.kind) && (object.width <= 0 || object.height <= 0)) errors.push(`Invalid size: ${object.id}`);
  }
  if (!project.objects.some((object) => object.kind === 'data-mask')) errors.push('Missing Data Mask');
  return errors;
}
