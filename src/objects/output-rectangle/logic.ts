import { Square } from 'lucide-react';
import type { CSSProperties } from 'react';
import {
  RECTANGLE_LINE_SUPPRESSION_BOTTOM,
  RECTANGLE_LINE_SUPPRESSION_LEFT,
  RECTANGLE_LINE_SUPPRESSION_RIGHT,
  RECTANGLE_LINE_SUPPRESSION_TOP,
  fillTypeToBackground,
  lineArtToCss,
  vtColor,
} from '../../domain/isobus';
import type { EditorObject, ProjectState } from '../../domain/types';
import { pictureGraphicToDataUrl } from '../../domain/vtPalette';
import { writeOutputRectangle } from '../../domain/export/writers/outputRectangle';
import { createCanvasBase } from '../createHelpers';
import type { CreateObjectContext, ObjectLookup, ObjectMeta, ObjectModule } from '../ObjectModule';

export const outputRectangleMeta = {
  name: 'Output Rectangle', Icon: Square, category: 'output', isReference: false, hasLayout: true,
} satisfies ObjectMeta;

export function createDefaultOutputRectangle({ current, x, y, parentId }: CreateObjectContext): EditorObject {
  const defaultLine = current.objects.find((object) => object.kind === 'line-attribute');
  const defaultFill = current.objects.find((object) => object.kind === 'fill-attribute');
  return {
    ...createCanvasBase('output-rectangle', outputRectangleMeta.name, current, x, y, parentId, 130, 90),
    lineAttributeId: defaultLine?.id ?? '',
    fillAttributeId: defaultFill?.id ?? null,
    lineSuppression: 0,
  };
}

export function validateOutputRectangle(obj: EditorObject, _project: ProjectState, { objectById }: ObjectLookup): string[] {
  const errors: string[] = [];
  if (!obj.lineAttributeId) errors.push(`Output Rectangle ${obj.id}: lineAttributeId is required`);
  else if (objectById.get(obj.lineAttributeId)?.kind !== 'line-attribute') errors.push(`Output Rectangle ${obj.id}: unknown lineAttributeId "${obj.lineAttributeId}"`);
  if (obj.fillAttributeId && objectById.get(obj.fillAttributeId)?.kind !== 'fill-attribute') errors.push(`Output Rectangle ${obj.id}: unknown fillAttributeId "${obj.fillAttributeId}"`);
  const lineSuppression = obj.lineSuppression ?? 0;
  if (!Number.isInteger(lineSuppression) || lineSuppression < 0 || lineSuppression > 0x0f) errors.push(`Output Rectangle ${obj.id}: lineSuppression must be a 4-bit value`);
  if (!Number.isInteger(obj.width) || obj.width <= 0 || obj.width > 0xffff || !Number.isInteger(obj.height) || obj.height <= 0 || obj.height > 0xffff) errors.push(`Output Rectangle ${obj.id}: width/height must fit uint16`);
  return errors;
}

export function outputRectangleStyle(object: EditorObject, line: EditorObject | undefined, fill: EditorObject | undefined, objects: EditorObject[]): CSSProperties {
  const lineWidth = line?.lineWidth ?? 1;
  const suppression = object.lineSuppression ?? 0;
  const pattern = fill?.fillType === 3 && fill.fillPattern
    ? objects.find((candidate) => candidate.kind === 'picture-graphic' && (candidate.id === fill.fillPattern || candidate.objectId === fill.fillPattern))
    : undefined;
  const patternUrl = pattern ? pictureGraphicToDataUrl(pattern) : null;

  let background: CSSProperties['background'];
  let backgroundImage: CSSProperties['backgroundImage'];
  let backgroundRepeat: CSSProperties['backgroundRepeat'];
  if (!fill) background = 'transparent';
  else if (fill.fillType === 1) background = vtColor(line?.lineColor ?? 0);
  else if (fill.fillType === 3 && patternUrl) {
    background = 'transparent';
    backgroundImage = `url(${patternUrl})`;
    backgroundRepeat = 'repeat';
  } else background = fillTypeToBackground(fill.fillType, vtColor(fill.fillColor ?? 15));

  return {
    borderColor: vtColor(line?.lineColor ?? 0),
    borderStyle: lineArtToCss(line?.lineArt),
    borderTopWidth: (suppression & RECTANGLE_LINE_SUPPRESSION_TOP) !== 0 ? 0 : lineWidth,
    borderRightWidth: (suppression & RECTANGLE_LINE_SUPPRESSION_RIGHT) !== 0 ? 0 : lineWidth,
    borderBottomWidth: (suppression & RECTANGLE_LINE_SUPPRESSION_BOTTOM) !== 0 ? 0 : lineWidth,
    borderLeftWidth: (suppression & RECTANGLE_LINE_SUPPRESSION_LEFT) !== 0 ? 0 : lineWidth,
    boxSizing: 'border-box',
    background,
    backgroundImage,
    backgroundRepeat,
  };
}

export const outputRectangleModule = {
  kind: 'output-rectangle',
  meta: outputRectangleMeta,
  exportOrder: 8,
  writer: writeOutputRectangle,
  createDefault: createDefaultOutputRectangle,
  validate: validateOutputRectangle,
} satisfies ObjectModule<'output-rectangle'>;
