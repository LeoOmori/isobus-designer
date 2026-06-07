import { Image } from 'lucide-react';
import type { EditorObject, ProjectState } from '../../domain/types';
import {
  PICTURE_GRAPHIC_OPTION_RLE,
  asPictureGraphicFormat,
  clearUnsupportedPictureGraphicOptions,
  derivedPictureGraphicHeight,
  expectedPictureGraphicRawDataLength,
  pictureFormatMaxIndex,
} from '../../domain/vtPalette';
import { writePictureGraphic } from '../../domain/export/writers/pictureGraphic';
import { activeParent, createCanvasBase } from '../createHelpers';
import type { CreateObjectContext, ObjectLookup, ObjectMeta, ObjectModule } from '../ObjectModule';

export const pictureGraphicMeta = {
  name: 'Picture Graphic', Icon: Image, category: 'output', isReference: false, hasLayout: true,
} satisfies ObjectMeta;

export function createDefaultPictureGraphic({ current, x, y, parentId }: CreateObjectContext): EditorObject {
  const parent = activeParent(current, parentId);
  const isKeyIcon = parent.kind === 'key';
  return {
    ...createCanvasBase('picture-graphic', pictureGraphicMeta.name, current, isKeyIcon ? 6 : x, isKeyIcon ? 6 : y, parentId, isKeyIcon ? 48 : 64, isKeyIcon ? 48 : 64),
    targetWidth: isKeyIcon ? 48 : 64,
    actualWidth: isKeyIcon ? 48 : 64,
    actualHeight: isKeyIcon ? 48 : 64,
    graphicFormat: 2,
    graphicOptions: 0,
    transparencyColor: 0,
    rawData: [],
  };
}

export function migratePictureGraphic(object: EditorObject): EditorObject {
  const targetWidth = object.targetWidth ?? object.width ?? object.actualWidth ?? 64;
  const actualWidth = object.actualWidth ?? object.width ?? 64;
  const actualHeight = object.actualHeight ?? object.height ?? 64;
  const sourceImageDataUrl = object.sourceImageDataUrl ?? legacyImageDataUrl(object.rawData);
  const rawData = sourceImageDataUrl && !object.sourceImageDataUrl ? [] : object.rawData;

  return {
    ...object,
    targetWidth,
    width: targetWidth,
    height: derivedPictureGraphicHeight(targetWidth, actualWidth, actualHeight),
    actualWidth,
    actualHeight,
    graphicFormat: sourceImageDataUrl && !object.sourceImageDataUrl ? 2 : asPictureGraphicFormat(object.graphicFormat),
    graphicOptions: clearUnsupportedPictureGraphicOptions(object.graphicOptions ?? 0),
    rawData,
    sourceImageDataUrl,
  };
}

export function validatePictureGraphic(obj: EditorObject, _project: ProjectState, _lookup: ObjectLookup): string[] {
  const errors: string[] = [];
  const actualWidth = obj.actualWidth ?? 0;
  const actualHeight = obj.actualHeight ?? 0;
  const format = asPictureGraphicFormat(obj.graphicFormat);
  const expectedLength = expectedPictureGraphicRawDataLength(actualWidth, actualHeight, format);

  if (actualWidth <= 0 || actualHeight <= 0) errors.push(`Picture Graphic ${obj.id}: actualWidth and actualHeight must be positive`);
  if ((obj.targetWidth ?? obj.width) <= 0) errors.push(`Picture Graphic ${obj.id}: target width must be positive`);
  if (obj.rawData?.length && obj.rawData.length !== expectedLength) errors.push(`Picture Graphic ${obj.id}: rawData length ${obj.rawData.length} does not match ${expectedLength} bytes for ${actualWidth}×${actualHeight} format ${format}`);
  if ((obj.graphicOptions ?? 0) & PICTURE_GRAPHIC_OPTION_RLE) errors.push(`Picture Graphic ${obj.id}: RLE compression is not supported in this editor version`);
  if ((obj.graphicOptions ?? 0) & ~0b111) errors.push(`Picture Graphic ${obj.id}: graphicOptions contains unknown bits`);
  if ((obj.transparencyColor ?? 0) > pictureFormatMaxIndex(format)) errors.push(`Picture Graphic ${obj.id}: transparencyColor must fit format ${format}`);
  if (obj.rawData?.some((byte) => !Number.isInteger(byte) || byte < 0 || byte > 255)) errors.push(`Picture Graphic ${obj.id}: rawData must contain byte values only`);
  return errors;
}

export function validatePictureGraphicForExport(obj: EditorObject, _project: ProjectState, _lookup: ObjectLookup): string[] {
  const errors: string[] = [];
  if ((obj.graphicOptions ?? 0) & PICTURE_GRAPHIC_OPTION_RLE) errors.push(`Export: Picture Graphic ${obj.id} has RLE compression enabled (not supported in V1 export)`);
  const format = asPictureGraphicFormat(obj.graphicFormat);
  const actualWidth = obj.actualWidth ?? 0;
  const actualHeight = obj.actualHeight ?? 0;
  const expectedLength = expectedPictureGraphicRawDataLength(actualWidth, actualHeight, format);
  if (expectedLength === 0) errors.push(`Export: Picture Graphic ${obj.id} has no image data (actualWidth or actualHeight is zero)`);
  else if (!obj.rawData || obj.rawData.length !== expectedLength) {
    errors.push(`Export: Picture Graphic ${obj.id} rawData length ${obj.rawData?.length ?? 0} does not match expected ${expectedLength} bytes for ${actualWidth}×${actualHeight} format ${format}`);
  }
  return errors;
}

export const pictureGraphicModule = {
  kind: 'picture-graphic',
  meta: pictureGraphicMeta,
  exportOrder: 5,
  writer: writePictureGraphic,
  createDefault: createDefaultPictureGraphic,
  migrate: migratePictureGraphic,
  validate: validatePictureGraphic,
  validateExport: validatePictureGraphicForExport,
} satisfies ObjectModule<'picture-graphic'>;

function legacyImageDataUrl(rawData: number[] | undefined) {
  if (!rawData?.length) return undefined;
  const isPng = rawData[0] === 0x89 && rawData[1] === 0x50 && rawData[2] === 0x4e && rawData[3] === 0x47;
  const isJpeg = rawData[0] === 0xff && rawData[1] === 0xd8;
  const isGif = rawData[0] === 0x47 && rawData[1] === 0x49 && rawData[2] === 0x46;
  const isBmp = rawData[0] === 0x42 && rawData[1] === 0x4d;
  if (!isPng && !isJpeg && !isGif && !isBmp) return undefined;

  const bytes = new Uint8Array(rawData);
  let binary = '';
  const chunk = 8192;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...(bytes.subarray(index, index + chunk) as unknown as number[]));
  }

  const mime = isJpeg ? 'image/jpeg' : isGif ? 'image/gif' : isBmp ? 'image/bmp' : 'image/png';
  return `data:${mime};base64,${btoa(binary)}`;
}
