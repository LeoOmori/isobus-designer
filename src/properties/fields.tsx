import { Bold, ChevronDown, ChevronRight, Italic, Lock, Type, Underline } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { nearestVtColorIndex, vtColor } from '../domain/isobus';

export function Field({ label, value, onChange, type = 'text', disabled }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; disabled?: boolean }) {
  return <label className="field"><span>{label}</span><div className="field-input editable"><input disabled={disabled} type={type} value={value} onChange={(event) => onChange(event.target.value)} />{disabled && <Lock size={14} />}</div></label>;
}

export function CheckboxField({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  return <label className="field checkbox-field"><span>{label}</span><div className="field-input editable checkbox-input"><input disabled={disabled} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /></div></label>;
}

export function IconToggleField<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string; icon: ReactNode }[]; onChange: (value: T) => void }) {
  return (
    <div className="field wysiwyg-field">
      <span>{label}</span>
      <div className="icon-toggle-group">
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            className={value === option.value ? 'active' : ''}
            onClick={() => onChange(option.value)}
            title={option.label}
          >
            {option.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

export function IconCheckboxField({ label, checked, onChange, icon, title = label, disabled }: { label: string; checked: boolean; onChange: (checked: boolean) => void; icon: ReactNode; title?: string; disabled?: boolean }) {
  return (
    <button type="button" className={`option-chip ${checked ? 'active' : ''}`} disabled={disabled} onClick={() => onChange(!checked)} title={title}>
      {icon}<span>{label}</span>
    </button>
  );
}

export function VtColorField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="field-input editable color-index-input">
        <input type="color" value={vtColor(value)} onChange={(event) => onChange(nearestVtColorIndex(event.target.value))} />
        <span>Index {value}</span>
      </div>
    </label>
  );
}

export function FontStyleField({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  function toggle(bit: number, checked: boolean) {
    onChange(checked ? value | bit : value & ~bit);
  }

  return (
    <div className="field font-style-field wysiwyg-field">
      <span>Font Style</span>
      <div className="icon-toggle-group font-style-options">
        <button type="button" className={value === 0 ? 'active' : ''} onClick={() => onChange(0)} title="Normal"><Type size={15} /></button>
        <button type="button" className={value & 1 ? 'active' : ''} onClick={() => toggle(1, !(value & 1))} title="Bold"><Bold size={15} /></button>
        <button type="button" className={value & 2 ? 'active' : ''} onClick={() => toggle(2, !(value & 2))} title="Italic"><Italic size={15} /></button>
        <button type="button" className={value & 4 ? 'active' : ''} onClick={() => toggle(4, !(value & 4))} title="Underline"><Underline size={15} /></button>
      </div>
    </div>
  );
}

export function SelectField({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  return <label className="field"><span>{label}</span><div className="field-input editable"><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div></label>;
}

export function PropertySection({ title, children, defaultOpen = true }: { title: string; children?: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`property-section ${open ? 'open' : ''}`}>
      <button type="button" className="property-heading" onClick={() => setOpen((current) => !current)}>
        <span>{title}</span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && children}
    </div>
  );
}
