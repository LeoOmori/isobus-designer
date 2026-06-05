import type { EditorObject, ObjectKind } from './types';

export const vtColors = [
  '#000000', '#ffffff', '#00ff00', '#ff0000', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#808080', '#c0c0c0',
  '#800000', '#008000', '#000080', '#808000', '#800080', '#ffffff',
];

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
  'soft-key-mask':   4,
  'key':             5,
  'button':          6,
  'output-string':  11,
  'output-number':  12,
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
  { value: 0, label: 'Decimal' },
  { value: 1, label: 'Hexadecimal' },
];

/** Horizontal justification for Output String / Output Number. */
export const VT_H_JUSTIFY_OPTIONS = [
  { value: 'left',   label: 'Left'   },
  { value: 'center', label: 'Center' },
  { value: 'right',  label: 'Right'  },
];

/** Vertical justification for Output String / Output Number. */
export const VT_V_JUSTIFY_OPTIONS = [
  { value: 'top',    label: 'Top'    },
  { value: 'center', label: 'Middle' },
  { value: 'bottom', label: 'Bottom' },
];

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function snap(value: number) {
  return Math.round(value / 10) * 10;
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

export function verticalAlignToFlex(value: EditorObject['verticalAlign']) {
  if (value === 'center') return 'center';
  if (value === 'bottom') return 'flex-end';
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

/**
 * Cache: rawData array reference → { format, url }.
 * WeakMap so entries are GC-collected when the rawData array is dropped from state.
 */
const _rawDataUrlCache = new WeakMap<number[], { format: number; url: string }>();

/**
 * Convert raw image bytes (stored in Picture Graphic rawData) to a displayable
 * base64 data URL. graphicFormat 0 = BMP, 1 = PNG.
 *
 * Result is memoised by rawData reference identity so repeated calls during
 * canvas drag re-renders are O(1) after the first call.
 */
export function rawDataToDataUrl(rawData: number[] | undefined, graphicFormat: number | undefined): string | null {
  if (!rawData?.length) return null;
  const format = graphicFormat ?? 0;

  // Return cached URL when rawData reference and format haven't changed
  const cached = _rawDataUrlCache.get(rawData);
  if (cached && cached.format === format) return cached.url;

  // Build binary string in 8 KB chunks to avoid stack-overflow on large images
  // while still being significantly faster than single-character concatenation.
  const bytes  = new Uint8Array(rawData);
  const mime   = format === 1 ? 'image/png' : 'image/bmp';
  let binary   = '';
  const CHUNK  = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...(bytes.subarray(i, i + CHUNK) as unknown as number[]));
  }
  const url = `data:${mime};base64,${btoa(binary)}`;

  _rawDataUrlCache.set(rawData, { format, url });
  return url;
}

/** Format an Output Number value using offset, scale, and decimal places. */
export function formatOutputNumber(
  raw: number,
  offset: number,
  scale: number,
  decimals: number,
  format: number,
) {
  const computed = (raw + offset) * scale;
  if (format === 1) return `0x${Math.round(computed).toString(16).toUpperCase()}`;
  return computed.toFixed(decimals);
}
