import { Search, X } from 'lucide-react';
import type { ReactNode } from 'react';

export function SearchBox({ placeholder }: { placeholder: string }) {
  return <div className="search-box"><Search size={15} /><span>{placeholder}</span></div>;
}

export function SectionHeader({ title }: { title: string }) {
  return <div className="section-title">{title}</div>;
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="panel"><div className="panel-header"><strong>{title}</strong><X size={16} /></div>{children}</section>;
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
