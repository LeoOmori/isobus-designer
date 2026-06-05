import { useRef } from 'react';
import { Archive, Trash2, Upload } from 'lucide-react';
import { rawDataToDataUrl, VT_FILL_TYPE_OPTIONS, VT_NUMBER_FORMAT_OPTIONS, fontCellValue, vtFontCells } from '../domain/isobus';
import { objectKindName } from '../domain/objectMeta';
import type { EditorObject, ReferenceKind, WorkingSet } from '../domain/types';
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
  const strVarOpts     = referenceOptions(objects, 'string-variable',  '+ Create String Variable',  '__create_string-variable');
  const numVarOpts     = referenceOptions(objects, 'number-variable',  '+ Create Number Variable',  '__create_number-variable');

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
          <button onClick={() => onLayer('forward')}>↑</button>
          <button onClick={() => onLayer('backward')}>↓</button>
          <button onClick={onDelete}><Trash2 size={16} /></button>
        </span>
      </div>

      {/* ── General ──────────────────────────────────────────────────── */}
      <PropertySection title="General">
        <Field label="Object ID" value={selectedObject.objectId} disabled onChange={() => undefined} />
        <Field label="Name"      value={selectedObject.name}     onChange={(name) => onPatch({ name })} />
        <Field label="Notes"     value={selectedObject.notes ?? ''} onChange={(notes) => onPatch({ notes })} />
        {!isNoLayout && (
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
            <SelectField label="Horizontal" value={selectedObject.horizontalAlign ?? 'left'} options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} onChange={(v) => onPatch({ horizontalAlign: v as EditorObject['horizontalAlign'] })} />
            <SelectField label="Vertical"   value={selectedObject.verticalAlign ?? 'top'}    options={[{ value: 'top', label: 'Top' }, { value: 'center', label: 'Middle' }, { value: 'bottom', label: 'Bottom' }]} onChange={(v) => onPatch({ verticalAlign: v as EditorObject['verticalAlign'] })} />
            <CheckboxField label="Transparent Background" checked={((selectedObject.outputOptions ?? 0) & 1) !== 0} onChange={(v) => onPatch({ outputOptions: v ? (selectedObject.outputOptions ?? 0) | 1 : (selectedObject.outputOptions ?? 0) & ~1 })} />
          </PropertySection>
          <PropertySection title="References">
            <SelectField label="Font Attribute"   value={selectedObject.fontAttributeId ?? ''}  options={fontAttrOpts} onChange={(v) => handleRefSelect(v, '__create_font-attribute', 'font-attribute', (id) => ({ fontAttributeId: id }))} />
            <SelectField label="String Variable"  value={selectedObject.stringVariableId ?? ''} options={strVarOpts}   onChange={(v) => handleRefSelect(v, '__create_string-variable', 'string-variable', (id) => ({ stringVariableId: id }))} />
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
            <CheckboxField label="Transparent Background" checked={((selectedObject.outputOptions ?? 0) & 1) !== 0} onChange={(v) => onPatch({ outputOptions: v ? (selectedObject.outputOptions ?? 0) | 1 : (selectedObject.outputOptions ?? 0) & ~1 })} />
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
  const previewUrl = rawDataToDataUrl(object.rawData, object.graphicFormat);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Use natural image dimensions as actual render size,
      // or fall back to existing actualWidth/actualHeight
      const w = object.actualWidth  ?? img.naturalWidth;
      const h = object.actualHeight ?? img.naturalHeight;

      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob((blob) => {
        if (!blob) return;
        blob.arrayBuffer().then((buf) => {
          onPatch({
            rawData:         Array.from(new Uint8Array(buf)),
            graphicFormat:   1, // PNG
            actualWidth:     w,
            actualHeight:    h,
            sourceImagePath: file.name,
            originalFormat:  file.type === 'image/png' ? 'png'
                           : file.type === 'image/jpeg' || file.type === 'image/jpg' ? 'jpg'
                           : 'png',
          });
        });
      }, 'image/png');
    };

    img.onerror = () => { URL.revokeObjectURL(objectUrl); };
    img.src = objectUrl;

    // Reset input so re-uploading the same file triggers onChange again
    event.target.value = '';
  }

  return (
    <PropertySection title="Picture Graphic">
      {/* Dimensions */}
      <div className="field-row">
        <Field label="Actual W" value={object.actualWidth  ?? object.width}  type="number" onChange={(v) => onPatch({ actualWidth: Number(v) })} />
        <Field label="Actual H" value={object.actualHeight ?? object.height} type="number" onChange={(v) => onPatch({ actualHeight: Number(v) })} />
      </div>
      <Field label="Transparency Color Index" value={object.transparencyColor ?? 0} type="number" onChange={(v) => onPatch({ transparencyColor: Number(v) })} />

      {/* Upload */}
      <label className="field">
        <span>Image</span>
        <div className="field-input">
          <button
            className="pic-upload-button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload image — will be converted to PNG bitmap"
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
          <div className="pic-preview-size">{object.actualWidth ?? object.width} × {object.actualHeight ?? object.height} px</div>
        )}
      </div>
    </PropertySection>
  );
}
