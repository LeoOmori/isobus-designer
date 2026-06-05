import { Archive, ChevronDown, ChevronRight, Eye, EyeOff, Grid3X3, Keyboard, MoreVertical, Trash2, Zap } from 'lucide-react';
import { useState } from 'react';
import { KindIcon } from '../domain/objectMeta';
import { getMaskChildren, getReferenceObjects, getSoftKeyMaskKeys } from '../domain/selectors';
import type { ProjectState } from '../domain/types';
import { Panel, SearchBox } from '../ui/primitives';

export function ObjectTree({
  project, selectedId, onSelect, onToggleVisible, onToggleWorkingSetVisible, onDelete,
}: {
  project: ProjectState;
  selectedId: string;
  onSelect: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onToggleWorkingSetVisible: () => void;
  onDelete: (id: string) => void;
}) {
  const masks       = project.objects.filter((o) => o.kind === 'data-mask');
  const softKeyMasks = project.objects.filter((o) => o.kind === 'soft-key-mask');
  const attributes  = getReferenceObjects(project);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ WS_1: true });

  function isExpanded(id: string) { return expanded[id] ?? true; }
  function toggle(id: string) { setExpanded((s) => ({ ...s, [id]: !isExpanded(id) })); }

  return (
    <Panel title="Tree Object Menu">
      <div className="panel-toolbar"><SearchBox placeholder="Search objects..." /><Zap size={16} /></div>
      <div className="tree">

        {/* ── Working Set root ── */}
        <div className={`tree-row root ${selectedId === project.workingSet.id ? 'selected' : ''}`}>
          <button className="tree-chevron" onClick={() => toggle(project.workingSet.id)}>
            {isExpanded(project.workingSet.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <button className="tree-select" onClick={() => onSelect(project.workingSet.id)}>
            <Archive size={15} /><span>{project.workingSet.name} ({project.workingSet.id})</span>
          </button>
          <button onClick={onToggleWorkingSetVisible}>
            {project.workingSet.visible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <span />
        </div>

        {isExpanded(project.workingSet.id) && (
          <>
            {/* ── Data Masks ── */}
            {masks.map((mask) => (
              <div key={mask.id}>
                <div className={`tree-row mask ${selectedId === mask.id ? 'selected' : ''}`}>
                  <button className="tree-chevron" onClick={() => toggle(mask.id)}>
                    {isExpanded(mask.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <button className="tree-select" onClick={() => onSelect(mask.id)}>
                    <KindIcon kind="data-mask" size={15} /><span>{mask.name}</span>
                  </button>
                  <button onClick={() => onToggleVisible(mask.id)}>{mask.visible ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                  <button onClick={() => onDelete(mask.id)}><MoreVertical size={14} /></button>
                </div>
                {isExpanded(mask.id) && getMaskChildren(project, mask.id).map((child) => (
                  <div key={child.id} className={`tree-row child ${selectedId === child.id ? 'selected' : ''}`}>
                    <button className="tree-select" onClick={() => onSelect(child.id)}>
                      <KindIcon kind={child.kind} /><span>{child.name}</span>
                    </button>
                    <button onClick={() => onToggleVisible(child.id)}>{child.visible ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                    <button onClick={() => onDelete(child.id)}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            ))}

            {/* ── Soft Key Masks ── */}
            {softKeyMasks.map((skm) => (
              <div key={skm.id}>
                <div className={`tree-row mask ${selectedId === skm.id ? 'selected' : ''}`}>
                  <button className="tree-chevron" onClick={() => toggle(skm.id)}>
                    {isExpanded(skm.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <button className="tree-select" onClick={() => onSelect(skm.id)}>
                    <Keyboard size={15} /><span>{skm.name}</span>
                  </button>
                  <button onClick={() => onToggleVisible(skm.id)}>{skm.visible ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                  <button onClick={() => onDelete(skm.id)}><MoreVertical size={14} /></button>
                </div>
                {isExpanded(skm.id) && getSoftKeyMaskKeys(project, skm.id).map((key) => (
                  <div key={key.id} className={`tree-row child ${selectedId === key.id ? 'selected' : ''}`}>
                    <button className="tree-select" onClick={() => onSelect(key.id)}>
                      <KindIcon kind={key.kind} /><span>{key.name}</span>
                    </button>
                    <span />
                    <button onClick={() => onDelete(key.id)}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            ))}

            {/* ── Attribute Objects ── */}
            {attributes.length > 0 && (
              <div>
                <div className="tree-row root attributes-row">
                  <button className="tree-chevron" onClick={() => toggle('ATTRIBUTES')}>
                    {isExpanded('ATTRIBUTES') ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <button className="tree-select" onClick={() => toggle('ATTRIBUTES')}>
                    <Grid3X3 size={15} /><span>Attribute Objects</span>
                  </button>
                  <span /><span />
                </div>
                {isExpanded('ATTRIBUTES') && attributes.map((attr) => (
                  <div key={attr.id} className={`tree-row child ${selectedId === attr.id ? 'selected' : ''}`}>
                    <button className="tree-select" onClick={() => onSelect(attr.id)}>
                      <KindIcon kind={attr.kind} /><span>{attr.name}</span>
                    </button>
                    <span />
                    <button onClick={() => onDelete(attr.id)}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Panel>
  );
}
