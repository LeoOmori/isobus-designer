import { X } from 'lucide-react';
import { objectRegistry } from '../objects/registry';

const CATEGORY_LABELS: Record<string, string> = {
  screen: 'Screens',
  group: 'Groups',
  output: 'Outputs',
  input: 'Inputs',
  attribute: 'Attributes',
  variable: 'Variables',
};

const CATEGORY_ORDER = ['screen', 'group', 'output', 'input', 'attribute', 'variable'];

export function AboutDialog({ onClose }: { onClose: () => void }) {
  const grouped: Record<string, { kind: string; name: string }[]> = {};
  for (const cat of CATEGORY_ORDER) grouped[cat] = [];

  for (const [kind, module] of Object.entries(objectRegistry)) {
    const cat = module.meta.category;
    if (grouped[cat]) {
      grouped[cat].push({ kind, name: module.meta.name });
    }
  }

  return (
    <div className="about-backdrop" onClick={onClose}>
      <div className="about-modal" onClick={(e) => e.stopPropagation()}>
        <div className="about-header">
          <h1 className="about-title">ISOBUS Suite</h1>
          <button className="about-close" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>
        <div className="about-body">
          <p className="about-version">Version 0.1.0</p>
          <section className="about-section">
            <h2 className="about-section-title">Implemented Objects</h2>
            {CATEGORY_ORDER.map((cat) => {
              const items = grouped[cat];
              if (items.length === 0) return null;
              return (
                <div key={cat} className="about-category">
                  <h3 className="about-category-title">{CATEGORY_LABELS[cat]}</h3>
                  <ul className="about-object-list">
                    {items.map((item) => (
                      <li key={item.kind}>{item.name}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
        </div>
      </div>
    </div>
  );
}
