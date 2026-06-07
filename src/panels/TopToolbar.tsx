import { Box, Crosshair, Download, Eye, EyeOff, Grid3X3, Hand, Hash, Image, Minus, MousePointer2, MousePointerClick, Plus, Square, Type } from 'lucide-react';
import type { ToolMode } from '../domain/types';
import { ToolButton } from '../ui/primitives';

export function TopToolbar({ tool, onToolChange, zoom, onZoom, onExportIop, sidebarsVisible, onToggleSidebars }: {
  tool: ToolMode;
  onToolChange: (tool: ToolMode) => void;
  zoom: number;
  onZoom: (zoom: number) => void;
  onExportIop: () => void;
  sidebarsVisible: boolean;
  onToggleSidebars: () => void;
}) {
  return (
    <header className="topbar">
      <div className="brand"><div className="app-logo"><Box size={20} /></div><span>ISOBUS IOP Editor</span></div>
      <div className="canvas-tools">
        <button className="panels-toggle" onClick={onToggleSidebars} title={sidebarsVisible ? 'Hide panels' : 'Show panels'}>{sidebarsVisible ? <Eye size={18} /> : <EyeOff size={18} />}</button>
        <span className="divider" />
        <ToolButton active={tool === 'select'}           onClick={() => onToolChange('select')}           title="Select">          <MousePointer2 size={20} /></ToolButton>
        <ToolButton active={tool === 'pan'}              onClick={() => onToolChange('pan')}              title="Pan">             <Hand size={20} /></ToolButton>
        <span className="divider" />
        <ToolButton active={tool === 'container'}        onClick={() => onToolChange('container')}        title="Container">       <Grid3X3 size={20} /></ToolButton>
        <ToolButton active={tool === 'output-rectangle'} onClick={() => onToolChange('output-rectangle')} title="Output Rectangle"><Square size={20} /></ToolButton>
        <ToolButton active={tool === 'output-string'}    onClick={() => onToolChange('output-string')}    title="Output String">   <Type size={20} /></ToolButton>
        <ToolButton active={tool === 'output-number'}    onClick={() => onToolChange('output-number')}    title="Output Number">   <Hash size={20} /></ToolButton>
        <ToolButton active={tool === 'button'}           onClick={() => onToolChange('button')}           title="Button">          <MousePointerClick size={20} /></ToolButton>
        <ToolButton active={tool === 'picture-graphic'}  onClick={() => onToolChange('picture-graphic')}  title="Picture Graphic"> <Image size={20} /></ToolButton>
        <span className="divider" />
        <button className="zoom-btn" onClick={() => onZoom(zoom - 0.1)}><Minus size={17} /></button>
        <strong className="zoom-label">{Math.round(zoom * 100)}%</strong>
        <button className="zoom-btn" onClick={() => onZoom(zoom + 0.1)}><Plus size={17} /></button>
        <button className="zoom-btn" onClick={() => onZoom(1)}><Crosshair size={17} /></button>
      </div>
      <div className="top-actions">
        <button className="export export-iop" onClick={onExportIop}><Download size={18} />Export IOP</button>
      </div>
    </header>
  );
}
