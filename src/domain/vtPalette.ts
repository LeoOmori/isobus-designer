import type { EditorObject } from './types';

export type PictureGraphicFormat = 0 | 1 | 2;

export const PICTURE_GRAPHIC_FORMAT_OPTIONS: { value: PictureGraphicFormat; label: string }[] = [
  { value: 0, label: 'Monochrome (1-bit)' },
  { value: 1, label: '4-bit color' },
  { value: 2, label: '8-bit color (recommended)' },
];

export const PICTURE_GRAPHIC_OPTION_TRANSPARENT = 1 << 0;
export const PICTURE_GRAPHIC_OPTION_FLASHING = 1 << 1;
export const PICTURE_GRAPHIC_OPTION_RLE = 1 << 2;

export type Rgb = { r: number; g: number; b: number };

export const VT_PALETTE_HEX = [
  '#000000', '#FFFFFF', '#009900', '#009999', '#990000', '#990099', '#999900', '#CCCCCC',
  '#999999', '#0000FF', '#00FF00', '#00FFFF', '#FF0000', '#FF00FF', '#FFFF00', '#000099',
  '#000000', '#000033', '#000066', '#000099', '#0000CC', '#0000FF', '#003300', '#003333',
  '#003366', '#003399', '#0033CC', '#0033FF', '#006600', '#006633', '#006666', '#006699',
  '#0066CC', '#0066FF', '#009900', '#009933', '#009966', '#009999', '#0099CC', '#0099FF',
  '#00CC00', '#00CC33', '#00CC66', '#00CC99', '#00CCCC', '#00CCFF', '#00FF00', '#00FF33',
  '#00FF66', '#00FF99', '#00FFCC', '#00FFFF', '#330000', '#330033', '#330066', '#330099',
  '#3300CC', '#3300FF', '#333300', '#333333', '#333366', '#333399', '#3333CC', '#3333FF',
  '#336600', '#336633', '#336666', '#336699', '#3366CC', '#3366FF', '#339900', '#339933',
  '#339966', '#339999', '#3399CC', '#3399FF', '#33CC00', '#33CC33', '#33CC66', '#33CC99',
  '#33CCCC', '#33CCFF', '#33FF00', '#33FF33', '#33FF66', '#33FF99', '#33FFCC', '#33FFFF',
  '#660000', '#660033', '#660066', '#660099', '#6600CC', '#6600FF', '#663300', '#663333',
  '#663366', '#663399', '#6633CC', '#6633FF', '#666600', '#666633', '#666666', '#666699',
  '#6666CC', '#6666FF', '#669900', '#669933', '#669966', '#669999', '#6699CC', '#6699FF',
  '#66CC00', '#66CC33', '#66CC66', '#66CC99', '#66CCCC', '#66CCFF', '#66FF00', '#66FF33',
  '#66FF66', '#66FF99', '#66FFCC', '#66FFFF', '#990000', '#990033', '#990066', '#990099',
  '#9900CC', '#9900FF', '#993300', '#993333', '#993366', '#993399', '#9933CC', '#9933FF',
  '#996600', '#996633', '#996666', '#996699', '#9966CC', '#9966FF', '#999900', '#999933',
  '#999966', '#999999', '#9999CC', '#9999FF', '#99CC00', '#99CC33', '#99CC66', '#99CC99',
  '#99CCCC', '#99CCFF', '#99FF00', '#99FF33', '#99FF66', '#99FF99', '#99FFCC', '#99FFFF',
  '#CC0000', '#CC0033', '#CC0066', '#CC0099', '#CC00CC', '#CC00FF', '#CC3300', '#CC3333',
  '#CC3366', '#CC3399', '#CC33CC', '#CC33FF', '#CC6600', '#CC6633', '#CC6666', '#CC6699',
  '#CC66CC', '#CC66FF', '#CC9900', '#CC9933', '#CC9966', '#CC9999', '#CC99CC', '#CC99FF',
  '#CCCC00', '#CCCC33', '#CCCC66', '#CCCC99', '#CCCCCC', '#CCCCFF', '#CCFF00', '#CCFF33',
  '#CCFF66', '#CCFF99', '#CCFFCC', '#CCFFFF', '#FF0000', '#FF0033', '#FF0066', '#FF0099',
  '#FF00CC', '#FF00FF', '#FF3300', '#FF3333', '#FF3366', '#FF3399', '#FF33CC', '#FF33FF',
  '#FF6600', '#FF6633', '#FF6666', '#FF6699', '#FF66CC', '#FF66FF', '#FF9900', '#FF9933',
  '#FF9966', '#FF9999', '#FF99CC', '#FF99FF', '#FFCC00', '#FFCC33', '#FFCC66', '#FFCC99',
  '#FFCCCC', '#FFCCFF', '#FFFF00', '#FFFF33', '#FFFF66', '#FFFF99', '#FFFFCC', '#FFFFFF',
  '#808080', '#808080', '#808080', '#808080', '#808080', '#808080', '#808080', '#808080',
  '#808080', '#808080', '#808080', '#808080', '#808080', '#808080', '#808080', '#808080',
  '#808080', '#808080', '#808080', '#808080', '#808080', '#808080', '#808080', '#808080',
] as const;

export const VT_PALETTE_RGB: Rgb[] = VT_PALETTE_HEX.map((hex) => ({
  r: Number.parseInt(hex.slice(1, 3), 16),
  g: Number.parseInt(hex.slice(3, 5), 16),
  b: Number.parseInt(hex.slice(5, 7), 16),
}));

export function clampPaletteIndex(index: number) {
  return Math.min(255, Math.max(0, Math.round(index) || 0));
}

export function pictureFormatMaxIndex(format: PictureGraphicFormat) {
  if (format === 0) return 1;
  if (format === 1) return 15;
  return 255;
}

export function asPictureGraphicFormat(value: number | undefined): PictureGraphicFormat {
  return value === 0 || value === 1 || value === 2 ? value : 2;
}

export function expectedPictureGraphicRawDataLength(width: number, height: number, format: PictureGraphicFormat) {
  if (width <= 0 || height <= 0) return 0;
  if (format === 0) return Math.ceil(width / 8) * height;
  if (format === 1) return Math.ceil(width / 2) * height;
  return width * height;
}

export function derivedPictureGraphicHeight(targetWidth: number, actualWidth: number, actualHeight: number) {
  if (targetWidth <= 0 || actualWidth <= 0 || actualHeight <= 0) return Math.max(1, Math.round(targetWidth));
  return Math.max(1, Math.round(targetWidth * (actualHeight / actualWidth)));
}

export function clearUnsupportedPictureGraphicOptions(options = 0) {
  return options & ~PICTURE_GRAPHIC_OPTION_RLE;
}

export function nearestVtPaletteIndex(r: number, g: number, b: number, format: PictureGraphicFormat, excludedIndex?: number) {
  const maxIndex = pictureFormatMaxIndex(format);
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index <= maxIndex; index += 1) {
    if (index === excludedIndex) continue;
    const color = VT_PALETTE_RGB[index];
    const distance = (r - color.r) ** 2 + (g - color.g) ** 2 + (b - color.b) ** 2;
    if (distance < bestDistance) {
      bestIndex = index;
      bestDistance = distance;
    }
  }

  return bestIndex;
}

export function packPictureGraphicImageData(
  imageData: ImageData,
  format: PictureGraphicFormat,
  options = 0,
  transparencyColor = 0,
) {
  const { width, height, data } = imageData;
  const sanitizedOptions = clearUnsupportedPictureGraphicOptions(options);
  const transparent = (sanitizedOptions & PICTURE_GRAPHIC_OPTION_TRANSPARENT) !== 0;
  const transparentIndex = Math.min(pictureFormatMaxIndex(format), clampPaletteIndex(transparencyColor));
  const rowBytes = format === 0 ? Math.ceil(width / 8) : format === 1 ? Math.ceil(width / 2) : width;
  const packed = new Uint8Array(rowBytes * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const source = (y * width + x) * 4;
      const paletteIndex = transparent && data[source + 3] < 128
        ? transparentIndex
        : nearestVtPaletteIndex(data[source], data[source + 1], data[source + 2], format, transparent ? transparentIndex : undefined);
      const target = y * rowBytes;

      if (format === 0) {
        if ((paletteIndex & 1) !== 0) packed[target + Math.floor(x / 8)] |= 0x80 >> (x % 8);
      } else if (format === 1) {
        const byteIndex = target + Math.floor(x / 2);
        if (x % 2 === 0) packed[byteIndex] |= (paletteIndex & 0x0f) << 4;
        else packed[byteIndex] |= paletteIndex & 0x0f;
      } else {
        packed[target + x] = paletteIndex & 0xff;
      }
    }
  }

  return packed;
}

export function unpackPictureGraphicRawData(
  rawData: number[] | undefined,
  width: number,
  height: number,
  format: PictureGraphicFormat,
  options = 0,
  transparencyColor = 0,
) {
  if (!rawData?.length || width <= 0 || height <= 0) return null;

  const expectedLength = expectedPictureGraphicRawDataLength(width, height, format);
  if (rawData.length < expectedLength) return null;

  const sanitizedOptions = clearUnsupportedPictureGraphicOptions(options);
  const transparent = (sanitizedOptions & PICTURE_GRAPHIC_OPTION_TRANSPARENT) !== 0;
  const transparentIndex = Math.min(pictureFormatMaxIndex(format), clampPaletteIndex(transparencyColor));
  const rowBytes = format === 0 ? Math.ceil(width / 8) : format === 1 ? Math.ceil(width / 2) : width;
  const pixels = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const rowStart = y * rowBytes;
      let paletteIndex = 0;

      if (format === 0) {
        paletteIndex = (rawData[rowStart + Math.floor(x / 8)] & (0x80 >> (x % 8))) !== 0 ? 1 : 0;
      } else if (format === 1) {
        const byte = rawData[rowStart + Math.floor(x / 2)];
        paletteIndex = x % 2 === 0 ? (byte >> 4) & 0x0f : byte & 0x0f;
      } else {
        paletteIndex = rawData[rowStart + x] & 0xff;
      }

      const color = VT_PALETTE_RGB[paletteIndex] ?? VT_PALETTE_RGB[0];
      const target = (y * width + x) * 4;
      pixels[target] = color.r;
      pixels[target + 1] = color.g;
      pixels[target + 2] = color.b;
      pixels[target + 3] = transparent && paletteIndex === transparentIndex ? 0 : 255;
    }
  }

  return new ImageData(pixels, width, height);
}

const pictureGraphicUrlCache = new WeakMap<number[], Map<string, string>>();

export function pictureGraphicToDataUrl(object: Pick<EditorObject, 'rawData' | 'actualWidth' | 'actualHeight' | 'graphicFormat' | 'graphicOptions' | 'transparencyColor'>) {
  const rawData = object.rawData;
  const width = object.actualWidth ?? 0;
  const height = object.actualHeight ?? 0;
  if (!rawData?.length || width <= 0 || height <= 0) return null;

  const format = asPictureGraphicFormat(object.graphicFormat);
  const options = clearUnsupportedPictureGraphicOptions(object.graphicOptions ?? 0);
  const transparencyColor = object.transparencyColor ?? 0;
  const key = `${width}x${height}:${format}:${options}:${transparencyColor}`;
  const cached = pictureGraphicUrlCache.get(rawData)?.get(key);
  if (cached) return cached;

  const imageData = unpackPictureGraphicRawData(rawData, width, height, format, options, transparencyColor);
  if (!imageData) return null;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')?.putImageData(imageData, 0, 0);
  const url = canvas.toDataURL('image/png');

  const objectCache = pictureGraphicUrlCache.get(rawData) ?? new Map<string, string>();
  objectCache.set(key, url);
  pictureGraphicUrlCache.set(rawData, objectCache);
  return url;
}

export async function quantizePictureGraphicSource(
  source: string,
  format: PictureGraphicFormat,
  options: number,
  transparencyColor: number,
  resizeWidth?: number,
  resizeHeight?: number,
) {
  const img = await loadImage(source);
  const actualWidth = resizeWidth ?? (img.naturalWidth || img.width);
  const actualHeight = resizeHeight ?? (img.naturalHeight || img.height);
  const canvas = document.createElement('canvas');
  canvas.width = actualWidth;
  canvas.height = actualHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Could not read image pixels');
  context.clearRect(0, 0, actualWidth, actualHeight);
  context.drawImage(img, 0, 0, actualWidth, actualHeight);
  const imageData = context.getImageData(0, 0, actualWidth, actualHeight);
  const rawData = Array.from(packPictureGraphicImageData(imageData, format, clearUnsupportedPictureGraphicOptions(options), transparencyColor));
  return { actualWidth, actualHeight, rawData };
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = src;
  });
}
