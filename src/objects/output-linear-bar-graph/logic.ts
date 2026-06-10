import { BarChart } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { EditorObject, ProjectState } from '../../domain/types';
import { writeOutputLinearBarGraph } from '../../domain/export/writers/outputLinearBarGraph';
import { createCanvasBase } from '../createHelpers';
import type { CreateObjectContext, ObjectLookup, ObjectMeta, ObjectModule } from '../ObjectModule';

export const outputLinearBarGraphMeta = {
  name: 'Output Linear Bar Graph', Icon: BarChart, category: 'output', isReference: false, hasLayout: true,
} satisfies ObjectMeta;

export function createDefaultOutputLinearBarGraph({ current, x, y, parentId }: CreateObjectContext): EditorObject {
  return {
    ...createCanvasBase('output-linear-bar-graph', outputLinearBarGraphMeta.name, current, x, y, parentId, 160, 40),
    backgroundColorIndex: 2,
    targetLineColor: 0,
    linearBarOptions: 0b000001, // drawBorder = true, other options = false
    numberOfTicks: 0,
    minValue: 0,
    maxValue: 100,
    variableReference: null,
    value: 50,
    targetValueVariableReference: null,
    targetValue: 25,
  };
}

export function validateOutputLinearBarGraph(obj: EditorObject, _project: ProjectState, _lookup: ObjectLookup): string[] {
  const errors: string[] = [];
  if (obj.width <= 0 || obj.width > 0xffff) errors.push(`Output Linear Bar Graph ${obj.id}: width must be a positive uint16`);
  if (obj.height <= 0 || obj.height > 0xffff) errors.push(`Output Linear Bar Graph ${obj.id}: height must be a positive uint16`);
  if ((obj.minValue ?? 0) > 0xffff) errors.push(`Output Linear Bar Graph ${obj.id}: minValue must be uint16`);
  if ((obj.maxValue ?? 0) > 0xffff) errors.push(`Output Linear Bar Graph ${obj.id}: maxValue must be uint16`);
  if ((obj.value ?? 0) > 0xffff) errors.push(`Output Linear Bar Graph ${obj.id}: value must be uint16`);
  if ((obj.targetValue ?? 0) > 0xffff) errors.push(`Output Linear Bar Graph ${obj.id}: targetValue must be uint16`);
  if ((obj.numberOfTicks ?? 0) > 255) errors.push(`Output Linear Bar Graph ${obj.id}: numberOfTicks must be uint8`);
  return errors;
}

export function outputLinearBarGraphStyle(_object: EditorObject): CSSProperties {
  return {
    background: 'transparent',
    border: 'none',
    boxSizing: 'border-box',
    overflow: 'hidden',
  };
}

export const outputLinearBarGraphModule = {
  kind: 'output-linear-bar-graph',
  meta: outputLinearBarGraphMeta,
  exportOrder: 9,
  writer: writeOutputLinearBarGraph,
  createDefault: createDefaultOutputLinearBarGraph,
  validate: validateOutputLinearBarGraph,
} satisfies ObjectModule<'output-linear-bar-graph'>;