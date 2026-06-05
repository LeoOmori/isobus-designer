import { Archive, Trash2 } from 'lucide-react';
import { fontCellValue, vtFontCells } from '../domain/isobus';
import { objectKindName } from '../domain/objectMeta';
import type { EditorObject, ReferenceKind, WorkingSet } from '../domain/types';
import { Panel } from '../ui/primitives';
import { CheckboxField, Field, FontStyleField, PropertySection, SelectField, VtColorField } from './fields';

export function WorkingSetProperties({ workingSet, masks, onPatch }: { workingSet: WorkingSet; masks: EditorObject[]; onPatch: (changes: Partial<WorkingSet>) => void }) {
  const maskOptions = [{ value: '', label: 'None' }, ...masks.map((mask) => ({ value: mask.id, label: `${mask.id} — ${mask.name}` }))];
  return (
    <Panel title="Object Parameter Editor">
      <div className="properties-title"><strong>Working Set: {workingSet.id}</strong><span><Archive size={16} /></span></div>
      <PropertySection title="General">
        <Field label="Object ID" value={workingSet.objectId} disabled onChange={() => undefined} />
        <Field label="Name" value={workingSet.name} onChange={(name) => onPatch({ name })} />
        <Field label="Version" value={workingSet.version} onChange={(version) => onPatch({ version })} />
        <Field label="Language" value={workingSet.language} onChange={(language) => onPatch({ language })} />
        <SelectField label="Active Data Mask" value={workingSet.activeDataMaskId} options={maskOptions} onChange={(activeDataMaskId) => onPatch({ activeDataMaskId })} />
        <Field label="Active Soft Keys" value={workingSet.activeSoftKeyMaskId} onChange={(activeSoftKeyMaskId) => onPatch({ activeSoftKeyMaskId })} />
        <Field label="Background" value={workingSet.backgroundColor} type="color" onChange={(backgroundColor) => onPatch({ backgroundColor })} />
      </PropertySection>
      <PropertySection title="Children" defaultOpen={false} />
    </Panel>
  );
}

export function PropertiesPanel({ selectedObject, masks, objects, onPatch, onDelete, onLayer, onCreateAttributeReference }: { selectedObject: EditorObject; masks: EditorObject[]; objects: EditorObject[]; onPatch: (changes: Partial<EditorObject>) => void; onDelete: () => void; onLayer: (action: 'front' | 'back' | 'forward' | 'backward') => void; onCreateAttributeReference: (kind: ReferenceKind) => void }) {
  const maskOptions = [{ value: '', label: 'None' }, ...masks.filter((mask) => mask.id !== selectedObject.id).map((mask) => ({ value: mask.id, label: `${mask.id} — ${mask.name}` }))];
  const lineAttributeOptions = [{ value: '', label: 'None' }, ...objects.filter((object) => object.kind === 'line-attribute').map((object) => ({ value: object.id, label: `${object.id} — ${object.name}` })), { value: '__create_line_attribute', label: '+ Create Line Attribute' }];
  const fillAttributeOptions = [{ value: '', label: 'None' }, ...objects.filter((object) => object.kind === 'fill-attribute').map((object) => ({ value: object.id, label: `${object.id} — ${object.name}` })), { value: '__create_fill_attribute', label: '+ Create Fill Attribute' }];
  const fontAttributeOptions = [{ value: '', label: 'None' }, ...objects.filter((object) => object.kind === 'font-attribute').map((object) => ({ value: object.id, label: `${object.id} — ${object.name}` })), { value: '__create_font_attribute', label: '+ Create Font Attribute' }];
  const stringVariableOptions = [{ value: '', label: 'None' }, ...objects.filter((object) => object.kind === 'string-variable').map((object) => ({ value: object.id, label: `${object.id} — ${object.name}` })), { value: '__create_string_variable', label: '+ Create String Variable' }];
  const isReferenceOnly = selectedObject.kind === 'line-attribute' || selectedObject.kind === 'fill-attribute' || selectedObject.kind === 'font-attribute' || selectedObject.kind === 'string-variable';

  return (
    <Panel title="Object Parameter Editor">
      <div className="properties-title"><strong>{objectKindName(selectedObject.kind)}: {selectedObject.id}</strong><span><button onClick={() => onLayer('forward')}>↑</button><button onClick={() => onLayer('backward')}>↓</button><button onClick={onDelete}><Trash2 size={16} /></button></span></div>
      <PropertySection title="General">
        <Field label="Object ID" value={selectedObject.objectId} disabled onChange={() => undefined} />
        <Field label="Name" value={selectedObject.name} onChange={(name) => onPatch({ name })} />
        {!isReferenceOnly && <div className="field-row"><Field label="Width" value={selectedObject.width} type="number" onChange={(width) => onPatch({ width: Number(width) })} /><Field label="Height" value={selectedObject.height} type="number" onChange={(height) => onPatch({ height: Number(height) })} /></div>}
        {selectedObject.kind === 'data-mask' && <Field label="Background" value={selectedObject.backgroundColor} type="color" onChange={(backgroundColor) => onPatch({ backgroundColor })} />}
      </PropertySection>
      {!isReferenceOnly && <PropertySection title="Layout">
        <div className="field-row"><Field label="X" value={selectedObject.x} type="number" onChange={(x) => onPatch({ x: Number(x) })} /><Field label="Y" value={selectedObject.y} type="number" onChange={(y) => onPatch({ y: Number(y) })} /></div>
        <CheckboxField label="Visible" checked={selectedObject.visible} onChange={(visible) => onPatch({ visible })} />
        {selectedObject.kind === 'data-mask' && <CheckboxField label="Locked" checked={selectedObject.locked ?? false} onChange={(locked) => onPatch({ locked })} />}
        {selectedObject.kind === 'rectangle' && <CheckboxField label="Hidden" checked={selectedObject.hidden ?? false} onChange={(hidden) => onPatch({ hidden, visible: !hidden })} />}
        {selectedObject.kind === 'output-string' && <><Field label="Text" value={selectedObject.text ?? ''} onChange={(text) => onPatch({ text })} /><SelectField label="Horizontal" value={selectedObject.horizontalAlign ?? 'left'} options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} onChange={(horizontalAlign) => onPatch({ horizontalAlign: horizontalAlign as EditorObject['horizontalAlign'] })} /><SelectField label="Vertical" value={selectedObject.verticalAlign ?? 'top'} options={[{ value: 'top', label: 'Top' }, { value: 'center', label: 'Center' }, { value: 'bottom', label: 'Bottom' }]} onChange={(verticalAlign) => onPatch({ verticalAlign: verticalAlign as EditorObject['verticalAlign'] })} /></>}
      </PropertySection>}
      {selectedObject.kind === 'rectangle' && <PropertySection title="Appearance"><SelectField label="Line Attribute" value={selectedObject.lineAttributeId ?? ''} options={lineAttributeOptions} onChange={(lineAttributeId) => lineAttributeId === '__create_line_attribute' ? onCreateAttributeReference('line-attribute') : onPatch({ lineAttributeId })} /><SelectField label="Fill Attribute" value={selectedObject.fillAttributeId ?? ''} options={fillAttributeOptions} onChange={(fillAttributeId) => fillAttributeId === '__create_fill_attribute' ? onCreateAttributeReference('fill-attribute') : onPatch({ fillAttributeId })} /></PropertySection>}
      {selectedObject.kind === 'output-string' && <PropertySection title="Text References"><SelectField label="Font Attribute" value={selectedObject.fontAttributeId ?? ''} options={fontAttributeOptions} onChange={(fontAttributeId) => fontAttributeId === '__create_font_attribute' ? onCreateAttributeReference('font-attribute') : onPatch({ fontAttributeId })} /><SelectField label="String Variable" value={selectedObject.stringVariableId ?? ''} options={stringVariableOptions} onChange={(stringVariableId) => stringVariableId === '__create_string_variable' ? onCreateAttributeReference('string-variable') : onPatch({ stringVariableId })} /></PropertySection>}
      {selectedObject.kind === 'line-attribute' && <PropertySection title="Line Attributes"><Field label="Line Color" value={selectedObject.lineColor ?? 0} type="number" onChange={(lineColor) => onPatch({ lineColor: Number(lineColor) })} /><Field label="Line Width" value={selectedObject.lineWidth ?? 1} type="number" onChange={(lineWidth) => onPatch({ lineWidth: Number(lineWidth) })} /><Field label="Line Art" value={selectedObject.lineArt ?? '0xFFFF'} onChange={(lineArt) => onPatch({ lineArt })} /></PropertySection>}
      {selectedObject.kind === 'fill-attribute' && <PropertySection title="Fill Attributes"><SelectField label="Fill Type" value={selectedObject.fillType ?? 'solid'} options={[{ value: 'solid', label: 'Solid' }, { value: 'hollow', label: 'Hollow' }, { value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }, { value: 'cross-hatch', label: 'Cross Hatch' }]} onChange={(fillType) => onPatch({ fillType: fillType as EditorObject['fillType'] })} /><Field label="Fill Color" value={selectedObject.fillColor ?? 15} type="number" onChange={(fillColor) => onPatch({ fillColor: Number(fillColor) })} /></PropertySection>}
      {selectedObject.kind === 'font-attribute' && <PropertySection title="Font Attributes"><VtColorField label="Font Color" value={selectedObject.fontColor ?? 0} onChange={(fontColor) => onPatch({ fontColor })} /><SelectField label="Font Type" value={selectedObject.proportional === false ? 'monospace' : 'proportional'} options={[{ value: 'proportional', label: 'Proportional' }, { value: 'monospace', label: 'Monospace' }]} onChange={(value) => onPatch({ proportional: value === 'proportional' })} /><SelectField label="Font Size" value={fontCellValue(selectedObject)} options={vtFontCells.map((cell) => ({ value: cell.value, label: cell.label }))} onChange={(value) => { const cell = vtFontCells.find((item) => item.value === value) ?? vtFontCells[4]; onPatch({ fontWidth: cell.width, fontHeight: cell.height, fontSize: cell.height }); }} /><FontStyleField value={selectedObject.fontStyle ?? 0} onChange={(fontStyle) => onPatch({ fontStyle })} /></PropertySection>}
      {selectedObject.kind === 'string-variable' && <PropertySection title="String Variable"><Field label="Value" value={selectedObject.stringValue ?? ''} onChange={(stringValue) => onPatch({ stringValue })} /></PropertySection>}
      {selectedObject.kind === 'data-mask' && <PropertySection title="Navigation"><Field label="Soft Key Mask" value={selectedObject.softKeyMaskId ?? ''} onChange={(softKeyMaskId) => onPatch({ softKeyMaskId })} /><SelectField label="Next Mask" value={selectedObject.nextMaskId ?? ''} options={maskOptions} onChange={(nextMaskId) => onPatch({ nextMaskId })} /><SelectField label="Previous Mask" value={selectedObject.previousMaskId ?? ''} options={maskOptions} onChange={(previousMaskId) => onPatch({ previousMaskId })} /></PropertySection>}
      {['Events', 'References'].map((section) => <PropertySection title={section} defaultOpen={false} key={section} />)}
    </Panel>
  );
}
