import { Box, Crosshair, Download, File, Minus, Play, Plus, Redo2, Save, Settings, Undo2, Upload } from 'lucide-react';

export function TopToolbar({ zoom, onZoom, onReset, onUndo, onRedo, canUndo, canRedo, onSave, onExport }: {
  zoom: number;
  onZoom: (zoom: number) => void;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSave: () => void;
  onExport: () => void;
}) {
  return (
    <header className="topbar">
      <div className="brand"><div className="app-logo"><Box size={20} /></div><span>ISOBUS IOP Editor</span></div>
      <div className="top-icons left-tools">
        <button title="New project" onClick={onReset}><File size={20} /></button>
        <button title="Save project" onClick={onSave}><Save size={20} /></button>
        <button title="Import placeholder"><Upload size={20} /></button>
        <span className="divider" />
        <button title="Undo" disabled={!canUndo} onClick={onUndo}><Undo2 size={20} /></button>
        <button title="Redo" disabled={!canRedo} onClick={onRedo}><Redo2 size={20} /></button>
      </div>
      <div className="top-center">
        <button onClick={() => onZoom(zoom - 0.1)}><Minus size={17} /></button>
        <strong>{Math.round(zoom * 100)}%</strong>
        <button onClick={() => onZoom(zoom + 0.1)}><Plus size={17} /></button>
      </div>
      <button className="small-standalone" onClick={() => onZoom(1)}><Crosshair size={18} /></button>
      <div className="top-actions">
        <button className="preview"><Play size={18} />Preview</button>
        <button className="export" onClick={onExport}><Download size={18} />Export JSON</button>
        <Settings size={20} />
      </div>
    </header>
  );
}
