import { useState } from 'react';
import {
  AlignCenter, Circle, ClipboardList, Copy, Eye, Folder,
  Grid3X3, Hash, Image, KeyRound, Keyboard, LayoutPanelLeft,
  MoreVertical, MousePointerClick, PenLine, Plus, Square, Trash2, Type, Zap,
} from 'lucide-react';
import type { EditorObject, ObjectKind, ReferenceKind, ToolMode } from '../domain/types';
import { PaletteCard, Panel, ResizableSplit, SearchBox, SectionHeader } from '../ui/primitives';

export function LeftSidebar({
  tool, onToolChange,
  masks, activeMaskId, onMaskSelect, onAddMask, onDuplicateMask, onDeleteMask,
  softKeyMasks, activeSoftKeyMaskId, onSoftKeyMaskSelect, onAddSoftKeyMask, onDeleteSoftKeyMask,
  onCreateObject, onCreateAttribute,
}: {
  tool: ToolMode;
  onToolChange: (tool: ToolMode) => void;
  masks: EditorObject[];
  activeMaskId: string;
  onMaskSelect: (id: string) => void;
  onAddMask: () => void;
  onDuplicateMask: () => void;
  onDeleteMask: () => void;
  softKeyMasks: EditorObject[];
  activeSoftKeyMaskId: string;
  onSoftKeyMaskSelect: (id: string) => void;
  onAddSoftKeyMask: () => void;
  onDeleteSoftKeyMask: () => void;
  onCreateObject: (kind: ObjectKind) => void;
  onCreateAttribute: (kind: ReferenceKind) => void;
}) {
  const [tab, setTab] = useState<'data-masks' | 'soft-key-masks'>('data-masks');

  return (
    <aside className="left-sidebar">
      <ResizableSplit defaultTopHeight={320} minTopHeight={120} minBottomHeight={100}>
        {/* ── Object Picker ──────────────────────────────────────────────── */}
        <Panel title="Object Picker">
          <div className="panel-toolbar"><SearchBox placeholder="Search objects..." /><Zap size={16} /></div>

          <SectionHeader title="SCREENS" />
          <div className="palette-grid supported">
            <PaletteCard label="Data Mask"     icon={<LayoutPanelLeft size={24} />} selected={tool === 'data-mask'}     onClick={() => onToolChange('data-mask')} />
            <PaletteCard label="Soft Key Mask" icon={<Keyboard size={24} />}        onClick={() => onCreateObject('soft-key-mask')} />
          </div>

          <SectionHeader title="GROUPS" />
          <div className="palette-grid supported">
            <PaletteCard label="Container" icon={<Grid3X3 size={24} />} selected={tool === 'container'} onClick={() => onToolChange('container')} />
          </div>

          <SectionHeader title="OUTPUTS" />
          <div className="palette-grid supported">
            <PaletteCard label="Output String"    icon={<Type size={24} />}                selected={tool === 'output-string'}    onClick={() => onToolChange('output-string')} />
            <PaletteCard label="Output Number"    icon={<Hash size={24} />}                selected={tool === 'output-number'}    onClick={() => onToolChange('output-number')} />
            <PaletteCard label="Rectangle"        icon={<Square size={24} />}              selected={tool === 'output-rectangle'} onClick={() => onToolChange('output-rectangle')} />
            <PaletteCard label="Picture Graphic"  icon={<Image size={24} />}               selected={tool === 'picture-graphic'}  onClick={() => onToolChange('picture-graphic')} />
          </div>

          <SectionHeader title="INPUTS" />
          <div className="palette-grid supported">
            <PaletteCard label="Button"   icon={<MousePointerClick size={24} />} selected={tool === 'button'} onClick={() => onToolChange('button')} />
            <PaletteCard label="Key"      icon={<KeyRound size={24} />}          onClick={() => onCreateObject('key')} />
          </div>

          <SectionHeader title="ATTRIBUTES" />
          <div className="palette-grid supported">
            <PaletteCard label="Line Attr"   icon={<PenLine size={24} />}       onClick={() => onCreateAttribute('line-attribute')} />
            <PaletteCard label="Fill Attr"   icon={<Grid3X3 size={24} />}       onClick={() => onCreateAttribute('fill-attribute')} />
            <PaletteCard label="Font Attr"   icon={<Type size={24} />}          onClick={() => onCreateAttribute('font-attribute')} />
            <PaletteCard label="String Var"  icon={<ClipboardList size={24} />} onClick={() => onCreateAttribute('string-variable')} />
            <PaletteCard label="Number Var"  icon={<Hash size={24} />}          onClick={() => onCreateAttribute('number-variable')} />
          </div>

          <SectionHeader title="PLANNED" />
          <div className="palette-grid">
            <PaletteCard label="Meter"      disabled icon={<AlignCenter size={24} />} />
            <PaletteCard label="Bar Graph"  disabled icon={<AlignCenter size={24} />} />
            <PaletteCard label="Ellipse"    disabled icon={<Circle size={24} />} />
            <PaletteCard label="Input Num"  disabled icon={<Hash size={24} />} />
            <PaletteCard label="Input List" disabled icon={<ClipboardList size={24} />} />
          </div>
        </Panel>

        {/* ── Masks (Data + Soft Key) ──────────────────────────────────────── */}
        <Panel title="Masks" className="masks-panel">
          <div className="tabs">
            <button className={tab === 'data-masks' ? 'active' : ''} onClick={() => setTab('data-masks')}>Data Masks</button>
            <button className={tab === 'soft-key-masks' ? 'active' : ''} onClick={() => setTab('soft-key-masks')}>Soft Key Masks</button>
          </div>

          {tab === 'data-masks' && (
            <>
              <SearchBox placeholder="Search data masks..." />
              <div className="list">
                {masks.map((mask) => (
                  <button
                    key={mask.id}
                    className={`list-row ${mask.id === activeMaskId ? 'selected' : ''}`}
                    onClick={() => onMaskSelect(mask.id)}
                  >
                    <LayoutPanelLeft size={14} />
                    <span className="mono-id">{mask.id}</span>
                    <span>{mask.name}</span>
                    <Eye size={14} />
                    <MoreVertical size={14} />
                  </button>
                ))}
              </div>
              <div className="panel-actions">
                <button onClick={onAddMask}><Plus size={18} /></button>
                <button onClick={onDuplicateMask}><Copy size={18} /></button>
                <button><Folder size={18} /></button>
                <button onClick={onDeleteMask}><Trash2 size={18} /></button>
              </div>
            </>
          )}

          {tab === 'soft-key-masks' && (
            <>
              <SearchBox placeholder="Search soft key masks..." />
              <div className="list">
                {softKeyMasks.map((skm) => (
                  <button
                    key={skm.id}
                    className={`list-row ${skm.id === activeSoftKeyMaskId ? 'selected' : ''}`}
                    onClick={() => onSoftKeyMaskSelect(skm.id)}
                  >
                    <Keyboard size={14} />
                    <span className="mono-id">{skm.id}</span>
                    <span>{skm.name}</span>
                    <MoreVertical size={14} />
                  </button>
                ))}
                {softKeyMasks.length === 0 && (
                  <div style={{ padding: '8px 12px', color: '#9ca3af', fontSize: 12 }}>No Soft Key Masks</div>
                )}
              </div>
              <div className="panel-actions">
                <button onClick={onAddSoftKeyMask}><Plus size={18} /></button>
                <button onClick={onDeleteSoftKeyMask}><Trash2 size={18} /></button>
              </div>
            </>
          )}
        </Panel>
      </ResizableSplit>
    </aside>
  );
}
