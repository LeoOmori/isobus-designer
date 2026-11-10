import { AlertCircle, X } from 'lucide-react';

export function ExportErrorsDialog({ errors, onClose, title = 'Export failed' }: {
  errors: string[];
  title?: string;
  onClose: () => void;
}) {
  return (
    <div className="export-modal-backdrop" onClick={onClose}>
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="export-modal-header">
          <div className="export-modal-title">
            <AlertCircle size={18} className="export-modal-icon" />
            <strong>{title} — {errors.length} issue{errors.length !== 1 ? 's' : ''}</strong>
          </div>
          <button className="export-modal-close" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </div>
        <p className="export-modal-hint">
          Fix the following before exporting:
        </p>
        <ul className="export-errors-list">
          {errors.map((err, i) => (
            <li key={i} className="export-error-item">{err}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
