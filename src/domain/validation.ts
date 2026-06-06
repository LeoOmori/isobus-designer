import type { ProjectState } from './types';
import {
  PICTURE_GRAPHIC_OPTION_RLE,
  asPictureGraphicFormat,
  expectedPictureGraphicRawDataLength,
  pictureFormatMaxIndex,
} from './vtPalette';

const REFERENCE_ONLY_KINDS = new Set([
  'line-attribute', 'fill-attribute', 'font-attribute',
  'string-variable', 'number-variable',
  'soft-key-mask', 'key',
]);

export function validate(project: ProjectState): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const obj of project.objects) {
    // Unique IDs
    if (ids.has(obj.id)) errors.push(`Duplicate ID: ${obj.id}`);
    ids.add(obj.id);

    // Canvas objects must have positive dimensions
    if (!REFERENCE_ONLY_KINDS.has(obj.kind) && (obj.width <= 0 || obj.height <= 0)) {
      errors.push(`Invalid size: ${obj.id} (${obj.width}×${obj.height})`);
    }

    // Output String must reference a Font Attribute
    if (obj.kind === 'output-string' && obj.fontAttributeId && !ids.has(obj.fontAttributeId)) {
      errors.push(`Output String ${obj.id}: unknown fontAttributeId "${obj.fontAttributeId}"`);
    }

    // Output Number must reference a Font Attribute
    if (obj.kind === 'output-number' && obj.fontAttributeId && !ids.has(obj.fontAttributeId)) {
      errors.push(`Output Number ${obj.id}: unknown fontAttributeId "${obj.fontAttributeId}"`);
    }

    // Output Rectangle must reference Line and Fill Attributes
    if (obj.kind === 'output-rectangle') {
      if (obj.lineAttributeId && !ids.has(obj.lineAttributeId)) {
        errors.push(`Output Rectangle ${obj.id}: unknown lineAttributeId "${obj.lineAttributeId}"`);
      }
      if (obj.fillAttributeId && !ids.has(obj.fillAttributeId)) {
        errors.push(`Output Rectangle ${obj.id}: unknown fillAttributeId "${obj.fillAttributeId}"`);
      }
    }

    // Fill Attribute: fillType=3 requires fillPattern
    if (obj.kind === 'fill-attribute' && obj.fillType === 3 && !obj.fillPattern) {
      errors.push(`Fill Attribute ${obj.id}: fillType=3 (pattern) requires a fillPattern reference`);
    }

    if (obj.kind === 'picture-graphic') {
      const actualWidth = obj.actualWidth ?? 0;
      const actualHeight = obj.actualHeight ?? 0;
      const format = asPictureGraphicFormat(obj.graphicFormat);
      const expectedLength = expectedPictureGraphicRawDataLength(actualWidth, actualHeight, format);

      if (actualWidth <= 0 || actualHeight <= 0) {
        errors.push(`Picture Graphic ${obj.id}: actualWidth and actualHeight must be positive`);
      }
      if ((obj.targetWidth ?? obj.width) <= 0) {
        errors.push(`Picture Graphic ${obj.id}: target width must be positive`);
      }
      if (obj.rawData?.length && obj.rawData.length !== expectedLength) {
        errors.push(`Picture Graphic ${obj.id}: rawData length ${obj.rawData.length} does not match ${expectedLength} bytes for ${actualWidth}×${actualHeight} format ${format}`);
      }
      if ((obj.graphicOptions ?? 0) & PICTURE_GRAPHIC_OPTION_RLE) {
        errors.push(`Picture Graphic ${obj.id}: RLE compression is not supported in this editor version`);
      }
      if ((obj.graphicOptions ?? 0) & ~0b111) {
        errors.push(`Picture Graphic ${obj.id}: graphicOptions contains unknown bits`);
      }
      if ((obj.transparencyColor ?? 0) > pictureFormatMaxIndex(format)) {
        errors.push(`Picture Graphic ${obj.id}: transparencyColor must fit format ${format}`);
      }
      if (obj.rawData?.some((byte) => !Number.isInteger(byte) || byte < 0 || byte > 255)) {
        errors.push(`Picture Graphic ${obj.id}: rawData must contain byte values only`);
      }
    }

    // Data Mask activeMask reference
    if (obj.kind === 'data-mask' && obj.softKeyMaskId) {
      const skmExists = project.objects.some((o) => o.id === obj.softKeyMaskId && o.kind === 'soft-key-mask');
      if (!skmExists) {
        errors.push(`Data Mask ${obj.id}: softKeyMaskId "${obj.softKeyMaskId}" not found`);
      }
    }
  }

  // Must have at least one Data Mask
  if (!project.objects.some((o) => o.kind === 'data-mask')) {
    errors.push('Project must have at least one Data Mask');
  }

  // Working set activeMask must be valid
  const { activeDataMaskId } = project.workingSet;
  if (activeDataMaskId && !project.objects.some((o) => o.id === activeDataMaskId && o.kind === 'data-mask')) {
    errors.push(`Working Set: activeDataMaskId "${activeDataMaskId}" not found`);
  }

  return errors;
}
