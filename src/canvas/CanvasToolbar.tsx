import { Grid3X3, Hand, Hash, Image, Maximize, Menu, MousePointer2, MousePointerClick, Square, Type } from 'lucide-react';
import type { ToolMode } from '../domain/types';
import { ToolButton } from '../ui/primitives';

export function CanvasToolbar({ tool, onToolChange }: { tool: ToolMode; onToolChange: (tool: ToolMode) => void }) {
  return (
    <div className="canvas-toolbar" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
      <ToolButton active={tool === 'select'}           onClick={() => onToolChange('select')}           title="Select">          <MousePointer2 size={20} /></ToolButton>
      <ToolButton active={tool === 'pan'}              onClick={() => onToolChange('pan')}              title="Pan">             <Hand size={20} /></ToolButton>
      <ToolButton active={tool === 'container'}        onClick={() => onToolChange('container')}        title="Container">       <Grid3X3 size={20} /></ToolButton>
      <ToolButton active={tool === 'output-rectangle'} onClick={() => onToolChange('output-rectangle')} title="Output Rectangle"><Square size={20} /></ToolButton>
      <ToolButton active={tool === 'output-string'}    onClick={() => onToolChange('output-string')}    title="Output String">   <Type size={20} /></ToolButton>
      <ToolButton active={tool === 'output-number'}    onClick={() => onToolChange('output-number')}    title="Output Number">   <Hash size={20} /></ToolButton>
      <ToolButton active={tool === 'button'}           onClick={() => onToolChange('button')}           title="Button">          <MousePointerClick size={20} /></ToolButton>
      <ToolButton active={tool === 'picture-graphic'}  onClick={() => onToolChange('picture-graphic')}  title="Picture Graphic"> <Image size={20} /></ToolButton>
    </div>
  );
}

export function BottomControls({ zoom, onZoom }: { zoom: number; onZoom: (zoom: number) => void }) {
  return (
    <div className="bottom-controls" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
      <Hand size={18} /><Grid3X3 size={18} />
      <button onClick={() => onZoom(zoom - 0.1)}>-</button>
      <strong>{Math.round(zoom * 100)}%</strong>
      <button onClick={() => onZoom(zoom + 0.1)}>+</button>
      <span className="gap" /><Maximize size={18} /><Grid3X3 size={18} /><Menu size={18} />
    </div>
  );
}
