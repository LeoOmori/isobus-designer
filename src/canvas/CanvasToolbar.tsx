import { Circle, Grid3X3, Hand, Image, Maximize, Menu, MousePointer2, PenLine, Square, Type } from 'lucide-react';
import type { ToolMode } from '../domain/types';
import { ToolButton } from '../ui/primitives';

export function CanvasToolbar({ tool, onToolChange }: { tool: ToolMode; onToolChange: (tool: ToolMode) => void }) {
  return (
    <div className="canvas-toolbar" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
      <ToolButton active={tool === 'select'} onClick={() => onToolChange('select')} title="Select"><MousePointer2 size={20} /></ToolButton>
      <ToolButton active={tool === 'pan'} onClick={() => onToolChange('pan')} title="Pan"><Hand size={20} /></ToolButton>
      <ToolButton active={tool === 'rectangle'} onClick={() => onToolChange('rectangle')} title="Rectangle"><Square size={20} /></ToolButton>
      <ToolButton><Circle size={20} /></ToolButton><ToolButton><PenLine size={20} /></ToolButton><ToolButton><Square size={20} className="diamond" /></ToolButton>
      <ToolButton active={tool === 'output-string'} onClick={() => onToolChange('output-string')} title="Output String"><Type size={20} /></ToolButton>
      <ToolButton><Image size={20} /></ToolButton><ToolButton><Maximize size={20} /></ToolButton><ToolButton><Menu size={20} /></ToolButton>
    </div>
  );
}

export function BottomControls({ zoom, onZoom }: { zoom: number; onZoom: (zoom: number) => void }) {
  return (
    <div className="bottom-controls" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
      <Hand size={18} /><Grid3X3 size={18} />
      <button onClick={() => onZoom(zoom - 0.1)}>-</button>
      <strong>{Math.round(zoom * 100)}%</strong>
      <button onClick={() => onZoom(zoom + 0.1)}>+</button>
      <span className="gap" /><Maximize size={18} /><Grid3X3 size={18} /><Menu size={18} />
    </div>
  );
}
