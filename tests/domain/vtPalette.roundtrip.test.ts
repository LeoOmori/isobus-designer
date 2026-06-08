import { beforeAll, describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  asPictureGraphicFormat,
  packPictureGraphicImageData,
  unpackPictureGraphicRawData,
  type PictureGraphicFormat,
} from '../../src/domain/vtPalette';

class TestImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;

  constructor(data: Uint8ClampedArray, width: number, height: number) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
}

describe('picture graphic pack/unpack round-trip', () => {
  beforeAll(() => {
    globalThis.ImageData = TestImageData as unknown as typeof ImageData;
  });

  it('repacking unpacked pixels is stable for small images', () => {
    fc.assert(fc.property(
      fc.constantFrom<PictureGraphicFormat>(0, 1, 2),
      fc.array(fc.integer({ min: 0, max: 255 }), { minLength: 4 * 4 * 4, maxLength: 4 * 4 * 4 }),
      (format, bytes) => {
        const image = new ImageData(new Uint8ClampedArray(bytes), 4, 4);
        const packed = packPictureGraphicImageData(image, asPictureGraphicFormat(format));
        const unpacked = unpackPictureGraphicRawData(Array.from(packed), 4, 4, asPictureGraphicFormat(format));

        expect(unpacked).not.toBeNull();
        const repacked = packPictureGraphicImageData(unpacked!, asPictureGraphicFormat(format));
        expect(Array.from(repacked)).toEqual(Array.from(packed));
      },
    ), { numRuns: 40 });
  });
});
