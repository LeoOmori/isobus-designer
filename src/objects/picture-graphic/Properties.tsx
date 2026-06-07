import { useEffect, useRef } from 'react';
import { Upload } from 'lucide-react';
import type { EditorObject } from '../../domain/types';
import {
  PICTURE_GRAPHIC_FORMAT_OPTIONS,
  PICTURE_GRAPHIC_OPTION_FLASHING,
  PICTURE_GRAPHIC_OPTION_RLE,
  PICTURE_GRAPHIC_OPTION_TRANSPARENT,
  asPictureGraphicFormat,
  clearUnsupportedPictureGraphicOptions,
  derivedPictureGraphicHeight,
  expectedPictureGraphicRawDataLength,
  pictureFormatMaxIndex,
  pictureGraphicToDataUrl,
  quantizePictureGraphicSource,
} from '../../domain/vtPalette';
import { CheckboxField, Field, PropertySection, SelectField, VtColorField } from '../../properties/fields';

export function PictureGraphicProperties({ object, objects, onPatch }: { object: EditorObject; objects: EditorObject[]; onPatch: (changes: Partial<EditorObject>) => void }) {
  const previewUrl = pictureGraphicToDataUrl(object);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const parent = object.parentId ? objects.find((candidate) => candidate.id === object.parentId) : undefined;
  const isKeyIcon = parent?.kind === 'key';

  const format = asPictureGraphicFormat(object.graphicFormat);
  const options = clearUnsupportedPictureGraphicOptions(object.graphicOptions ?? 0);
  const transparent = (options & PICTURE_GRAPHIC_OPTION_TRANSPARENT) !== 0;
  const flashing = (options & PICTURE_GRAPHIC_OPTION_FLASHING) !== 0;
  const rle = (options & PICTURE_GRAPHIC_OPTION_RLE) !== 0;
  const targetWidth = object.targetWidth ?? object.width ?? object.actualWidth ?? (isKeyIcon ? 48 : 64);
  const actualWidth = object.actualWidth ?? object.width ?? (isKeyIcon ? 48 : 64);
  const actualHeight = object.actualHeight ?? object.height ?? (isKeyIcon ? 48 : 64);
  const targetHeight = derivedPictureGraphicHeight(targetWidth, actualWidth, actualHeight);
  const expectedRawDataLength = expectedPictureGraphicRawDataLength(isKeyIcon ? 48 : actualWidth, isKeyIcon ? 48 : actualHeight, format);

  function patchTargetWidth(nextTargetWidth: number) {
    const width = Math.max(1, Math.round(nextTargetWidth));
    onPatch({ targetWidth: width, width, height: derivedPictureGraphicHeight(width, actualWidth, actualHeight) });
  }

  function patchOption(bit: number, enabled: boolean) {
    const nextOptions = enabled ? options | bit : options & ~bit;
    onPatch({ graphicOptions: nextOptions });
    if (bit === PICTURE_GRAPHIC_OPTION_TRANSPARENT && object.sourceImageDataUrl) {
      void requantizeFromSource(format, nextOptions, object.transparencyColor ?? 0);
    }
  }

  async function requantizeFromSource(nextFormat = format, nextOptions = options, nextTransparencyColor = object.transparencyColor ?? 0) {
    if (!object.sourceImageDataUrl) {
      onPatch({ graphicFormat: nextFormat, graphicOptions: nextOptions, transparencyColor: nextTransparencyColor, rawData: [] });
      return;
    }

    const quantized = await quantizePictureGraphicSource(object.sourceImageDataUrl, nextFormat, nextOptions, nextTransparencyColor, isKeyIcon ? 48 : undefined, isKeyIcon ? 48 : undefined);
    const nextTargetWidth = isKeyIcon ? 48 : object.targetWidth ?? object.width ?? quantized.actualWidth;
    onPatch({
      ...quantized,
      graphicFormat: nextFormat,
      graphicOptions: nextOptions,
      transparencyColor: nextTransparencyColor,
      targetWidth: nextTargetWidth,
      width: nextTargetWidth,
      height: derivedPictureGraphicHeight(nextTargetWidth, quantized.actualWidth, quantized.actualHeight),
      x: isKeyIcon ? 6 : object.x,
      y: isKeyIcon ? 6 : object.y,
    });
  }

  useEffect(() => {
    if (!object.sourceImageDataUrl) return;
    if (object.rawData?.length === expectedRawDataLength && (!isKeyIcon || (
      object.actualWidth === 48 && object.actualHeight === 48 && object.targetWidth === 48 && object.x === 6 && object.y === 6
    ))) return;
    void quantizePictureGraphicSource(object.sourceImageDataUrl, format, options, object.transparencyColor ?? 0, isKeyIcon ? 48 : undefined, isKeyIcon ? 48 : undefined).then((quantized) => {
      const nextTargetWidth = isKeyIcon ? 48 : object.targetWidth ?? object.width ?? quantized.actualWidth;
      onPatch({
        ...quantized,
        graphicFormat: format,
        graphicOptions: options,
        targetWidth: nextTargetWidth,
        width: nextTargetWidth,
        height: derivedPictureGraphicHeight(nextTargetWidth, quantized.actualWidth, quantized.actualHeight),
        x: isKeyIcon ? 6 : object.x,
        y: isKeyIcon ? 6 : object.y,
      });
    });
  }, [object.sourceImageDataUrl, object.rawData?.length, object.transparencyColor, object.targetWidth, object.width, object.actualWidth, object.actualHeight, object.x, object.y, isKeyIcon, expectedRawDataLength, format, options, onPatch]);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const sourceImageDataUrl = await readFileAsDataUrl(file);
      const quantized = await quantizePictureGraphicSource(sourceImageDataUrl, format, options, object.transparencyColor ?? 0, isKeyIcon ? 48 : undefined, isKeyIcon ? 48 : undefined);
      const nextTargetWidth = isKeyIcon ? 48 : object.targetWidth ?? object.width ?? quantized.actualWidth;
      onPatch({
        ...quantized,
        targetWidth: nextTargetWidth,
        width: nextTargetWidth,
        height: derivedPictureGraphicHeight(nextTargetWidth, quantized.actualWidth, quantized.actualHeight),
        x: isKeyIcon ? 6 : object.x,
        y: isKeyIcon ? 6 : object.y,
        sourceImagePath: file.name,
        sourceImageDataUrl,
      });
    } finally {
      event.target.value = '';
    }
  }

  return (
    <PropertySection title="Picture Graphic">
      <Field label="Target Width" value={targetWidth} type="number" onChange={(value) => patchTargetWidth(Number(value))} />
      <Field label="Derived Height" value={targetHeight} disabled onChange={() => undefined} />
      <div className="field-row">
        <Field label="Actual W" value={actualWidth} disabled onChange={() => undefined} />
        <Field label="Actual H" value={actualHeight} disabled onChange={() => undefined} />
      </div>
      <SelectField label="Format" value={String(format)} options={PICTURE_GRAPHIC_FORMAT_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }))} onChange={(value) => void requantizeFromSource(asPictureGraphicFormat(Number(value)))} />
      <CheckboxField label="Transparent" checked={transparent} onChange={(checked) => patchOption(PICTURE_GRAPHIC_OPTION_TRANSPARENT, checked)} />
      <CheckboxField label="Flashing" checked={flashing} onChange={(checked) => patchOption(PICTURE_GRAPHIC_OPTION_FLASHING, checked)} />
      <CheckboxField label="RLE compressed (V1 unavailable)" checked={rle} disabled onChange={() => undefined} />
      <VtColorField label="Transparency Color" value={Math.min(pictureFormatMaxIndex(format), object.transparencyColor ?? 0)} onChange={(value) => void requantizeFromSource(format, options, Math.min(pictureFormatMaxIndex(format), value))} />

      <label className="field">
        <span>Image</span>
        <div className="field-input">
          <button type="button" className="pic-upload-button" onClick={() => fileInputRef.current?.click()} title="Upload image — will be converted to ISO VT palette-indexed bitmap bytes">
            <Upload size={14} />
            <span>{object.sourceImagePath ? 'Replace' : 'Upload'} Image</span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml" style={{ display: 'none' }} onChange={handleFileSelected} />
        </div>
      </label>

      {object.sourceImagePath && <Field label="Source" value={object.sourceImagePath} disabled onChange={() => undefined} />}

      <div className="pic-preview-wrap">
        {previewUrl ? <img src={previewUrl} alt={object.name} className="pic-preview-img" /> : <div className="pic-preview-empty">No image uploaded</div>}
        {previewUrl && <div className="pic-preview-size">{actualWidth} × {actualHeight} px source → {targetWidth} × {targetHeight} px target</div>}
      </div>
    </PropertySection>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
