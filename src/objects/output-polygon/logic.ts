import { Hexagon } from 'lucide-react';
import type { EditorObject, ProjectState } from '../../domain/types';
import { writeOutputPolygon } from '../../domain/export/writers/outputPolygon';
import { createCanvasBase } from '../createHelpers';
import type { CreateObjectContext, ObjectLookup, ObjectMeta, ObjectModule } from '../ObjectModule';

export const outputPolygonMeta = {
  name: 'Output Polygon',
  Icon: Hexagon,
  category: 'output',
  isReference: false,
  hasLayout: true,
} satisfies ObjectMeta;

export function createDefaultOutputPolygon({ current, x, y, parentId }: CreateObjectContext): EditorObject {
  const defaultLine = current.objects.find((o) => o.kind === 'line-attribute');
  const defaultFill = current.objects.find((o) => o.kind === 'fill-attribute');
  return {
    ...createCanvasBase('output-polygon', outputPolygonMeta.name, current, x, y, parentId, 130, 90),
    lineAttributeId: defaultLine?.id ?? '',
    fillAttributeId: defaultFill?.id ?? null,
    polygonType: 2,
    polygonPoints: [
      { x: 65, y: 0 },
      { x: 130, y: 90 },
      { x: 0, y: 90 },
    ],
    macros: [],
  };
}

export function validateOutputPolygon(obj: EditorObject, _project: ProjectState, { objectById }: ObjectLookup): string[] {
  const errors: string[] = [];
  if (!obj.lineAttributeId) {
    errors.push(`Output Polygon ${obj.id}: lineAttributeId is required`);
  } else if (objectById.get(obj.lineAttributeId)?.kind !== 'line-attribute') {
    errors.push(`Output Polygon ${obj.id}: unknown lineAttributeId "${obj.lineAttributeId}"`);
  }
  if (obj.fillAttributeId && objectById.get(obj.fillAttributeId)?.kind !== 'fill-attribute') {
    errors.push(`Output Polygon ${obj.id}: unknown fillAttributeId "${obj.fillAttributeId}"`);
  }
  if (!Number.isInteger(obj.width) || obj.width <= 0 || obj.width > 0xffff) {
    errors.push(`Output Polygon ${obj.id}: width must be 1–65535`);
  }
  if (!Number.isInteger(obj.height) || obj.height <= 0 || obj.height > 0xffff) {
    errors.push(`Output Polygon ${obj.id}: height must be 1–65535`);
  }
  const pt = obj.polygonType ?? 2;
  if (!Number.isInteger(pt) || pt < 0 || pt > 3) {
    errors.push(`Output Polygon ${obj.id}: polygonType must be 0–3`);
  }
  const points = obj.polygonPoints ?? [];
  if (points.length < 3) {
    errors.push(`Output Polygon ${obj.id}: at least 3 points required`);
  }
  if (points.length > 255) {
    errors.push(`Output Polygon ${obj.id}: max 255 points supported`);
  }
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (!Number.isInteger(p.x) || p.x < 0 || p.x > 0xffff) {
      errors.push(`Output Polygon ${obj.id}: point ${i}.x must be uint16 (0–65535)`);
    }
    if (!Number.isInteger(p.y) || p.y < 0 || p.y > 0xffff) {
      errors.push(`Output Polygon ${obj.id}: point ${i}.y must be uint16 (0–65535)`);
    }
  }
  return errors;
}

export const outputPolygonModule = {
  kind: 'output-polygon',
  meta: outputPolygonMeta,
  exportOrder: 10,
  writer: writeOutputPolygon,
  createDefault: createDefaultOutputPolygon,
  validate: validateOutputPolygon,
} satisfies ObjectModule<'output-polygon'>;
