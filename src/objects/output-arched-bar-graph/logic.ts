import { CircleDot } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { EditorObject, ProjectState } from '../../domain/types';
import { writeOutputArchedBarGraph } from '../../domain/export/writers/outputArchedBarGraph';
import { createCanvasBase } from '../createHelpers';
import type { CreateObjectContext, ObjectLookup, ObjectMeta, ObjectModule } from '../ObjectModule';

export const outputArchedBarGraphMeta = {
  name: 'Output Arched Bar Graph', Icon: CircleDot, category: 'output', isReference: false, hasLayout: true,
} satisfies ObjectMeta;

export function createDefaultOutputArchedBarGraph({ current, x, y, parentId }: CreateObjectContext): EditorObject {
  return {
    ...createCanvasBase('output-arched-bar-graph', outputArchedBarGraphMeta.name, current, x, y, parentId, 120, 120),
    backgroundColorIndex: 2,
    targetLineColor: 4,
    archedBarOptions: 0b00011, // drawBorder + drawTargetLine
    arcStartAngle: 45, // 90 degrees, stored as 45 (angle/2)
    arcEndAngle: 135, // 270 degrees, stored as 135 (angle/2)
    barGraphWidth: 12,
    minValue: 0,
    maxValue: 100,
    variableReference: null,
    value: 50,
    targetValueVariableReference: null,
    targetValue: 80,
  };
}

export function validateOutputArchedBarGraph(obj: EditorObject, _project: ProjectState, _lookup: ObjectLookup): string[] {
  const errors: string[] = [];
  
  if (obj.width <= 0 || obj.width > 0xffff) {
    errors.push(`Output Arched Bar Graph ${obj.id}: width must be a positive uint16`);
  }
  if (obj.height <= 0 || obj.height > 0xffff) {
    errors.push(`Output Arched Bar Graph ${obj.id}: height must be a positive uint16`);
  }
  
  const startAngle = (obj.arcStartAngle ?? 45) * 2;
  const endAngle = (obj.arcEndAngle ?? 135) * 2;
  if (startAngle < 0 || startAngle > 360) {
    errors.push(`Output Arched Bar Graph ${obj.id}: start angle must be 0-360 degrees`);
  }
  if (endAngle < 0 || endAngle > 360) {
    errors.push(`Output Arched Bar Graph ${obj.id}: end angle must be 0-360 degrees`);
  }
  
  const barWidth = obj.barGraphWidth ?? 12;
  const minDimension = Math.min(obj.width, obj.height);
  if (barWidth >= minDimension / 2) {
    errors.push(`Output Arched Bar Graph ${obj.id}: bar graph width should be less than half of the smallest dimension`);
  }
  
  if ((obj.minValue ?? 0) > 0xffff) errors.push(`Output Arched Bar Graph ${obj.id}: minValue must be uint16`);
  if ((obj.maxValue ?? 0) > 0xffff) errors.push(`Output Arched Bar Graph ${obj.id}: maxValue must be uint16`);
  if ((obj.value ?? 0) > 0xffff) errors.push(`Output Arched Bar Graph ${obj.id}: value must be uint16`);
  if ((obj.targetValue ?? 0) > 0xffff) errors.push(`Output Arched Bar Graph ${obj.id}: targetValue must be uint16`);
  if ((obj.barGraphWidth ?? 0) > 0xffff) errors.push(`Output Arched Bar Graph ${obj.id}: barGraphWidth must be uint16`);
  
  return errors;
}

export function outputArchedBarGraphStyle(_object: EditorObject): CSSProperties {
  return {
    background: 'transparent',
    border: 'none',
    boxSizing: 'border-box',
    overflow: 'hidden',
  };
}

export const outputArchedBarGraphModule = {
  kind: 'output-arched-bar-graph',
  meta: outputArchedBarGraphMeta,
  exportOrder: 10,
  writer: writeOutputArchedBarGraph,
  createDefault: createDefaultOutputArchedBarGraph,
  validate: validateOutputArchedBarGraph,
} satisfies ObjectModule<'output-arched-bar-graph'>;