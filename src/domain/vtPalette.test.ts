import { describe, expect, it } from 'vitest';
import { VT_PALETTE_HEX, asPictureGraphicFormat, clampPaletteIndex, expectedPictureGraphicRawDataLength, pictureFormatMaxIndex } from './vtPalette';

describe('vtPalette helpers', () => {
  it('exposes the expected palette and format bounds', () => {
    expect(VT_PALETTE_HEX[0]).toBe('#000000');
    expect(VT_PALETTE_HEX[1]).toBe('#FFFFFF');
    expect(VT_PALETTE_HEX).toHaveLength(256);
  });

  it('clamps and derives picture graphic values', () => {
    expect(clampPaletteIndex(-2)).toBe(0);
    expect(clampPaletteIndex(257)).toBe(255);
    expect(pictureFormatMaxIndex(0)).toBe(1);
    expect(pictureFormatMaxIndex(1)).toBe(15);
    expect(pictureFormatMaxIndex(2)).toBe(255);
    expect(asPictureGraphicFormat(undefined)).toBe(2);
    expect(expectedPictureGraphicRawDataLength(9, 2, 0)).toBe(4);
    expect(expectedPictureGraphicRawDataLength(3, 2, 1)).toBe(4);
    expect(expectedPictureGraphicRawDataLength(3, 2, 2)).toBe(6);
  });
});
