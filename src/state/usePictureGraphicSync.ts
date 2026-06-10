import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { EditorObject, ProjectState } from '../domain/types';
import {
  asPictureGraphicFormat,
  clearUnsupportedPictureGraphicOptions,
  derivedPictureGraphicHeight,
  expectedPictureGraphicRawDataLength,
  quantizePictureGraphicSource,
} from '../domain/vtPalette';

type PendingQuantization = {
  id: string;
  sourceImageDataUrl: string;
  isKeyIcon: boolean;
  format: 0 | 1 | 2;
  options: number;
  transparencyColor: number;
};

/**
 * Walk all Picture Graphics and re-quantize any whose `rawData` no longer matches
 * the format/dimensions implied by their `sourceImageDataUrl`. Key-icon Picture
 * Graphics are forced to 48×48 at x=6, y=6 per ISOBUS key icon rules.
 *
 * Runs whenever the object list changes, so importing/migrating an old project
 * automatically produces spec-compliant indexed bitmaps without the user
 * opening the Picture Graphic property panel.
 */
export function usePictureGraphicSync(
  project: ProjectState,
  setProject: Dispatch<SetStateAction<ProjectState>>,
): void {
  useEffect(() => {
    const objectById = new Map(project.objects.map((object) => [object.id, object]));
    const pending = collectPending(project.objects, objectById);

    if (!pending.length) return;

    let cancelled = false;
    void Promise.all(pending.map(async (item) => ({
      ...item,
      quantized: await quantizePictureGraphicSource(
        item.sourceImageDataUrl,
        item.format,
        item.options,
        item.transparencyColor,
        item.isKeyIcon ? 48 : undefined,
        item.isKeyIcon ? 48 : undefined,
      ),
    }))).then((results) => {
      if (cancelled) return;
      setProject((current) => applyQuantizedResults(current, results));
    });

    return () => { cancelled = true; };
  }, [project.objects, setProject]);
}

function collectPending(objects: EditorObject[], objectById: Map<string, EditorObject>): PendingQuantization[] {
  return objects
    .filter((object) => needsQuantization(object, objectById))
    .map((object) => ({
      id: object.id,
      sourceImageDataUrl: object.sourceImageDataUrl!,
      isKeyIcon: object.parentId ? objectById.get(object.parentId)?.kind === 'key' : false,
      format: asPictureGraphicFormat(object.graphicFormat),
      options: clearUnsupportedPictureGraphicOptions(object.graphicOptions ?? 0),
      transparencyColor: object.transparencyColor ?? 0,
    }));
}

function needsQuantization(object: EditorObject, objectById: Map<string, EditorObject>): boolean {
  if (object.kind !== 'picture-graphic' || !object.sourceImageDataUrl) return false;
  const parent = object.parentId ? objectById.get(object.parentId) : undefined;
  const isKeyIcon = parent?.kind === 'key';
  const format = asPictureGraphicFormat(object.graphicFormat);
  const expectedWidth = isKeyIcon ? 48 : object.actualWidth ?? 0;
  const expectedHeight = isKeyIcon ? 48 : object.actualHeight ?? 0;
  const expectedLength = expectedPictureGraphicRawDataLength(expectedWidth, expectedHeight, format);
  if (object.rawData?.length !== expectedLength) return true;
  if (isKeyIcon && (
    object.actualWidth !== 48 || object.actualHeight !== 48 ||
    object.targetWidth !== 48 || object.x !== 6 || object.y !== 6
  )) return true;
  return false;
}

type QuantizedResult = PendingQuantization & {
  quantized: Awaited<ReturnType<typeof quantizePictureGraphicSource>>;
};

function applyQuantizedResults(current: ProjectState, results: QuantizedResult[]): ProjectState {
  return {
    ...current,
    objects: current.objects.map((object) => mergeQuantizedResult(object, results)),
  };
}

function mergeQuantizedResult(object: EditorObject, results: QuantizedResult[]): EditorObject {
  const result = results.find((item) => item.id === object.id);
  if (!result || object.kind !== 'picture-graphic') return object;

  // Skip if the user has since changed the object's quantization inputs.
  const sourceChanged = object.sourceImageDataUrl !== result.sourceImageDataUrl
    || asPictureGraphicFormat(object.graphicFormat) !== result.format
    || clearUnsupportedPictureGraphicOptions(object.graphicOptions ?? 0) !== result.options
    || (object.transparencyColor ?? 0) !== result.transparencyColor;
  if (sourceChanged) return object;

  const targetWidth = result.isKeyIcon
    ? 48
    : object.targetWidth ?? object.width ?? result.quantized.actualWidth;
  return {
    ...object,
    ...result.quantized,
    graphicFormat: result.format,
    graphicOptions: result.options,
    targetWidth,
    width: targetWidth,
    height: derivedPictureGraphicHeight(targetWidth, result.quantized.actualWidth, result.quantized.actualHeight),
    x: result.isKeyIcon ? 6 : object.x,
    y: result.isKeyIcon ? 6 : object.y,
  };
}
