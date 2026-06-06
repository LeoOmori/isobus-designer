import type { ObjectKind, ProjectState } from './types';
import {
  BUTTON_OPTION_LATCHABLE,
  BUTTON_OPTION_LATCHED,
  OUTPUT_STRING_OPTION_AUTO_WRAP,
  OUTPUT_STRING_OPTION_WRAP_ON_HYPHEN,
} from './isobus';
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

const BUTTON_CHILD_KINDS = new Set<ObjectKind>([
  'output-string', 'output-number', 'output-rectangle', 'picture-graphic',
]);

export function validate(project: ProjectState): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const objectById = new Map(project.objects.map((object) => [object.id, object]));

  for (const obj of project.objects) {
    // Unique IDs
    if (ids.has(obj.id)) errors.push(`Duplicate ID: ${obj.id}`);
    ids.add(obj.id);

    // Canvas objects must have positive dimensions
    if (!REFERENCE_ONLY_KINDS.has(obj.kind) && (obj.width <= 0 || obj.height <= 0)) {
      errors.push(`Invalid size: ${obj.id} (${obj.width}×${obj.height})`);
    }

    if (!REFERENCE_ONLY_KINDS.has(obj.kind) && obj.kind !== 'data-mask') {
      const childContainerIds = project.objects
        .filter((parent) => (parent.childObjectIds ?? []).includes(obj.id))
        .map((parent) => parent.id);
      const parent = obj.parentId ? objectById.get(obj.parentId) : undefined;

      if (obj.parentId && !parent) {
        errors.push(`${obj.id}: parentId "${obj.parentId}" not found`);
      }
      if (obj.parentId && parent?.childObjectIds !== undefined && !childContainerIds.includes(obj.parentId)) {
        errors.push(`${obj.id}: parentId "${obj.parentId}" must include this object in childObjectIds`);
      }
      if (childContainerIds.length > 1) {
        errors.push(`${obj.id}: object is listed as a child by multiple containers (${childContainerIds.join(', ')})`);
      }
      if (childContainerIds.length === 1 && obj.parentId && childContainerIds[0] !== obj.parentId) {
        errors.push(`${obj.id}: parentId "${obj.parentId}" does not match childObjectIds owner "${childContainerIds[0]}"`);
      }
      if (childContainerIds.length === 1 && !obj.parentId) {
        errors.push(`${obj.id}: child object must set parentId "${childContainerIds[0]}"`);
      }
    }

    // Output String must reference a Font Attribute
    if (obj.kind === 'output-string') {
      if (!obj.fontAttributeId) {
        errors.push(`Output String ${obj.id}: fontAttributeId is required`);
      } else if (objectById.get(obj.fontAttributeId)?.kind !== 'font-attribute') {
        errors.push(`Output String ${obj.id}: unknown fontAttributeId "${obj.fontAttributeId}"`);
      }

      const length = obj.length ?? 0;
      const textByteLength = utf8ByteLength(obj.text ?? '');
      const options = obj.outputOptions ?? 0;
      const variableReference = obj.variableReference !== undefined ? obj.variableReference : obj.stringVariableId || null;
      const variable = variableReference ? objectById.get(variableReference) : undefined;

      if (!Number.isInteger(length) || length <= 0 || length > 0xffff) {
        errors.push(`Output String ${obj.id}: length must be 1–65535 bytes`);
      } else if (textByteLength > length) {
        errors.push(`Output String ${obj.id}: text is ${textByteLength} bytes but fixed length is ${length}`);
      }

      if (options & ~0b111) {
        errors.push(`Output String ${obj.id}: outputOptions contains unknown bits`);
      }
      if ((options & OUTPUT_STRING_OPTION_WRAP_ON_HYPHEN) && !(options & OUTPUT_STRING_OPTION_AUTO_WRAP)) {
        errors.push(`Output String ${obj.id}: wrap-on-hyphen requires auto-wrap`);
      }
      if (![0, 1, 2].includes(obj.horizontalJustification ?? -1)) {
        errors.push(`Output String ${obj.id}: invalid horizontal justification`);
      }
      if (![0, 1, 2].includes(obj.verticalJustification ?? -1)) {
        errors.push(`Output String ${obj.id}: invalid vertical justification`);
      }
      if (!Number.isInteger(obj.backgroundColorIndex ?? 0) || (obj.backgroundColorIndex ?? 0) < 0 || (obj.backgroundColorIndex ?? 0) > 255) {
        errors.push(`Output String ${obj.id}: backgroundColorIndex must be 0–255`);
      }
      if (variableReference && variable?.kind !== 'string-variable') {
        errors.push(`Output String ${obj.id}: unknown variableReference "${variableReference}"`);
      } else if (variable?.kind === 'string-variable') {
        const variableBytes = utf8ByteLength(variable.stringValue ?? '');
        if (length > 0 && variableBytes > length) {
          errors.push(`Output String ${obj.id}: referenced String Variable is ${variableBytes} bytes but fixed length is ${length}`);
        }
        if ((variable.maxLength ?? 0) > length) {
          errors.push(`Output String ${obj.id}: referenced String Variable maxLength ${variable.maxLength} exceeds fixed length ${length}`);
        }
      }
    }

    // Output Number must reference a Font Attribute
    if (obj.kind === 'output-number' && obj.fontAttributeId && objectById.get(obj.fontAttributeId)?.kind !== 'font-attribute') {
      errors.push(`Output Number ${obj.id}: unknown fontAttributeId "${obj.fontAttributeId}"`);
    }

    if (obj.kind === 'button') {
      const keyCode = obj.keyCode ?? 0;
      const options = obj.buttonOptions ?? 0;
      const backgroundColorIndex = obj.backgroundColorIndex ?? 1;
      const borderColorIndex = obj.borderColorIndex ?? 0;

      if (!Number.isInteger(keyCode) || keyCode < 0 || keyCode > 0xff) {
        errors.push(`Button ${obj.id}: keyCode must be 0–255`);
      }
      if (!Number.isInteger(options) || options < 0 || options > 0xff) {
        errors.push(`Button ${obj.id}: buttonOptions must be 0–255`);
      } else if (options & 0b11000000) {
        errors.push(`Button ${obj.id}: reserved option bits 6-7 must be 0`);
      }
      if ((options & BUTTON_OPTION_LATCHED) && !(options & BUTTON_OPTION_LATCHABLE)) {
        errors.push(`Button ${obj.id}: latched requires latchable`);
      }
      if (!Number.isInteger(obj.width) || obj.width <= 0 || obj.width > 0xffff || !Number.isInteger(obj.height) || obj.height <= 0 || obj.height > 0xffff) {
        errors.push(`Button ${obj.id}: width/height must fit uint16`);
      }
      if (!Number.isInteger(backgroundColorIndex) || backgroundColorIndex < 0 || backgroundColorIndex > 0xff) {
        errors.push(`Button ${obj.id}: backgroundColorIndex must be 0–255`);
      }
      if (!Number.isInteger(borderColorIndex) || borderColorIndex < 0 || borderColorIndex > 0xff) {
        errors.push(`Button ${obj.id}: borderColorIndex must be 0–255`);
      }

      for (const childId of obj.childObjectIds ?? []) {
        const child = objectById.get(childId);
        if (!child || !BUTTON_CHILD_KINDS.has(child.kind)) {
          errors.push(`Button ${obj.id}: child "${childId}" must be Output String/Number/Rectangle or Picture Graphic`);
          continue;
        }
        if (child.parentId !== obj.id) {
          errors.push(`Button ${obj.id}: child "${childId}" parentId must reference the Button`);
        }
        if (!Number.isInteger(child.x) || child.x < -0x8000 || child.x > 0x7fff || !Number.isInteger(child.y) || child.y < -0x8000 || child.y > 0x7fff) {
          errors.push(`Button ${obj.id}: child "${childId}" coordinates must fit int16`);
        }
      }
    }

    // Output Rectangle must reference Line and Fill Attributes
    if (obj.kind === 'output-rectangle') {
      if (!obj.lineAttributeId) {
        errors.push(`Output Rectangle ${obj.id}: lineAttributeId is required`);
      } else if (objectById.get(obj.lineAttributeId)?.kind !== 'line-attribute') {
        errors.push(`Output Rectangle ${obj.id}: unknown lineAttributeId "${obj.lineAttributeId}"`);
      }
      if (obj.fillAttributeId && objectById.get(obj.fillAttributeId)?.kind !== 'fill-attribute') {
        errors.push(`Output Rectangle ${obj.id}: unknown fillAttributeId "${obj.fillAttributeId}"`);
      }
      const lineSuppression = obj.lineSuppression ?? 0;
      if (!Number.isInteger(lineSuppression) || lineSuppression < 0 || lineSuppression > 0x0f) {
        errors.push(`Output Rectangle ${obj.id}: lineSuppression must be a 4-bit value`);
      }
      if (!Number.isInteger(obj.width) || obj.width <= 0 || obj.width > 0xffff || !Number.isInteger(obj.height) || obj.height <= 0 || obj.height > 0xffff) {
        errors.push(`Output Rectangle ${obj.id}: width/height must fit uint16`);
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

  // Working set activeMask must be valid
  const { activeDataMaskId } = project.workingSet;
  if (activeDataMaskId && !project.objects.some((o) => o.id === activeDataMaskId && o.kind === 'data-mask')) {
    errors.push(`Working Set: activeDataMaskId "${activeDataMaskId}" not found`);
  }

  return errors;
}

function utf8ByteLength(value: string) {
  return new TextEncoder().encode(value).length;
}
