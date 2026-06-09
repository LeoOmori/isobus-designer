import { Circle } from 'lucide-react';
import type { EditorObject, ProjectState } from '../../domain/types';
import { writeOutputEllipse } from '../../domain/export/writers/outputEllipse';
import { createCanvasBase } from '../createHelpers';
import type { CreateObjectContext, ObjectLookup, ObjectMeta, ObjectModule } from '../ObjectModule';

export const outputEllipseMeta = {
  name: 'Output Ellipse',
  Icon: Circle,
  category: 'output',
  isReference: false,
  hasLayout: true,
} satisfies ObjectMeta;

export function createDefaultOutputEllipse({ current, x, y, parentId }: CreateObjectContext): EditorObject {
  const defaultLine = current.objects.find((object) => object.kind === 'line-attribute');
  const defaultFill = current.objects.find((object) => object.kind === 'fill-attribute');
  return {
    ...createCanvasBase('output-ellipse', outputEllipseMeta.name, current, x, y, parentId, 100, 80),
    lineAttributeId: defaultLine?.id ?? '',
    fillAttributeId: defaultFill?.id ?? null,
    ellipseType: 0,
    startAngle: 0,
    endAngle: 0,
    macros: [],
  };
}

export function validateOutputEllipse(obj: EditorObject, _project: ProjectState, { objectById }: ObjectLookup): string[] {
  const errors: string[] = [];
  if (!obj.lineAttributeId) {
    errors.push(`Output Ellipse ${obj.id}: lineAttributeId is required`);
  } else if (objectById.get(obj.lineAttributeId)?.kind !== 'line-attribute') {
    errors.push(`Output Ellipse ${obj.id}: unknown lineAttributeId "${obj.lineAttributeId}"`);
  }
  if (!Number.isInteger(obj.width) || obj.width <= 0 || obj.width > 0xffff) {
    errors.push(`Output Ellipse ${obj.id}: width must be 1–65535`);
  }
  if (!Number.isInteger(obj.height) || obj.height <= 0 || obj.height > 0xffff) {
    errors.push(`Output Ellipse ${obj.id}: height must be 1–65535`);
  }
  const et = obj.ellipseType ?? 0;
  if (et < 0 || et > 3) {
    errors.push(`Output Ellipse ${obj.id}: ellipseType must be 0–3`);
  }
  const sa = obj.startAngle ?? 0;
  const ea = obj.endAngle ?? 0;
  if (sa < 0 || sa > 180) errors.push(`Output Ellipse ${obj.id}: startAngle must be 0–180`);
  if (ea < 0 || ea > 180) errors.push(`Output Ellipse ${obj.id}: endAngle must be 0–180`);
  return errors;
}

export const outputEllipseModule = {
  kind: 'output-ellipse',
  meta: outputEllipseMeta,
  exportOrder: 9,
  writer: writeOutputEllipse,
  createDefault: createDefaultOutputEllipse,
  validate: validateOutputEllipse,
} satisfies ObjectModule<'output-ellipse'>;
