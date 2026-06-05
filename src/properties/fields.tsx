import { ChevronDown, ChevronRight, Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { nearestVtColorIndex, vtColor } from '../domain/isobus';

export function Field({ label, value, onChange, type = 'text', disabled }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; disabled?: boolean }) {
  return <label className="field"><span>{label}</span><div className="field-input editable"><input disabled={disabled} type={type} value={value} onChange={(event) => onChange(event.target.value)} />{disabled && <Lock size={14} />}</div></label>;
}

export function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="field"><span>{label}</span><div className="field-input editable"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /></div></label>;
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
    <div className="field font-style-field">
      <span>Font Style</span>
      <div className="font-style-options">
        <label><input type="checkbox" checked={value === 0} onChange={(event) => onChange(event.target.checked ? 0 : value)} />Normal</label>
        <label><input type="checkbox" checked={Boolean(value & 1)} onChange={(event) => toggle(1, event.target.checked)} />Bold</label>
        <label><input type="checkbox" checked={Boolean(value & 2)} onChange={(event) => toggle(2, event.target.checked)} />Italic</label>
        <label><input type="checkbox" checked={Boolean(value & 4)} onChange={(event) => toggle(4, event.target.checked)} />Underline</label>
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
      <button className="property-heading" onClick={() => setOpen((current) => !current)}>
        <span>{title}</span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && children}
    </div>
  );
}
