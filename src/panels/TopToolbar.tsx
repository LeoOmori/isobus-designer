import { Crosshair, Eye, EyeOff, Hand, Info, Minus, MousePointer2, Plus, Redo2, Undo2 } from 'lucide-react';
import type { ToolMode } from '../domain/types';
import { ToolButton } from '../ui/primitives';
import { FileMenu, type FileMenuActions } from './FileMenu';
import logoSrc from '../assets/logo.png';

export function TopToolbar({ fileActions, tool, onToolChange, zoom, onZoom, sidebarsVisible, onToggleSidebars, onUndo, onRedo, canUndo, canRedo, vtVersion, onVtVersionChange, onAbout }: {
  tool: ToolMode;
  onToolChange: (tool: ToolMode) => void;
  zoom: number;
  onZoom: (zoom: number) => void;
  fileActions: FileMenuActions;
  sidebarsVisible: boolean;
  onToggleSidebars: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  vtVersion: 3 | 4;
  onVtVersionChange: (v: 3 | 4) => void;
  onAbout: () => void;
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
        <span className="divider" />
        <button type="button" className="zoom-btn" onClick={() => onZoom(zoom - 0.1)}><Minus size={17} /></button>
        <strong className="zoom-label">{Math.round(zoom * 100)}%</strong>
        <button type="button" className="zoom-btn" onClick={() => onZoom(zoom + 0.1)}><Plus size={17} /></button>
        <button type="button" className="zoom-btn" onClick={() => onZoom(1)}><Crosshair size={17} /></button>
      </div>
      <div className="top-actions">
        <FileMenu {...fileActions} />
        <label className="top-action-select" title="VT version target for export">
          <span>VT</span>
          <select value={String(vtVersion)} onChange={(e) => onVtVersionChange(Number(e.target.value) as 3 | 4)}>
            <option value="3">v3</option>
            <option value="4">v4</option>
          </select>
        </label>
        <button type="button" className="about-btn" onClick={onAbout} title="About"><Info size={18} /></button>
      </div>
    </header>
  );
}
