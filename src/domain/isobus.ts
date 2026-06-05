import type { EditorObject } from './types';

export const vtColors = ['#000000', '#ffffff', '#00ff00', '#ff0000', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#808080', '#c0c0c0', '#800000', '#008000', '#000080', '#808000', '#800080', '#ffffff'];

export const vtFontCells = [
  { value: '8x8', label: '8×8', width: 8, height: 8 },
  { value: '8x10', label: '8×10', width: 8, height: 10 },
  { value: '12x16', label: '12×16', width: 12, height: 16 },
  { value: '16x12', label: '16×12', width: 16, height: 12 },
  { value: '16x16', label: '16×16', width: 16, height: 16 },
  { value: '16x24', label: '16×24', width: 16, height: 24 },
  { value: '24x32', label: '24×32', width: 24, height: 32 },
  { value: '32x48', label: '32×48', width: 32, height: 48 },
  { value: '48x64', label: '48×64', width: 48, height: 64 },
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
    const bestDistance = (target.r - best.r) ** 2 + (target.g - best.g) ** 2 + (target.b - best.b) ** 2;
    return currentDistance < bestDistance ? index : bestIndex;
  }, 0);
}

export function lineArtToCss(lineArt = '0xFFFF') {
  const normalized = lineArt.toUpperCase();
  if (normalized === '0XF0F0') return 'dashed';
  if (normalized === '0XAAAA') return 'dotted';
  return 'solid';
}

export function fillTypeToBackground(fillType: EditorObject['fillType'], color: string) {
  if (fillType === 'hollow') return 'transparent';
  if (fillType === 'horizontal') return `repeating-linear-gradient(0deg, ${color} 0 2px, transparent 2px 8px)`;
  if (fillType === 'vertical') return `repeating-linear-gradient(90deg, ${color} 0 2px, transparent 2px 8px)`;
  if (fillType === 'cross-hatch') return `repeating-linear-gradient(0deg, ${color} 0 1px, transparent 1px 8px), repeating-linear-gradient(90deg, ${color} 0 1px, transparent 1px 8px)`;
  return color;
}

export function horizontalAlignToFlex(value: EditorObject['horizontalAlign']) {
  if (value === 'center') return 'center';
  if (value === 'right') return 'flex-end';
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
  const width = font?.fontWidth ?? 16;
  const height = font?.fontHeight ?? font?.fontSize ?? 24;
  return height > 0 ? width / height : 1;
}

export function textTransformOrigin(horizontalAlign: EditorObject['horizontalAlign']) {
  if (horizontalAlign === 'center') return 'center center';
  if (horizontalAlign === 'right') return 'right center';
  return 'left center';
}
