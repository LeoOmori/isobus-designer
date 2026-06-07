import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export function SearchBox({ placeholder }: { placeholder: string }) {
  return <div className="search-box"><Search size={15} /><span>{placeholder}</span></div>;
}

export function SectionHeader({ title }: { title: string }) {
  return <div className="section-title">{title}</div>;
}

export function Panel({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`panel${className ? ` ${className}` : ''}`}>
      <div className="panel-header"><strong>{title}</strong><X size={16} /></div>
      <div className="panel-body">{children}</div>
    </section>
  );
}

export function ToolButton({ children, active, onClick, title }: { children: ReactNode; active?: boolean; onClick?: () => void; title?: string }) {
  return (
    <button
      title={title}
      className={`canvas-tool-button ${active ? 'active' : ''}`}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
    >
      {children}
    </button>
  );
}

export function PaletteCard({ label, icon, selected, disabled, onClick }: { label: string; icon: ReactNode; selected?: boolean; disabled?: boolean; onClick?: () => void }) {
  return <button className={`palette-card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`} onClick={onClick} disabled={disabled}>{icon}<span>{label}</span></button>;
}

/* ──────────────────────────────────────────────────────────────────────
   ResizableSplit — draggable divider between two vertical panels
   ────────────────────────────────────────────────────────────────────── */

export function ResizableSplit({
  children,
  defaultTopHeight = 250,
  minTopHeight = 80,
  minBottomHeight = 80,
}: {
  children: [ReactNode, ReactNode];
  defaultTopHeight?: number;
  minTopHeight?: number;
  minBottomHeight?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [topHeight, setTopHeight] = useState(defaultTopHeight);
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ y: 0, height: 0 });
  const topHeightRef = useRef(topHeight);
  topHeightRef.current = topHeight;

  // Clamp initial height after mount so it doesn't overflow the sidebar
  useLayoutEffect(() => {
    if (containerRef.current) {
      const avail = containerRef.current.getBoundingClientRect().height;
      setTopHeight((h) => Math.min(h, Math.max(minTopHeight, avail - minBottomHeight)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onHandleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    dragStartRef.current = { y: e.clientY, height: topHeightRef.current };
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function onMouseMove(e: MouseEvent) {
      if (!draggingRef.current) return;
      const c = containerRef.current;
      if (!c) return;
      const dy = e.clientY - dragStartRef.current.y;
      const avail = c.getBoundingClientRect().height;
      const newHeight = Math.max(
        minTopHeight,
        Math.min(dragStartRef.current.height + dy, avail - minBottomHeight),
      );
      setTopHeight(newHeight);
    }

    function onMouseUp() {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [minTopHeight, minBottomHeight]);

  return (
    <div ref={containerRef} className="resizable-split">
      <div className="resizable-split-top" style={{ height: topHeight }}>
        {children[0]}
      </div>
      <button type="button" className="resize-handle-bar" tabIndex={-1} onMouseDown={onHandleMouseDown} />
      <div className="resizable-split-bottom">
        {children[1]}
      </div>
    </div>
  );
}
