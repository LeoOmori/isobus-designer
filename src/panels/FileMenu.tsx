import { ChevronDown, Download, FileCode, FilePlus, FolderOpen, Save } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

export type FileMenuActions = {
  onNewProject: () => void;
  onOpenProject: (file: File) => void;
  onSaveProject: () => void;
  onExportIop: () => void;
  onExportXml: () => void;
};

/** Top-bar "File" dropdown: project new/open/save + pool exports. */
export function FileMenu({ onNewProject, onOpenProject, onSaveProject, onExportIop, onExportXml }: FileMenuActions) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const item = (icon: ReactNode, label: string, action: () => void, hint?: string) => (
    <button type="button" className="file-menu-item" onClick={() => { setOpen(false); action(); }}>
      {icon}
      <span>{label}</span>
      {hint && <small>{hint}</small>}
    </button>
  );

  return (
    <div className="file-menu" ref={root}>
      <button ref={trigger} type="button" className="file-menu-trigger" aria-expanded={open} aria-controls="file-menu-panel" onClick={() => setOpen((v) => !v)}>
        File<ChevronDown size={14} />
      </button>
      {open && (
        <div id="file-menu-panel" className="file-menu-panel">
          {item(<FilePlus size={16} />, 'New project', onNewProject)}
          {item(<FolderOpen size={16} />, 'Open project…', () => fileInput.current?.click(), '.json')}
          {item(<Save size={16} />, 'Save project', onSaveProject, '.json')}
          <hr />
          {item(<Download size={16} />, 'Export IOP', onExportIop, '.iop')}
          {item(<FileCode size={16} />, 'Export XML', onExportXml, 'vt2iso .zip')}
        </div>
      )}
      <input
        ref={fileInput}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ''; // allow re-opening the same file
          if (file) onOpenProject(file);
        }}
      />
    </div>
  );
}
