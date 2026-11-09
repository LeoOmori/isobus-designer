import type { ProjectState } from '../types';

/**
 * Trigger a browser file download of the given bytes (.iop, .zip, ...).
 * Appends a temporary <a> element, clicks it, then removes it.
 */
export function downloadFile(bytes: Uint8Array<ArrayBuffer>, filename: string): void {
  const blob = new Blob([bytes], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Build a safe default .iop filename from the project's Working Set name.
 * e.g. "Sprayer UI" → "sprayer-ui.iop"
 */
export function defaultIopFilename(project: ProjectState): string {
  const slug = project.workingSet.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    || 'object-pool';
  return `${slug}.iop`;
}
