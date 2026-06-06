import { vtFontCells } from '../isobus';
import type { ProjectState } from '../types';
import { validate } from '../validation';
import { asPictureGraphicFormat, expectedPictureGraphicRawDataLength, PICTURE_GRAPHIC_OPTION_RLE } from '../vtPalette';
import { encodeLatin1Padded, fontSizeEnum, isLatin1 } from './encoding';
import { buildIdMap, parseHexObjectId } from './idResolver';

/**
 * Run all pre-export validations for V1 .iop export.
 * Returns an array of human-readable error messages; empty = ready to export.
 *
 * Runs the full editor validate() first, then adds export-specific checks:
 *  - At least one Data Mask
 *  - Working Set has an active Data Mask
 *  - uint16 objectId uniqueness (WS forced to 0x0000)
 *  - No objectId collision with 0x0000 (reserved for WS)
 *  - All strings are Latin-1 representable
 *  - Font Attributes have a standard V1 cell size
 *  - Output String text fits within its fixed length in Latin-1 bytes
 *  - Picture Graphics have raw data + no RLE
 *  - No macros (V1 unsupported)
 */
export function validateForExport(project: ProjectState): string[] {
  // Run the existing editor validator
  const errors = [...validate(project)];

  const { workingSet, objects } = project;

  // ── Working Set & pool structure ────────────────────────────────────────
  if (!workingSet.activeDataMaskId) {
    errors.push('Export: Working Set must have an Active Data Mask set');
  }
  if (!objects.some((o) => o.kind === 'data-mask')) {
    errors.push('Export: Pool must contain at least one Data Mask');
  }

  // ── uint16 objectId uniqueness ──────────────────────────────────────────
  const seenIds = new Map<number, string>();
  seenIds.set(0x0000, workingSet.id); // WS always gets 0x0000

  for (const obj of objects) {
    let n: number;
    try {
      n = parseHexObjectId(obj.objectId);
    } catch {
      errors.push(`Export: ${obj.id} has invalid objectId "${obj.objectId}" (must be hex 0x0001–0xFFFE)`);
      continue;
    }

    if (n === 0x0000) {
      errors.push(`Export: ${obj.id} objectId 0x0000 is reserved for the Working Set`);
      continue;
    }

    const collision = seenIds.get(n);
    if (collision) {
      const hex = `0x${n.toString(16).toUpperCase().padStart(4, '0')}`;
      errors.push(`Export: Duplicate objectId ${hex} shared by "${obj.id}" and "${collision}"`);
    } else {
      seenIds.set(n, obj.id);
    }
  }

  // ── Latin-1 string validation ────────────────────────────────────────────
  for (const obj of objects) {
    if (obj.kind === 'output-string') {
      const text = obj.text ?? '';
      if (!isLatin1(text)) {
        errors.push(`Export: Output String ${obj.id} text contains non-Latin-1 characters (V1 supports ISO 8859-1 only)`);
      } else {
        // Verify the encoded text fits within the fixed length field
        const length = obj.length ?? 0;
        if (length > 0) {
          const encoded = encodeLatin1Padded(text, length);
          // encodeLatin1Padded silently truncates — check raw char count instead
          if (text.length > length) {
            errors.push(`Export: Output String ${obj.id} text (${text.length} chars) exceeds fixed length ${length}`);
          }
          void encoded; // used only to confirm encoding works
        }
      }
    }
    if (obj.kind === 'string-variable') {
      const text = obj.stringValue ?? '';
      if (!isLatin1(text)) {
        errors.push(`Export: String Variable ${obj.id} value contains non-Latin-1 characters (V1 supports ISO 8859-1 only)`);
      }
    }
  }

  // ── Font Attribute cell size enum ────────────────────────────────────────
  for (const obj of objects) {
    if (obj.kind === 'font-attribute') {
      const w = obj.fontWidth ?? 16;
      const h = obj.fontHeight ?? 24;
      if (fontSizeEnum(w, h) === -1) {
        const valid = vtFontCells.map((c) => c.label).join(', ');
        errors.push(`Export: Font Attribute ${obj.id} size ${w}×${h} is not a standard V1 cell size. Valid sizes: ${valid}`);
      }
    }
  }

  // ── Picture Graphic constraints ──────────────────────────────────────────
  for (const obj of objects) {
    if (obj.kind === 'picture-graphic') {
      if ((obj.graphicOptions ?? 0) & PICTURE_GRAPHIC_OPTION_RLE) {
        errors.push(`Export: Picture Graphic ${obj.id} has RLE compression enabled (not supported in V1 export)`);
      }
      const format = asPictureGraphicFormat(obj.graphicFormat);
      const actualWidth = obj.actualWidth ?? 0;
      const actualHeight = obj.actualHeight ?? 0;
      const expectedLength = expectedPictureGraphicRawDataLength(actualWidth, actualHeight, format);
      if (expectedLength === 0) {
        errors.push(`Export: Picture Graphic ${obj.id} has no image data (actualWidth or actualHeight is zero)`);
      } else if (!obj.rawData || obj.rawData.length !== expectedLength) {
        errors.push(
          `Export: Picture Graphic ${obj.id} rawData length ${obj.rawData?.length ?? 0} ` +
          `does not match expected ${expectedLength} bytes for ${actualWidth}×${actualHeight} format ${format}`,
        );
      }
    }
  }

  // ── Macros: unsupported in V1 ────────────────────────────────────────────
  for (const obj of objects) {
    if ((obj.macros ?? []).length > 0) {
      errors.push(`Export: ${obj.id} has macro references (macros are not supported in V1 export)`);
    }
  }

  return errors;
}

/** Convenience: returns true if the project is ready for .iop export. */
export function isExportReady(project: ProjectState): boolean {
  return validateForExport(project).length === 0;
}
