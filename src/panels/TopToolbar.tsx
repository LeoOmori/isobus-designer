import { Box, Crosshair, Download, File, Grid3X3, Hand, Hash, Image, Minus, MousePointer2, MousePointerClick, Plus, Redo2, Save, Square, Type, Undo2 } from 'lucide-react';
import type { ToolMode } from '../domain/types';
import { ToolButton } from '../ui/primitives';

export function TopToolbar({ tool, onToolChange, zoom, onZoom, onReset, onUndo, onRedo, canUndo, canRedo, onSave, onExport, onExportIop }: {
  tool: ToolMode;
  onToolChange: (tool: ToolMode) => void;
  zoom: number;
  onZoom: (zoom: number) => void;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSave: () => void;
  onExport: () => void;
  onExportIop: () => void;
}) {
  return (
    <header className="topbar">
      <div className="brand"><div className="app-logo"><Box size={20} /></div><span>ISOBUS IOP Editor</span></div>
      <div className="top-icons left-tools">
        <button title="New project" onClick={onReset}><File size={20} /></button>
        <button title="Save project" onClick={onSave}><Save size={20} /></button>
        <span className="divider" />
        <button title="Undo" disabled={!canUndo} onClick={onUndo}><Undo2 size={20} /></button>
        <button title="Redo" disabled={!canRedo} onClick={onRedo}><Redo2 size={20} /></button>
      </div>
      <div className="canvas-tools">
        <ToolButton active={tool === 'select'}           onClick={() => onToolChange('select')}           title="Select">          <MousePointer2 size={20} /></ToolButton>
        <ToolButton active={tool === 'pan'}              onClick={() => onToolChange('pan')}              title="Pan">             <Hand size={20} /></ToolButton>
        <span className="divider" />
        <ToolButton active={tool === 'container'}        onClick={() => onToolChange('container')}        title="Container">       <Grid3X3 size={20} /></ToolButton>
        <ToolButton active={tool === 'output-rectangle'} onClick={() => onToolChange('output-rectangle')} title="Output Rectangle"><Square size={20} /></ToolButton>
        <ToolButton active={tool === 'output-string'}    onClick={() => onToolChange('output-string')}    title="Output String">   <Type size={20} /></ToolButton>
        <ToolButton active={tool === 'output-number'}    onClick={() => onToolChange('output-number')}    title="Output Number">   <Hash size={20} /></ToolButton>
        <ToolButton active={tool === 'button'}           onClick={() => onToolChange('button')}           title="Button">          <MousePointerClick size={20} /></ToolButton>
        <ToolButton active={tool === 'picture-graphic'}  onClick={() => onToolChange('picture-graphic')}  title="Picture Graphic"> <Image size={20} /></ToolButton>
      </div>
      <div className="top-center">
        <button onClick={() => onZoom(zoom - 0.1)}><Minus size={17} /></button>
        <strong>{Math.round(zoom * 100)}%</strong>
        <button onClick={() => onZoom(zoom + 0.1)}><Plus size={17} /></button>
      </div>
      <button className="small-standalone" onClick={() => onZoom(1)}><Crosshair size={18} /></button>
      <div className="top-actions">
        <button className="export" onClick={onExport}><Download size={18} />Export JSON</button>
        <button className="export export-iop" onClick={onExportIop}><Download size={18} />Export IOP</button>
      </div>
    </header>
  );
}
