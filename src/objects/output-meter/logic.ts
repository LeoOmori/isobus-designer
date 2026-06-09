import { Gauge } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { EditorObject, ProjectState } from '../../domain/types';
import { writeOutputMeter } from '../../domain/export/writers/outputMeter';
import { createCanvasBase } from '../createHelpers';
import type { CreateObjectContext, ObjectLookup, ObjectMeta, ObjectModule } from '../ObjectModule';

export const outputMeterMeta = {
  name: 'Output Meter', Icon: Gauge, category: 'output', isReference: false, hasLayout: true,
} satisfies ObjectMeta;

export function createDefaultOutputMeter({ current, x, y, parentId }: CreateObjectContext): EditorObject {
  return {
    ...createCanvasBase('output-meter', outputMeterMeta.name, current, x, y, parentId, 120, 120),
    needleColor: 0,
    borderColorIndex: 0,
    arcAndTickColor: 0,
    meterOptions: 0b0101, // drawArc + drawTicks
    numberOfTicks: 5,
    startAngle: 110,
    endAngle: 35,
    minValue: 0,
    maxValue: 0,
    variableReference: null,
    value: 0,
  };
}

export function validateOutputMeter(obj: EditorObject, _project: ProjectState, _lookup: ObjectLookup): string[] {
  const errors: string[] = [];
  if (obj.width <= 0 || obj.width > 0xffff) errors.push(`Output Meter ${obj.id}: width must be a positive uint16`);
  if (!Number.isInteger(obj.numberOfTicks ?? 5)) errors.push(`Output Meter ${obj.id}: numberOfTicks must be an integer`);
  return errors;
}

export function outputMeterStyle(_object: EditorObject): CSSProperties {
  return {
    background: 'transparent',
    border: 'none',
    boxSizing: 'border-box',
    overflow: 'hidden',
  };
}

export const outputMeterModule = {
  kind: 'output-meter',
  meta: outputMeterMeta,
  exportOrder: 8,
  writer: writeOutputMeter,
  createDefault: createDefaultOutputMeter,
  validate: validateOutputMeter,
} satisfies ObjectModule<'output-meter'>;
