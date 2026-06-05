import { AlignCenter, Archive, Circle, ClipboardList, Copy, Eye, Folder, Grid3X3, Image, LayoutPanelLeft, Menu, MoreVertical, PenLine, Plus, Square, Trash2, Triangle, Type, Zap } from 'lucide-react';
import type { EditorObject, ReferenceKind, ToolMode } from '../domain/types';
import { PaletteCard, Panel, SearchBox, SectionHeader } from '../ui/primitives';

const disabledPalette = {
  inputs: ['Button', 'Input Number', 'Input List', 'Input Bool'],
  outputs: ['Meter', 'Bar Graph', 'Image'],
  shapes: ['Ellipse', 'Line', 'Polygon'],
};

export function LeftSidebar({ tool, onToolChange, masks, activeMaskId, onMaskSelect, onAddMask, onDuplicateMask, onDeleteMask, onCreateAttribute }: {
  tool: ToolMode;
  onToolChange: (tool: ToolMode) => void;
  masks: EditorObject[];
  activeMaskId: string;
  onMaskSelect: (id: string) => void;
  onAddMask: () => void;
  onDuplicateMask: () => void;
  onDeleteMask: () => void;
  onCreateAttribute: (kind: ReferenceKind) => void;
}) {
  return (
    <aside className="left-sidebar">
      <Panel title="Object Picker">
        <div className="panel-toolbar"><SearchBox placeholder="Search objects..." /><Zap size={16} /></div>
        <SectionHeader title="SUPPORTED" />
        <div className="palette-grid supported">
          <PaletteCard label="Data Mask" icon={<LayoutPanelLeft size={24} />} selected={tool === 'data-mask'} onClick={() => onToolChange('data-mask')} />
          <PaletteCard label="Output String" icon={<Type size={24} />} selected={tool === 'output-string'} onClick={() => onToolChange('output-string')} />
          <PaletteCard label="Rectangle" icon={<Square size={24} />} selected={tool === 'rectangle'} onClick={() => onToolChange('rectangle')} />
        </div>
        <SectionHeader title="ATTRIBUTES" />
        <div className="palette-grid supported">
          <PaletteCard label="Line Attribute" icon={<PenLine size={24} />} onClick={() => onCreateAttribute('line-attribute')} />
          <PaletteCard label="Fill Attribute" icon={<Grid3X3 size={24} />} onClick={() => onCreateAttribute('fill-attribute')} />
          <PaletteCard label="Font Attribute" icon={<Type size={24} />} onClick={() => onCreateAttribute('font-attribute')} />
          <PaletteCard label="String Variable" icon={<ClipboardList size={24} />} onClick={() => onCreateAttribute('string-variable')} />
        </div>
        <SectionHeader title="INPUTS" />
        <div className="palette-grid">{disabledPalette.inputs.map((label, index) => <PaletteCard key={label} label={label} disabled icon={index === 0 ? <Archive size={24} /> : index === 1 ? <ClipboardList size={24} /> : index === 2 ? <Menu size={24} /> : <Square size={24} />} />)}</div>
        <SectionHeader title="OUTPUTS" />
        <div className="palette-grid"><PaletteCard label="Outpt String" disabled icon={<span className="abc">Abc</span>} />{disabledPalette.outputs.map((label, index) => <PaletteCard key={label} label={label} disabled icon={index === 0 ? <Circle size={24} /> : index === 1 ? <AlignCenter size={24} /> : <Image size={24} />} />)}</div>
        <SectionHeader title="SHAPES" />
        <div className="palette-grid"><PaletteCard label="Rectangle" icon={<Square size={24} />} selected={tool === 'rectangle'} onClick={() => onToolChange('rectangle')} />{disabledPalette.shapes.map((label, index) => <PaletteCard key={label} label={label} disabled icon={index === 0 ? <Circle size={24} /> : index === 1 ? <PenLine size={24} /> : <Triangle size={24} />} />)}</div>
      </Panel>

      <Panel title="Masks">
        <div className="tabs"><button className="active">Data Masks</button><button>Soft Key Masks</button><button>Alarm Masks</button></div>
        <SearchBox placeholder="Search data masks..." />
        <div className="list">
          {masks.map((mask) => (
            <button key={mask.id} className={`list-row ${mask.id === activeMaskId ? 'selected' : ''}`} onClick={() => onMaskSelect(mask.id)}>
              <LayoutPanelLeft size={14} /><span className="mono-id">{mask.id}</span><span>{mask.name}</span><Eye size={14} /><MoreVertical size={14} />
            </button>
          ))}
        </div>
        <div className="panel-actions"><button onClick={onAddMask}><Plus size={18} /></button><button onClick={onDuplicateMask}><Copy size={18} /></button><button><Folder size={18} /></button><button onClick={onDeleteMask}><Trash2 size={18} /></button></div>
      </Panel>
    </aside>
  );
}
