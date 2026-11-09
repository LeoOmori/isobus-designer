import type { EditorObject } from '../../types';
import { ByteWriter } from '../byteWriter';
import { asPictureGraphicFormat, pictureGraphicPaletteIndexAt, VT_PALETTE_RGB } from '../../vtPalette';

/**
 * Encode a Picture Graphic's packed rawData as an 8-bit BMP whose colour table is the VT palette.
 * vt2iso sees the ISO palette and takes the indices as-is: no colour matching, and no
 * 24-bit RGB/BGR channel-order issues (ISOAgLib's bundled FreeImage.h assumes RGB on macOS).
 */
export function pictureGraphicToBmp(obj: EditorObject): Uint8Array<ArrayBuffer> {
  const width = obj.actualWidth ?? obj.width;
  const height = obj.actualHeight ?? obj.height;
  const format = asPictureGraphicFormat(obj.graphicFormat);
  const rawData = obj.rawData ?? [];
  const rowSize = Math.ceil(width / 4) * 4;
  const imageSize = rowSize * height;
  const dataOffset = 54 + 256 * 4;

  const w = new ByteWriter();
  w.raw([0x42, 0x4d]); // "BM"
  w.u32(dataOffset + imageSize);
  w.u32(0);
  w.u32(dataOffset);
  w.u32(40); // BITMAPINFOHEADER
  w.i32(width);
  w.i32(height); // positive = bottom-up rows
  w.u16(1);
  w.u16(8);
  w.u32(0); // BI_RGB
  w.u32(imageSize);
  w.i32(2835); // 72 dpi
  w.i32(2835);
  w.u32(256);
  w.u32(0);
  for (let i = 0; i < 256; i += 1) {
    const c = VT_PALETTE_RGB[i] ?? VT_PALETTE_RGB[0];
    w.raw([c.b, c.g, c.r, 0]);
  }

  for (let y = height - 1; y >= 0; y -= 1) {
    for (let x = 0; x < width; x += 1) w.u8(pictureGraphicPaletteIndexAt(rawData, width, format, x, y));
    for (let pad = width; pad < rowSize; pad += 1) w.u8(0);
  }
  return w.result();
}
