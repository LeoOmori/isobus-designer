import { Grid3X3, Hand, Maximize, Menu } from 'lucide-react';

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
