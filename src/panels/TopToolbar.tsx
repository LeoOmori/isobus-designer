import { Crosshair, Download, Eye, EyeOff, Grid3X3, Hand, Hash, Image, List, Minus, MousePointer2, MousePointerClick, Plus, Redo2, Square, TextCursorInput, ToggleLeft, Type, Undo2 } from 'lucide-react';
import type { ToolMode } from '../domain/types';
import { ToolButton } from '../ui/primitives';
import logoSrc from '../assets/logo.png';

export function TopToolbar({ tool, onToolChange, zoom, onZoom, onExportIop, sidebarsVisible, onToggleSidebars, onUndo, onRedo, canUndo, canRedo, vtVersion, onVtVersionChange }: {
  tool: ToolMode;
  onToolChange: (tool: ToolMode) => void;
  zoom: number;
  onZoom: (zoom: number) => void;
  onExportIop: () => void;
  sidebarsVisible: boolean;
  onToggleSidebars: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  vtVersion: 3 | 4;
  onVtVersionChange: (v: 3 | 4) => void;
}) {
  return (
    <header className="topbar">
      <div className="brand"><div className="app-logo"><img src={logoSrc} alt="ISOBUS IOP Editor" /></div></div>
      <div className="canvas-tools">
        <button type="button" className="panels-toggle" onClick={onToggleSidebars} title={sidebarsVisible ? 'Hide panels' : 'Show panels'}>{sidebarsVisible ? <Eye size={18} /> : <EyeOff size={18} />}</button>
        <span className="divider" />
        <button type="button" className="canvas-tool-button" onClick={onUndo} disabled={!canUndo} title="Undo"><Undo2 size={18} /></button>
        <button type="button" className="canvas-tool-button" onClick={onRedo} disabled={!canRedo} title="Redo"><Redo2 size={18} /></button>
        <span className="divider" />
        <ToolButton active={tool === 'select'}           onClick={() => onToolChange('select')}           title="Select">          <MousePointer2 size={20} /></ToolButton>
        <ToolButton active={tool === 'pan'}              onClick={() => onToolChange('pan')}              title="Pan">             <Hand size={20} /></ToolButton>
        <span className="divider" />
        <ToolButton active={tool === 'container'}        onClick={() => onToolChange('container')}        title="Container">       <Grid3X3 size={20} /></ToolButton>
        <ToolButton active={tool === 'output-rectangle'} onClick={() => onToolChange('output-rectangle')} title="Output Rectangle"><Square size={20} /></ToolButton>
        <ToolButton active={tool === 'output-string'}    onClick={() => onToolChange('output-string')}    title="Output String">   <Type size={20} /></ToolButton>
        <ToolButton active={tool === 'output-number'}    onClick={() => onToolChange('output-number')}    title="Output Number">   <Hash size={20} /></ToolButton>
        <ToolButton active={tool === 'button'}           onClick={() => onToolChange('button')}           title="Button">          <MousePointerClick size={20} /></ToolButton>
        <ToolButton active={tool === 'input-boolean'}    onClick={() => onToolChange('input-boolean')}    title="Input Boolean">   <ToggleLeft size={20} /></ToolButton>
        <ToolButton active={tool === 'input-string'}     onClick={() => onToolChange('input-string')}     title="Input String">    <TextCursorInput size={20} /></ToolButton>
        <ToolButton active={tool === 'input-number'}    onClick={() => onToolChange('input-number')}     title="Input Number">    <Hash size={20} /></ToolButton>
        <ToolButton active={tool === 'input-list'}      onClick={() => onToolChange('input-list')}       title="Input List">      <List size={20} /></ToolButton>
        <ToolButton active={tool === 'picture-graphic'}  onClick={() => onToolChange('picture-graphic')}  title="Picture Graphic"> <Image size={20} /></ToolButton>
        <span className="divider" />
        <button type="button" className="zoom-btn" onClick={() => onZoom(zoom - 0.1)}><Minus size={17} /></button>
        <strong className="zoom-label">{Math.round(zoom * 100)}%</strong>
        <button type="button" className="zoom-btn" onClick={() => onZoom(zoom + 0.1)}><Plus size={17} /></button>
        <button type="button" className="zoom-btn" onClick={() => onZoom(1)}><Crosshair size={17} /></button>
      </div>
      <div className="top-actions">
        <label className="top-action-select" title="VT version target for export">
          <span>VT</span>
          <select value={String(vtVersion)} onChange={(e) => onVtVersionChange(Number(e.target.value) as 3 | 4)}>
            <option value="3">v3</option>
            <option value="4">v4</option>
          </select>
        </label>
        <button type="button" className="export export-iop" onClick={onExportIop}><Download size={18} />Export IOP</button>
      </div>
    </header>
  );
}
