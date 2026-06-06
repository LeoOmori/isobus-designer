import { useEffect, useRef } from 'react';
import { Archive, Trash2, Upload } from 'lucide-react';
import {
  OUTPUT_STRING_OPTION_AUTO_WRAP,
  OUTPUT_STRING_OPTION_TRANSPARENT,
  OUTPUT_STRING_OPTION_WRAP_ON_HYPHEN,
  VT_FILL_TYPE_OPTIONS,
  VT_H_JUSTIFY_OPTIONS,
  VT_NUMBER_FORMAT_OPTIONS,
  VT_V_JUSTIFY_OPTIONS,
  asHorizontalJustification,
  asVerticalJustification,
  fontCellValue,
  vtFontCells,
} from '../domain/isobus';
import { objectKindName } from '../domain/objectMeta';
import type { EditorObject, ReferenceKind, WorkingSet } from '../domain/types';
import {
  PICTURE_GRAPHIC_FORMAT_OPTIONS,
  PICTURE_GRAPHIC_OPTION_FLASHING,
  PICTURE_GRAPHIC_OPTION_RLE,
  PICTURE_GRAPHIC_OPTION_TRANSPARENT,
  asPictureGraphicFormat,
  clearUnsupportedPictureGraphicOptions,
  derivedPictureGraphicHeight,
  expectedPictureGraphicRawDataLength,
  pictureGraphicToDataUrl,
  pictureFormatMaxIndex,
  quantizePictureGraphicSource,
} from '../domain/vtPalette';
import { Panel } from '../ui/primitives';
import { CheckboxField, Field, FontStyleField, PropertySection, SelectField, VtColorField } from './fields';

// ── Helpers ───────────────────────────────────────────────────────────────

function referenceOptions(objects: EditorObject[], kind: EditorObject['kind'], createLabel: string, createValue: string) {
  return [
    { value: '', label: 'None' },
    ...objects.filter((o) => o.kind === kind).map((o) => ({ value: o.id, label: `${o.id} — ${o.name}` })),
    { value: createValue, label: createLabel },
  ];
}

function variableReferenceOptions(objects: EditorObject[]) {
  return [
    { value: '__null', label: 'NULL — use local text' },
    ...objects.filter((o) => o.kind === 'string-variable').map((o) => ({ value: o.id, label: `${o.id} — ${o.name}` })),
    { value: '__create_string-variable', label: '+ Create String Variable' },
  ];
}

function patchBit(current: number | undefined, bit: number, enabled: boolean) {
  return enabled ? (current ?? 0) | bit : (current ?? 0) & ~bit;
}

const REFERENCE_ONLY = new Set<EditorObject['kind']>([
  'line-attribute', 'fill-attribute', 'font-attribute', 'string-variable', 'number-variable',
]);

const NO_LAYOUT = new Set<EditorObject['kind']>([
  'line-attribute', 'fill-attribute', 'font-attribute', 'string-variable', 'number-variable',
  'soft-key-mask', 'key',
]);

// ── Working Set ───────────────────────────────────────────────────────────

export function WorkingSetProperties({ workingSet, masks, onPatch }: {
  workingSet: WorkingSet;
  masks: EditorObject[];
  onPatch: (changes: Partial<WorkingSet>) => void;
}) {
  const maskOptions = [{ value: '', label: 'None' }, ...masks.map((m) => ({ value: m.id, label: `${m.id} — ${m.name}` }))];
  return (
    <Panel title="Object Parameter Editor">
      <div className="properties-title">
        <strong>Working Set: {workingSet.id}</strong>
        <span><Archive size={16} /></span>
      </div>
      <PropertySection title="General">
        <Field label="Object ID"  value={workingSet.objectId}  disabled onChange={() => undefined} />
        <Field label="Name"       value={workingSet.name}       onChange={(name)       => onPatch({ name })} />
        <Field label="Version"    value={workingSet.version}    onChange={(version)    => onPatch({ version })} />
        <Field label="Language"   value={workingSet.language}   onChange={(language)   => onPatch({ language })} />
        <Field label="Description" value={workingSet.description ?? ''} onChange={(description) => onPatch({ description })} />
        <SelectField label="Active Data Mask" value={workingSet.activeDataMaskId} options={maskOptions} onChange={(activeDataMaskId) => onPatch({ activeDataMaskId })} />
        <Field label="Active Soft Key Mask" value={workingSet.activeSoftKeyMaskId} onChange={(activeSoftKeyMaskId) => onPatch({ activeSoftKeyMaskId })} />
        <Field label="Background" value={workingSet.backgroundColor} type="color" onChange={(backgroundColor) => onPatch({ backgroundColor })} />
        <CheckboxField label="Selectable" checked={workingSet.selectable ?? true} onChange={(selectable) => onPatch({ selectable })} />
      </PropertySection>
      <PropertySection title="Children" defaultOpen={false} />
    </Panel>
  );
}

// ── Main PropertiesPanel ──────────────────────────────────────────────────

export function PropertiesPanel({ selectedObject, masks, softKeyMasks, objects, onPatch, onDelete, onLayer, onCreateAttributeReference }: {
  selectedObject: EditorObject;
  masks: EditorObject[];
  softKeyMasks: EditorObject[];
  objects: EditorObject[];
  onPatch: (changes: Partial<EditorObject>) => void;
  onDelete: () => void;
  onLayer: (action: 'front' | 'back' | 'forward' | 'backward') => void;
  onCreateAttributeReference: (kind: ReferenceKind) => void;
}) {
  const kind       = selectedObject.kind;
  const isRefOnly  = REFERENCE_ONLY.has(kind);
  const isNoLayout = NO_LAYOUT.has(kind);

  const maskOptions    = [{ value: '', label: 'None' }, ...masks.filter((m) => m.id !== selectedObject.id).map((m) => ({ value: m.id, label: `${m.id} — ${m.name}` }))];
  const skmOptions     = [{ value: '', label: 'None' }, ...softKeyMasks.map((s) => ({ value: s.id, label: `${s.id} — ${s.name}` }))];

  const lineAttrOpts   = referenceOptions(objects, 'line-attribute',   '+ Create Line Attribute',   '__create_line-attribute');
  const fillAttrOpts   = referenceOptions(objects, 'fill-attribute',   '+ Create Fill Attribute',   '__create_fill-attribute');
  const fontAttrOpts   = referenceOptions(objects, 'font-attribute',   '+ Create Font Attribute',   '__create_font-attribute');
  const numVarOpts     = referenceOptions(objects, 'number-variable',  '+ Create Number Variable',  '__create_number-variable');
  const outputStringVariableOpts = variableReferenceOptions(objects);

  function handleRefSelect(value: string, createPrefix: string, refKind: ReferenceKind, patchFn: (id: string) => Partial<EditorObject>) {
    if (value.startsWith('__create_')) return onCreateAttributeReference(refKind);
    onPatch(patchFn(value));
  }

  return (
    <Panel title="Object Parameter Editor">
      {/* Header */}
      <div className="properties-title">
        <strong>{objectKindName(kind)}: {selectedObject.id}</strong>
        <span>
          <button type="button" onClick={() => onLayer('forward')}>↑</button>
          <button type="button" onClick={() => onLayer('backward')}>↓</button>
          <button type="button" onClick={onDelete}><Trash2 size={16} /></button>
        </span>
      </div>

      {/* ── General ──────────────────────────────────────────────────── */}
      <PropertySection title="General">
        <Field label="Object ID" value={selectedObject.objectId} disabled onChange={() => undefined} />
        <Field label="Name"      value={selectedObject.name}     onChange={(name) => onPatch({ name })} />
        <Field label="Notes"     value={selectedObject.notes ?? ''} onChange={(notes) => onPatch({ notes })} />
        {!isNoLayout && kind !== 'picture-graphic' && (
          <div className="field-row">
            <Field label="Width"  value={selectedObject.width}  type="number" onChange={(w) => onPatch({ width: Number(w) })} />
            <Field label="Height" value={selectedObject.height} type="number" onChange={(h) => onPatch({ height: Number(h) })} />
          </div>
        )}
        {kind === 'data-mask' && (
          <Field label="Background" value={selectedObject.backgroundColor} type="color" onChange={(backgroundColor) => onPatch({ backgroundColor })} />
        )}
      </PropertySection>

      {/* ── Layout ──────────────────────────────────────────────────── */}
      {!isNoLayout && (
        <PropertySection title="Layout">
          <div className="field-row">
            <Field label="X" value={selectedObject.x} type="number" onChange={(x) => onPatch({ x: Number(x) })} />
            <Field label="Y" value={selectedObject.y} type="number" onChange={(y) => onPatch({ y: Number(y) })} />
          </div>
          <CheckboxField label="Visible" checked={selectedObject.visible} onChange={(visible) => onPatch({ visible })} />
          {(kind === 'data-mask' || kind === 'soft-key-mask') && (
            <CheckboxField label="Locked" checked={selectedObject.locked ?? false} onChange={(locked) => onPatch({ locked })} />
          )}
          {kind === 'output-rectangle' && (
            <CheckboxField label="Hidden" checked={selectedObject.hidden ?? false} onChange={(hidden) => onPatch({ hidden, visible: !hidden })} />
          )}
        </PropertySection>
      )}

      {/* ── Data Mask ────────────────────────────────────────────────── */}
      {kind === 'data-mask' && (
        <PropertySection title="Navigation">
          <SelectField label="Soft Key Mask"  value={selectedObject.softKeyMaskId ?? ''} options={skmOptions}  onChange={(id) => onPatch({ softKeyMaskId: id })} />
          <SelectField label="Next Mask"      value={selectedObject.nextMaskId ?? ''}     options={maskOptions} onChange={(id) => onPatch({ nextMaskId: id })} />
          <SelectField label="Previous Mask"  value={selectedObject.previousMaskId ?? ''} options={maskOptions} onChange={(id) => onPatch({ previousMaskId: id })} />
        </PropertySection>
      )}

      {/* ── Soft Key Mask ─────────────────────────────────────────────── */}
      {kind === 'soft-key-mask' && (
        <PropertySection title="Soft Key Mask">
          <SelectField label="Layout Preview" value={selectedObject.layoutPreview ?? 'vertical'} options={[{ value: 'vertical', label: 'Vertical' }, { value: 'horizontal', label: 'Horizontal' }]} onChange={(layoutPreview) => onPatch({ layoutPreview: layoutPreview as 'vertical' | 'horizontal' })} />
          <Field label="Key Count Preview" value={selectedObject.softKeyCountPreview ?? 6} type="number" onChange={(v) => onPatch({ softKeyCountPreview: Number(v) })} />
        </PropertySection>
      )}

      {/* ── Key ──────────────────────────────────────────────────────── */}
      {kind === 'key' && (
        <PropertySection title="Key">
          <Field label="Label"      value={selectedObject.label ?? ''}      onChange={(label) => onPatch({ label })} />
          <Field label="Key Code"   value={selectedObject.keyCode ?? 0}     type="number" onChange={(v) => onPatch({ keyCode: Number(v) })} />
          <Field label="Action"     value={selectedObject.actionName ?? ''}  onChange={(actionName) => onPatch({ actionName })} />
        </PropertySection>
      )}

      {/* ── Button ───────────────────────────────────────────────────── */}
      {kind === 'button' && (
        <PropertySection title="Button">
          <Field label="Label"    value={selectedObject.label ?? ''} onChange={(label) => onPatch({ label })} />
          <Field label="Key Code" value={selectedObject.keyCode ?? 0} type="number" onChange={(v) => onPatch({ keyCode: Number(v) })} />
          <Field label="Background" value={selectedObject.backgroundColor} type="color" onChange={(backgroundColor) => onPatch({ backgroundColor })} />
          <CheckboxField label="Show Border"  checked={((selectedObject.buttonOptions ?? 1) & 1) !== 0}  onChange={(v) => onPatch({ buttonOptions: v ? (selectedObject.buttonOptions ?? 0) | 1 : (selectedObject.buttonOptions ?? 1) & ~1 })} />
          <CheckboxField label="Enabled"      checked={selectedObject.enabled ?? true}                   onChange={(enabled) => onPatch({ enabled })} />
          <Field label="On Press Action"    value={selectedObject.onPressAction ?? ''}   onChange={(v) => onPatch({ onPressAction: v })} />
          <Field label="On Release Action"  value={selectedObject.onReleaseAction ?? ''} onChange={(v) => onPatch({ onReleaseAction: v })} />
        </PropertySection>
      )}

      {/* ── Output String ─────────────────────────────────────────────── */}
      {kind === 'output-string' && (
        <>
          <PropertySection title="Text">
            <Field label="Value" value={selectedObject.text ?? ''} onChange={(text) => onPatch({ text })} />
            <Field label="Length (bytes)" value={selectedObject.length ?? 32} type="number" onChange={(length) => onPatch({ length: Number(length) })} />
            <div className="field-hint">{utf8ByteLength(selectedObject.text ?? '')} / {selectedObject.length ?? 32} bytes before padding</div>
            <VtColorField label="Background" value={selectedObject.backgroundColorIndex ?? 1} onChange={(backgroundColorIndex) => onPatch({ backgroundColorIndex })} />
            <SelectField label="Horizontal" value={String(selectedObject.horizontalJustification ?? 0)} options={VT_H_JUSTIFY_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }))} onChange={(v) => onPatch({ horizontalJustification: asHorizontalJustification(Number(v)) })} />
            <SelectField label="Vertical" value={String(selectedObject.verticalJustification ?? 0)} options={VT_V_JUSTIFY_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }))} onChange={(v) => onPatch({ verticalJustification: asVerticalJustification(Number(v)) })} />
          </PropertySection>
          <PropertySection title="Options">
            <CheckboxField label="Transparent Background" checked={((selectedObject.outputOptions ?? 0) & OUTPUT_STRING_OPTION_TRANSPARENT) !== 0} onChange={(v) => onPatch({ outputOptions: patchBit(selectedObject.outputOptions, OUTPUT_STRING_OPTION_TRANSPARENT, v) })} />
            <CheckboxField label="Auto Wrap" checked={((selectedObject.outputOptions ?? 0) & OUTPUT_STRING_OPTION_AUTO_WRAP) !== 0} onChange={(v) => onPatch({ outputOptions: patchBit(selectedObject.outputOptions, OUTPUT_STRING_OPTION_AUTO_WRAP, v) & (v ? 0xff : ~OUTPUT_STRING_OPTION_WRAP_ON_HYPHEN) })} />
            <CheckboxField label="Wrap on Hyphen" checked={((selectedObject.outputOptions ?? 0) & OUTPUT_STRING_OPTION_WRAP_ON_HYPHEN) !== 0} disabled={((selectedObject.outputOptions ?? 0) & OUTPUT_STRING_OPTION_AUTO_WRAP) === 0} onChange={(v) => onPatch({ outputOptions: patchBit(selectedObject.outputOptions, OUTPUT_STRING_OPTION_WRAP_ON_HYPHEN, v) })} />
          </PropertySection>
          <PropertySection title="References">
            <SelectField label="Font Attribute"   value={selectedObject.fontAttributeId ?? ''}  options={fontAttrOpts} onChange={(v) => handleRefSelect(v, '__create_font-attribute', 'font-attribute', (id) => ({ fontAttributeId: id }))} />
            <SelectField label="Variable Reference" value={selectedObject.variableReference !== undefined ? selectedObject.variableReference ?? '__null' : selectedObject.stringVariableId || '__null'} options={outputStringVariableOpts} onChange={(v) => handleRefSelect(v, '__create_string-variable', 'string-variable', (id) => ({ variableReference: id === '__null' ? null : id }))} />
          </PropertySection>
        </>
      )}

      {/* ── Output Number ─────────────────────────────────────────────── */}
      {kind === 'output-number' && (
        <>
          <PropertySection title="Number">
            <Field label="Default Value"   value={selectedObject.value ?? 0}            type="number" onChange={(v) => onPatch({ value: Number(v) })} />
            <Field label="Offset"          value={selectedObject.offset ?? 0}            type="number" onChange={(v) => onPatch({ offset: Number(v) })} />
            <Field label="Scale"           value={selectedObject.scale ?? 1}             type="number" onChange={(v) => onPatch({ scale: Number(v) })} />
            <Field label="Decimal Places"  value={selectedObject.numberOfDecimals ?? 0}  type="number" onChange={(v) => onPatch({ numberOfDecimals: Number(v) })} />
            <SelectField label="Format" value={String(selectedObject.numberFormat ?? 0)} options={VT_NUMBER_FORMAT_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))} onChange={(v) => onPatch({ numberFormat: Number(v) })} />
            <VtColorField label="Background" value={selectedObject.backgroundColorIndex ?? 1} onChange={(backgroundColorIndex) => onPatch({ backgroundColorIndex })} />
            <SelectField label="Horizontal" value={String(selectedObject.horizontalJustification ?? 0)} options={VT_H_JUSTIFY_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }))} onChange={(v) => onPatch({ horizontalJustification: asHorizontalJustification(Number(v)) })} />
            <SelectField label="Vertical" value={String(selectedObject.verticalJustification ?? 0)} options={VT_V_JUSTIFY_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }))} onChange={(v) => onPatch({ verticalJustification: asVerticalJustification(Number(v)) })} />
            <CheckboxField label="Transparent Background" checked={((selectedObject.outputOptions ?? 0) & OUTPUT_STRING_OPTION_TRANSPARENT) !== 0} onChange={(v) => onPatch({ outputOptions: patchBit(selectedObject.outputOptions, OUTPUT_STRING_OPTION_TRANSPARENT, v) })} />
          </PropertySection>
          <PropertySection title="References">
            <SelectField label="Font Attribute"    value={selectedObject.fontAttributeId ?? ''}   options={fontAttrOpts} onChange={(v) => handleRefSelect(v, '__create_font-attribute', 'font-attribute', (id) => ({ fontAttributeId: id }))} />
            <SelectField label="Number Variable"   value={selectedObject.numberVariableId ?? ''}  options={numVarOpts}   onChange={(v) => handleRefSelect(v, '__create_number-variable', 'number-variable', (id) => ({ numberVariableId: id }))} />
          </PropertySection>
        </>
      )}

      {/* ── Output Rectangle ──────────────────────────────────────────── */}
      {kind === 'output-rectangle' && (
        <PropertySection title="Appearance">
          <Field label="Line Suppression" value={selectedObject.lineSuppression ?? 0} type="number" onChange={(v) => onPatch({ lineSuppression: Number(v) })} />
          <SelectField label="Line Attribute" value={selectedObject.lineAttributeId ?? ''} options={lineAttrOpts} onChange={(v) => handleRefSelect(v, '__create_line-attribute', 'line-attribute', (id) => ({ lineAttributeId: id }))} />
          <SelectField label="Fill Attribute" value={selectedObject.fillAttributeId ?? ''} options={fillAttrOpts} onChange={(v) => handleRefSelect(v, '__create_fill-attribute', 'fill-attribute', (id) => ({ fillAttributeId: id }))} />
        </PropertySection>
      )}

      {/* ── Picture Graphic ───────────────────────────────────────────── */}
      {kind === 'picture-graphic' && <PictureGraphicPanel object={selectedObject} onPatch={onPatch} />}

      {/* ── Font Attribute ────────────────────────────────────────────── */}
      {kind === 'font-attribute' && (
        <PropertySection title="Font">
          <VtColorField label="Font Color"  value={selectedObject.fontColor ?? 0} onChange={(fontColor) => onPatch({ fontColor })} />
          <SelectField  label="Font Type"   value={selectedObject.proportional === false ? 'monospace' : 'proportional'} options={[{ value: 'proportional', label: 'Proportional' }, { value: 'monospace', label: 'Monospace' }]} onChange={(v) => onPatch({ proportional: v === 'proportional' })} />
          <SelectField  label="Font Size"   value={fontCellValue(selectedObject)} options={vtFontCells.map((c) => ({ value: c.value, label: c.label }))} onChange={(v) => { const c = vtFontCells.find((x) => x.value === v) ?? vtFontCells[5]; onPatch({ fontWidth: c.width, fontHeight: c.height, fontSize: c.height }); }} />
          <FontStyleField value={selectedObject.fontStyle ?? 0} onChange={(fontStyle) => onPatch({ fontStyle })} />
        </PropertySection>
      )}

      {/* ── Line Attribute ────────────────────────────────────────────── */}
      {kind === 'line-attribute' && (
        <PropertySection title="Line">
          <VtColorField label="Line Color" value={selectedObject.lineColor ?? 0} onChange={(lineColor) => onPatch({ lineColor })} />
          <Field label="Line Width" value={selectedObject.lineWidth ?? 1} type="number" onChange={(v) => onPatch({ lineWidth: Number(v) })} />
          <SelectField label="Line Art" value={selectedObject.lineArt ?? '0xFFFF'} options={[{ value: '0xFFFF', label: 'Solid' }, { value: '0xF0F0', label: 'Dashed' }, { value: '0xAAAA', label: 'Dotted' }]} onChange={(lineArt) => onPatch({ lineArt })} />
        </PropertySection>
      )}

      {/* ── Fill Attribute ────────────────────────────────────────────── */}
      {kind === 'fill-attribute' && (
        <PropertySection title="Fill">
          <SelectField label="Fill Type"  value={String(selectedObject.fillType ?? 2)} options={VT_FILL_TYPE_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))} onChange={(v) => onPatch({ fillType: Number(v) })} />
          <VtColorField label="Fill Color" value={selectedObject.fillColor ?? 15} onChange={(fillColor) => onPatch({ fillColor })} />
        </PropertySection>
      )}

      {/* ── String Variable ───────────────────────────────────────────── */}
      {kind === 'string-variable' && (
        <PropertySection title="String Variable">
          <Field label="Value"      value={selectedObject.stringValue ?? ''}  onChange={(stringValue) => onPatch({ stringValue })} />
          <Field label="Max Length" value={selectedObject.maxLength ?? 128}   type="number" onChange={(v) => onPatch({ maxLength: Number(v) })} />
        </PropertySection>
      )}

      {/* ── Number Variable ───────────────────────────────────────────── */}
      {kind === 'number-variable' && (
        <PropertySection title="Number Variable">
          <Field label="Value"       value={selectedObject.value ?? 0}       type="number" onChange={(v) => onPatch({ value: Number(v) })} />
          <Field label="Unit"        value={selectedObject.unit ?? ''}       onChange={(unit) => onPatch({ unit })} />
          <Field label="Min Preview" value={selectedObject.minPreview ?? 0}  type="number" onChange={(v) => onPatch({ minPreview: Number(v) })} />
          <Field label="Max Preview" value={selectedObject.maxPreview ?? 100} type="number" onChange={(v) => onPatch({ maxPreview: Number(v) })} />
        </PropertySection>
      )}

      {/* ── Events & Macros (placeholder) ─────────────────────────────── */}
      <PropertySection title="Events & Macros" defaultOpen={false} />
    </Panel>
  );
}

// ── Picture Graphic Panel ──────────────────────────────────────────────────

function PictureGraphicPanel({ object, onPatch }: { object: EditorObject; onPatch: (changes: Partial<EditorObject>) => void }) {
  const previewUrl = pictureGraphicToDataUrl(object);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const format = asPictureGraphicFormat(object.graphicFormat);
  const options = clearUnsupportedPictureGraphicOptions(object.graphicOptions ?? 0);
  const transparent = (options & PICTURE_GRAPHIC_OPTION_TRANSPARENT) !== 0;
  const flashing = (options & PICTURE_GRAPHIC_OPTION_FLASHING) !== 0;
  const rle = (options & PICTURE_GRAPHIC_OPTION_RLE) !== 0;
  const targetWidth = object.targetWidth ?? object.width ?? object.actualWidth ?? 64;
  const actualWidth = object.actualWidth ?? object.width ?? 64;
  const actualHeight = object.actualHeight ?? object.height ?? 64;
  const targetHeight = derivedPictureGraphicHeight(targetWidth, actualWidth, actualHeight);
  const expectedRawDataLength = expectedPictureGraphicRawDataLength(actualWidth, actualHeight, format);

  function patchTargetWidth(nextTargetWidth: number) {
    const width = Math.max(1, Math.round(nextTargetWidth));
    onPatch({
      targetWidth: width,
      width,
      height: derivedPictureGraphicHeight(width, actualWidth, actualHeight),
    });
  }

  function patchOption(bit: number, enabled: boolean) {
    const nextOptions = enabled ? options | bit : options & ~bit;
    onPatch({ graphicOptions: nextOptions });
    if (bit === PICTURE_GRAPHIC_OPTION_TRANSPARENT && object.sourceImageDataUrl) {
      void requantizeFromSource(format, nextOptions, object.transparencyColor ?? 0);
    }
  }

  async function requantizeFromSource(
    nextFormat = format,
    nextOptions = options,
    nextTransparencyColor = object.transparencyColor ?? 0,
  ) {
    if (!object.sourceImageDataUrl) {
      onPatch({ graphicFormat: nextFormat, graphicOptions: nextOptions, transparencyColor: nextTransparencyColor, rawData: [] });
      return;
    }

    const quantized = await quantizePictureGraphicSource(
      object.sourceImageDataUrl,
      nextFormat,
      nextOptions,
      nextTransparencyColor,
    );
    const nextTargetWidth = object.targetWidth ?? object.width ?? quantized.actualWidth;
    onPatch({
      ...quantized,
      graphicFormat: nextFormat,
      graphicOptions: nextOptions,
      transparencyColor: nextTransparencyColor,
      targetWidth: nextTargetWidth,
      width: nextTargetWidth,
      height: derivedPictureGraphicHeight(nextTargetWidth, quantized.actualWidth, quantized.actualHeight),
    });
  }

  useEffect(() => {
    if (!object.sourceImageDataUrl) return;
    if (object.rawData?.length === expectedRawDataLength) return;
    void quantizePictureGraphicSource(object.sourceImageDataUrl, format, options, object.transparencyColor ?? 0).then((quantized) => {
      const nextTargetWidth = object.targetWidth ?? object.width ?? quantized.actualWidth;
      onPatch({
        ...quantized,
        graphicFormat: format,
        graphicOptions: options,
        targetWidth: nextTargetWidth,
        width: nextTargetWidth,
        height: derivedPictureGraphicHeight(nextTargetWidth, quantized.actualWidth, quantized.actualHeight),
      });
    });
  }, [
    object.sourceImageDataUrl,
    object.rawData?.length,
    object.transparencyColor,
    object.targetWidth,
    object.width,
    expectedRawDataLength,
    format,
    options,
    onPatch,
  ]);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const sourceImageDataUrl = await readFileAsDataUrl(file);
      const quantized = await quantizePictureGraphicSource(sourceImageDataUrl, format, options, object.transparencyColor ?? 0);
      const nextTargetWidth = object.targetWidth ?? object.width ?? quantized.actualWidth;
      onPatch({
        ...quantized,
        targetWidth: nextTargetWidth,
        width: nextTargetWidth,
        height: derivedPictureGraphicHeight(nextTargetWidth, quantized.actualWidth, quantized.actualHeight),
        sourceImagePath: file.name,
        sourceImageDataUrl,
      });
    } finally {
      // Reset input so re-uploading the same file triggers onChange again
      event.target.value = '';
    }
  }

  return (
    <PropertySection title="Picture Graphic">
      {/* Dimensions */}
      <Field label="Target Width" value={targetWidth} type="number" onChange={(v) => patchTargetWidth(Number(v))} />
      <Field label="Derived Height" value={targetHeight} disabled onChange={() => undefined} />
      <div className="field-row">
        <Field label="Actual W" value={actualWidth} disabled onChange={() => undefined} />
        <Field label="Actual H" value={actualHeight} disabled onChange={() => undefined} />
      </div>
      <SelectField
        label="Format"
        value={String(format)}
        options={PICTURE_GRAPHIC_FORMAT_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }))}
        onChange={(value) => void requantizeFromSource(asPictureGraphicFormat(Number(value)))}
      />
      <CheckboxField label="Transparent" checked={transparent} onChange={(checked) => patchOption(PICTURE_GRAPHIC_OPTION_TRANSPARENT, checked)} />
      <CheckboxField label="Flashing" checked={flashing} onChange={(checked) => patchOption(PICTURE_GRAPHIC_OPTION_FLASHING, checked)} />
      <CheckboxField label="RLE compressed (V1 unavailable)" checked={rle} disabled onChange={() => undefined} />
      <VtColorField
        label="Transparency Color"
        value={Math.min(pictureFormatMaxIndex(format), object.transparencyColor ?? 0)}
        onChange={(value) => void requantizeFromSource(format, options, Math.min(pictureFormatMaxIndex(format), value))}
      />

      {/* Upload */}
      <label className="field">
        <span>Image</span>
        <div className="field-input">
          <button
            type="button"
            className="pic-upload-button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload image — will be converted to ISO VT palette-indexed bitmap bytes"
          >
            <Upload size={14} />
            <span>{object.sourceImagePath ? 'Replace' : 'Upload'} Image</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
            style={{ display: 'none' }}
            onChange={handleFileSelected}
          />
        </div>
      </label>

      {/* Source info */}
      {object.sourceImagePath && (
        <Field label="Source" value={object.sourceImagePath} disabled onChange={() => undefined} />
      )}

      {/* Bitmap preview */}
      <div className="pic-preview-wrap">
        {previewUrl
          ? <img src={previewUrl} alt={object.name} className="pic-preview-img" />
          : <div className="pic-preview-empty">No image uploaded</div>
        }
        {previewUrl && (
          <div className="pic-preview-size">{actualWidth} × {actualHeight} px source → {targetWidth} × {targetHeight} px target</div>
        )}
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

function utf8ByteLength(value: string) {
  return new TextEncoder().encode(value).length;
}
