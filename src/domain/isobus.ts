import type { EditorObject, ObjectKind } from './types';
import { VT_PALETTE_HEX } from './vtPalette';

export const vtColors = VT_PALETTE_HEX;

export const vtFontCells = [
  { value: '6x8',   label: '6×8',   width: 6,  height: 8  },
  { value: '8x8',   label: '8×8',   width: 8,  height: 8  },
  { value: '8x10',  label: '8×10',  width: 8,  height: 10 },
  { value: '12x16', label: '12×16', width: 12, height: 16 },
  { value: '16x12', label: '16×12', width: 16, height: 12 },
  { value: '16x16', label: '16×16', width: 16, height: 16 },
  { value: '16x24', label: '16×24', width: 16, height: 24 },
  { value: '24x32', label: '24×32', width: 24, height: 32 },
  { value: '32x48', label: '32×48', width: 32, height: 48 },
  { value: '48x64', label: '48×64', width: 48, height: 64 },
];

/** ISO 11783-6 objectType numbers for each ObjectKind. */
export const VT_OBJECT_TYPES: Record<ObjectKind, number> = {
  'data-mask':       1,
  'container':       3,
  'soft-key-mask':   4,
  'key':             5,
  'button':          6,
  'input-boolean':   7,
  'input-string':    8,
  'input-number':    9,
  'input-list':      10,
  'output-string':  11,
  'output-number':  12,
  'output-line':    13,
  'output-polygon':  16,
  'output-ellipse': 15,
  'output-rectangle': 14,
  'picture-graphic': 20,
  'number-variable': 21,
  'string-variable': 22,
  'font-attribute':  23,
  'line-attribute':  24,
  'fill-attribute':  25,
};

/** ISO 11783-6 Fill Attribute fillType values. */
export const VT_FILL_TYPE_OPTIONS = [
  { value: 0, label: 'No Fill' },
  { value: 1, label: 'Line Color' },
  { value: 2, label: 'Fill Color' },
  { value: 3, label: 'Pattern (Picture Graphic)' },
];

/** ISO 11783-6 Output Number format values. */
export const VT_NUMBER_FORMAT_OPTIONS = [
  { value: 0, label: 'Fixed Decimal' },
  { value: 1, label: 'Exponential' },
];

export const OUTPUT_STRING_OPTION_TRANSPARENT = 1 << 0;
export const OUTPUT_STRING_OPTION_AUTO_WRAP = 1 << 1;
export const OUTPUT_STRING_OPTION_WRAP_ON_HYPHEN = 1 << 2;

export const OUTPUT_NUMBER_OPTION_TRANSPARENT = 1 << 0;
export const OUTPUT_NUMBER_OPTION_LEADING_ZEROS = 1 << 1;
export const OUTPUT_NUMBER_OPTION_ZERO_AS_BLANK = 1 << 2;
export const OUTPUT_NUMBER_OPTION_TRUNCATE = 1 << 3;

export const BUTTON_OPTION_LATCHABLE = 1 << 0;
export const BUTTON_OPTION_LATCHED = 1 << 1;
export const BUTTON_OPTION_SUPPRESS_BORDER = 1 << 2;
export const BUTTON_OPTION_TRANSPARENT_BACKGROUND = 1 << 3;
export const BUTTON_OPTION_DISABLED = 1 << 4;
export const BUTTON_OPTION_NO_BORDER = 1 << 5;
export const BUTTON_FACE_INSET = 4;

export const RECTANGLE_LINE_SUPPRESSION_TOP = 1 << 0;
export const RECTANGLE_LINE_SUPPRESSION_RIGHT = 1 << 1;
export const RECTANGLE_LINE_SUPPRESSION_BOTTOM = 1 << 2;
export const RECTANGLE_LINE_SUPPRESSION_LEFT = 1 << 3;

export type HorizontalJustification = 0 | 1 | 2;
export type VerticalJustification = 0 | 1 | 2;

/** Horizontal justification for Output String / Output Number. */
export const VT_H_JUSTIFY_OPTIONS = [
  { value: 0, label: 'Left'   },
  { value: 1, label: 'Middle' },
  { value: 2, label: 'Right'  },
];

/** Vertical justification for Output String / Output Number. */
export const VT_V_JUSTIFY_OPTIONS = [
  { value: 0, label: 'Top'    },
  { value: 1, label: 'Middle' },
  { value: 2, label: 'Bottom' },
];

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function snap(value: number) {
  return Math.round(value);
}

export function vtColor(index = 0) {
  return vtColors[clamp(index, 0, vtColors.length - 1)] ?? '#000000';
}

export function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

export function nearestVtColorIndex(hex: string) {
  const target = hexToRgb(hex);
  return vtColors.reduce((bestIndex, color, index) => {
    const current = hexToRgb(color);
    const best = hexToRgb(vtColors[bestIndex]);
    const currentDistance = (target.r - current.r) ** 2 + (target.g - current.g) ** 2 + (target.b - current.b) ** 2;
    const bestDistance    = (target.r - best.r)    ** 2 + (target.g - best.g)    ** 2 + (target.b - best.b)    ** 2;
    return currentDistance < bestDistance ? index : bestIndex;
  }, 0);
}

export function asHorizontalJustification(value: number | undefined): HorizontalJustification {
  return value === 0 || value === 1 || value === 2 ? value : 0;
}

export function asVerticalJustification(value: number | undefined): VerticalJustification {
  return value === 0 || value === 1 || value === 2 ? value : 0;
}

export function packJustification(horizontal: HorizontalJustification, vertical: VerticalJustification) {
  return horizontal | (vertical << 2);
}

export function unpackJustification(justification: number) {
  return {
    horizontal: asHorizontalJustification(justification & 0b11),
    vertical: asVerticalJustification((justification >> 2) & 0b11),
  };
}

/** Convert ISOBUS lineArt hex string to SVG strokeDasharray scaled by strokeWidth. */
export function lineArtToDash(lineArt = '0xFFFF', strokeWidth: number): string | undefined {
  const n = lineArt.toUpperCase();
  if (n === '0XFFFF') return undefined;                          // solid
  if (n === '0XF0F0') return `${strokeWidth * 4} ${strokeWidth * 2}`;  // dashed
  if (n === '0XAAAA') return `${strokeWidth} ${strokeWidth * 2}`;       // dotted
  // Generic 16-bit pattern: convert run-length to dash array
  const bits = parseInt(lineArt, 16);
  if (isNaN(bits)) return undefined;
  const dashes: number[] = [];
  let current = (bits >> 15) & 1;
  let run = 0;
  for (let i = 15; i >= 0; i--) {
    const bit = (bits >> i) & 1;
    if (bit === current) {
      run++;
    } else {
      dashes.push(run * strokeWidth);
      current = bit;
      run = 1;
    }
  }
  dashes.push(run * strokeWidth);
  // If pattern doesn't start with a filled bit, prepend a zero gap
  if (((bits >> 15) & 1) === 0) dashes.unshift(0);
  return dashes.join(' ');
}

export function lineArtToCss(lineArt = '0xFFFF') {
  const n = lineArt.toUpperCase();
  if (n === '0XF0F0') return 'dashed';
  if (n === '0XAAAA') return 'dotted';
  return 'solid';
}

/**
 * Convert ISO Fill Attribute fillType (uint8) + color to a CSS background value.
 * 0 = no fill, 1 = line color (treated as fill color here), 2 = fill color, 3 = pattern hint.
 */
export function fillTypeToBackground(fillType: number | undefined, color: string) {
  if (fillType === 0) return 'transparent';
  if (fillType === 3) return `repeating-linear-gradient(45deg, ${color} 0 2px, transparent 2px 8px)`;
  return color; // fillType 1 or 2
}

export function horizontalAlignToFlex(value: EditorObject['horizontalAlign']) {
  if (value === 'center') return 'center';
  if (value === 'right')  return 'flex-end';
  return 'flex-start';
}

export function horizontalJustificationToFlex(value: HorizontalJustification | undefined) {
  if (value === 1) return 'center';
  if (value === 2) return 'flex-end';
  return 'flex-start';
}

export function verticalAlignToFlex(value: EditorObject['verticalAlign']) {
  if (value === 'center') return 'center';
  if (value === 'bottom') return 'flex-end';
  return 'flex-start';
}

export function verticalJustificationToFlex(value: VerticalJustification | undefined) {
  if (value === 1) return 'center';
  if (value === 2) return 'flex-end';
  return 'flex-start';
}

export function fontCellValue(font?: EditorObject) {
  return `${font?.fontWidth ?? 16}x${font?.fontHeight ?? font?.fontSize ?? 24}`;
}

export function fontCellScaleX(font?: EditorObject) {
  const width  = font?.fontWidth  ?? 16;
  const height = font?.fontHeight ?? font?.fontSize ?? 24;
  return height > 0 ? width / height : 1;
}

export function textTransformOrigin(horizontalAlign: EditorObject['horizontalAlign']) {
  if (horizontalAlign === 'center') return 'center center';
  if (horizontalAlign === 'right')  return 'right center';
  return 'left center';
}

export function textJustificationTransformOrigin(horizontal: HorizontalJustification | undefined) {
  if (horizontal === 1) return 'center center';
  if (horizontal === 2) return 'right center';
  return 'left center';
}

/** Format an Output Number value using offset, scale, and decimal places. */
export function formatOutputNumber(
  raw: number,
  offset: number,
  scale: number,
  decimals: number,
  format: number,
  options = 0,
  fieldCharWidth = 0,
) {
  const computed = (raw + offset) * scale;
  const decimalCount = clamp(Math.round(decimals), 0, 7);
  const truncate = (options & OUTPUT_NUMBER_OPTION_TRUNCATE) !== 0;
  const adjusted = truncate ? truncateToDecimals(computed, decimalCount) : roundToDecimals(computed, decimalCount);
  const zeroAsBlank = format === 1
    ? computed === 0 || Object.is(computed, -0)
    : adjusted === 0 || Object.is(adjusted, -0);

  if ((options & OUTPUT_NUMBER_OPTION_ZERO_AS_BLANK) !== 0 && zeroAsBlank) {
    return '';
  }

  const formatted = format === 1
    ? formatExponential(computed, decimalCount, truncate)
    : adjusted.toFixed(decimalCount);
  return (options & OUTPUT_NUMBER_OPTION_LEADING_ZEROS) !== 0
    ? padLeadingZeros(formatted, Math.floor(fieldCharWidth))
    : formatted;
}

function roundToDecimals(value: number, decimals: number) {
  const factor = 10 ** decimals;
  const sign = Math.sign(value) || 1;
  return sign * Math.round(Math.abs(value) * factor) / factor;
}

function truncateToDecimals(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.trunc(value * factor) / factor;
}

function formatExponential(value: number, decimals: number, truncate: boolean) {
  if (value === 0) return `0${decimals > 0 ? `.${'0'.repeat(decimals)}` : ''}E+00`;

  let exponent = Math.floor(Math.log10(Math.abs(value)));
  const mantissa = value / (10 ** exponent);
  let adjustedMantissa = truncate ? truncateToDecimals(mantissa, decimals) : roundToDecimals(mantissa, decimals);
  if (Math.abs(adjustedMantissa) >= 10) {
    adjustedMantissa /= 10;
    exponent += 1;
  }
  const sign = exponent < 0 ? '-' : '+';
  const exponentText = Math.abs(exponent).toString().padStart(2, '0');
  return `${adjustedMantissa.toFixed(decimals)}E${sign}${exponentText}`;
}

function padLeadingZeros(value: string, fieldCharWidth: number) {
  if (fieldCharWidth <= 0 || value.length >= fieldCharWidth) return value;

  const exponentIndex = value.toUpperCase().indexOf('E');
  const numeric = exponentIndex >= 0 ? value.slice(0, exponentIndex) : value;
  const exponent = exponentIndex >= 0 ? value.slice(exponentIndex) : '';
  const sign = value.startsWith('-') ? '-' : '';
  const unsigned = sign ? numeric.slice(1) : numeric;
  const [integer, fraction] = unsigned.split('.');
  const separatorAndFraction = fraction === undefined ? '' : `.${fraction}`;
  const targetIntegerLength = fieldCharWidth - sign.length - separatorAndFraction.length - exponent.length;
  if (targetIntegerLength <= integer.length) return value;
  return `${sign}${integer.padStart(targetIntegerLength, '0')}${separatorAndFraction}${exponent}`;
}
